const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const app = express();
const port = process.env.PORT || 8080;

// Define the endpoint to convert the video to mp3
app.get("/convert", (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  // Clean up the URL by removing any extra query parameters
  const cleanUrl = url.split("?")[0]; // Just the base YouTube URL
  const randomNumber = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
  const outputFile = path.join(__dirname, `output_${randomNumber}.mp3`);
  const tempFile = path.join(__dirname, "output.webm");

  console.log(`Starting download for URL: ${cleanUrl}`);

  // Use yt-dlp to download the best audio from the YouTube video
  const command = `yt-dlp -f bestaudio --output "${tempFile}" ${cleanUrl}`;

  // Execute yt-dlp command
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
        return res.status(500).json({ error: `FFmpeg error: ${err.message}` });
      })
      .on("progress", (progress) => {
        console.log(`Conversion progress: ${progress.percent}%`);
      })
      .save(outputFile);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
