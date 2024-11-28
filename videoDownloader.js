module.exports = (app) => {
  const fs = require("fs");
  const path = require("path");
  const { exec } = require("child_process");
  const ffmpeg = require("fluent-ffmpeg");

  // Define the video download route
  app.get("/download-video", (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    const cleanUrl = url.trim();
    const tempFile = path.join(__dirname, `input_${Date.now()}.webm`); // Expecting .webm format
    const outputFile = tempFile.replace(".webm", ".mp4"); // Change the extension to .mp4 for final download

    exec("which yt-dlp", (err, stdout, stderr) => {
      if (err || stderr) {
        console.error("yt-dlp not found:", stderr || err.message);
        return res.status(500).json({ error: "yt-dlp not found in PATH" });
      }

      const ytDlpPath = "/usr/local/bin/yt-dlp";
      const command = `${ytDlpPath} -f bestvideo+bestaudio --output "${tempFile}" ${cleanUrl}`;

      console.log("yt-dlp command:", command);

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error("yt-dlp error:", stderr || err.message);
          return res
            .status(500)
            .json({ error: `yt-dlp error: ${stderr || err.message}` });
        }

        console.log("yt-dlp output:", stdout);

        // Check if the merged .webm file exists
        if (!fs.existsSync(tempFile)) {
          console.error("Output .webm file not found:", tempFile);
          return res.status(500).json({ error: "Merged video file not found" });
        }

        // Convert the .webm file to .mp4 using ffmpeg
        ffmpeg(tempFile)
          .output(outputFile)
          .on("end", () => {
            console.log(
              `Video conversion to MP4 completed. File is ready at ${outputFile}`
            );

            // Send the converted .mp4 file
            res.download(outputFile, (err) => {
              if (err) {
                console.error("File send error:", err.message);
                return res
                  .status(500)
                  .json({ error: "Failed to send video file" });
              }

              // Clean up temporary files after sending the file
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
          .run();
      });
    });
  });
};
