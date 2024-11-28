const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const app = express();

// Ensure you use the Render-provided port
const port = process.env.PORT;

app.get("/convert", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  const cleanUrl = url.trim(); // Add validation for the URL if needed
  const tempFile = `/tmp/input_${Date.now()}.webm`; // Ensure this path is valid
  const outputFile = `/tmp/output_${Date.now()}.mp3`;

  // Verify yt-dlp is available
  exec("which yt-dlp", (err, stdout, stderr) => {
    if (err || stderr) {
      console.error("yt-dlp not found:", stderr || err.message);
      return res.status(500).json({ error: "yt-dlp not found" });
    }

    const ytDlpPath = stdout.trim();
    const command = `${ytDlpPath} -f bestaudio --output "${tempFile}" ${cleanUrl}`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("yt-dlp error:", stderr);
        return res.status(500).json({ error: `yt-dlp error: ${stderr}` });
      }

      ffmpeg(tempFile)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .on("end", () => {
          res.download(outputFile, (err) => {
            if (err)
              return res.status(500).json({ error: "Failed to send file" });
            fs.unlinkSync(tempFile); // Clean up
            fs.unlinkSync(outputFile);
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          return res
            .status(500)
            .json({ error: `FFmpeg error: ${err.message}` });
        })
        .save(outputFile);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
