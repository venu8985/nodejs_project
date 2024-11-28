const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const app = express();

// Ensure you use Render's dynamic port or default to 8080
const port = process.env.PORT || 8080;

app.get("/convert", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  const cleanUrl = url.trim();
  const tempFile = `/tmp/input_${Date.now()}.webm`;
  const outputFile = `/tmp/output_${Date.now()}.mp3`;

  // Log system PATH for debugging
  console.log("System PATH:", process.env.PATH);

  exec("which yt-dlp", (err, stdout, stderr) => {
    console.log("which yt-dlp output:", stdout.trim());
    if (err || stderr) {
      console.error("yt-dlp not found:", stderr || err.message);
      return res.status(500).json({ error: "yt-dlp not found in PATH" });
    }

    const ytDlpPath = stdout.trim(); // Ensure yt-dlp path is correct
    console.log("yt-dlp path:", ytDlpPath);

    const command = `${ytDlpPath} -f bestaudio --output "${tempFile}" ${cleanUrl}`;

    // Execute yt-dlp command
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("yt-dlp error:", stderr || err.message);
        return res
          .status(500)
          .json({ error: `yt-dlp error: ${stderr || err.message}` });
      }

      // Convert to MP3 with FFmpeg
      ffmpeg(tempFile)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .on("end", () => {
          res.download(outputFile, (err) => {
            if (err) {
              console.error("File send error:", err.message);
              return res.status(500).json({ error: "Failed to send file" });
            }

            // Clean up temporary files
            fs.unlinkSync(tempFile);
            fs.unlinkSync(outputFile);
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
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
