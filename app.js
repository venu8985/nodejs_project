const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const app = express();
const port = process.env.PORT || 8080;
app.get("/convert", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  // Log yt-dlp version to ensure it's available in the environment
  const { exec } = require("child_process");
  const path = require("path");

  // Replace this line
  const command = `yt-dlp -f bestaudio --output "${tempFile}" ${cleanUrl}`;

  // With this
  exec("which yt-dlp", (err, stdout, stderr) => {
    if (err || stderr) {
      console.error("Error finding yt-dlp:", stderr);
      return res.status(500).json({ error: "yt-dlp not found" });
    }

    // Get the full path of yt-dlp
    const ytDlpPath = stdout.trim();
    const command = `${ytDlpPath} -f bestaudio --output "${tempFile}" ${cleanUrl}`;

    // Execute the command
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("yt-dlp error:", stderr);
        return res.status(500).json({ error: `yt-dlp error: ${stderr}` });
      }

      console.log("yt-dlp download complete, starting conversion.");

      // After downloading, convert the file to mp3 using fluent-ffmpeg
      ffmpeg(tempFile)
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .on("end", () => {
          console.log("Conversion complete, sending file.");

          // Send the file back as a response
          res.download(outputFile, `output_${randomNumber}.mp3`, (err) => {
            if (err) {
              console.error("File send error:", err);
              return res.status(500).json({ error: "Failed to send the file" });
            }

            // Clean up the files after sending the response
            fs.unlinkSync(tempFile);
            fs.unlinkSync(outputFile);
          });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          return res
            .status(500)
            .json({ error: `FFmpeg error: ${err.message}` });
        })
        .on("progress", (progress) => {
          console.log(`Conversion progress: ${progress.percent}%`);
        })
        .save(outputFile);
    });
  });
});
