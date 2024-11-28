const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

module.exports = (app) => {
  // Ensure the downloads folder exists
  const tempDir = path.join(__dirname, "downloads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Define the video download route
  app.get("/download-video", (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    const cleanUrl = url.trim().split("?")[0]; // Remove any query parameters
    const tempFile = path.join(tempDir, `input_${Date.now()}.webm`); // Expecting .webm format
    const outputFile = tempFile.replace(".webm", ".mp4"); // Change the extension to .mp4 for final download

    // Check if yt-dlp is installed
    exec("which yt-dlp", (err, stdout, stderr) => {
      if (err || stderr) {
        console.error("yt-dlp not found:", stderr || err.message);
        return res.status(500).json({ error: "yt-dlp not found in PATH" });
      }

      const ytDlpPath = "/usr/local/bin/yt-dlp"; // Adjust this if needed
      const command = `${ytDlpPath} -f bestvideo+bestaudio --output "${tempFile}" ${cleanUrl} --verbose`;

      console.log("yt-dlp command:", command);

      exec(command, (err, stdout, stderr) => {
        // Log the output and error from yt-dlp to help debug
        console.log("yt-dlp stdout:", stdout);
        console.error("yt-dlp stderr:", stderr);

        if (err) {
          console.error("yt-dlp error:", stderr || err.message);
          return res
            .status(500)
            .json({ error: `yt-dlp error: ${stderr || err.message}` });
        }

        // Check if the merged .webm file exists
        if (!fs.existsSync(tempFile)) {
          console.error("Merged video file not found:", tempFile);
          return res
            .status(500)
            .json({
              error:
                "Merged video file not found. Check yt-dlp logs for errors.",
            });
        }

        // Convert the .webm file to .mp4 using ffmpeg
        ffmpeg(tempFile)
          .output(outputFile)
          .on("end", () => {
            console.log(
              `Video conversion to MP4 completed. File is ready at ${outputFile}`
            );

            // Send the converted .mp4 file to the client
            res.download(outputFile, (err) => {
              if (err) {
                console.error("File send error:", err.message);
                return res
                  .status(500)
                  .json({ error: "Failed to send video file" });
              }

              // Clean up temporary files after sending the file
              try {
                fs.unlinkSync(tempFile);
                fs.unlinkSync(outputFile);
              } catch (cleanupErr) {
                console.error("Error during cleanup:", cleanupErr.message);
              }
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
