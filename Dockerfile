# Use an official Node.js 18 image (Debian-based)
FROM node:18-buster

# Install dependencies (ffmpeg, python3-pip, yt-dlp, and pm2)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    curl && \
    pip3 install yt-dlp && \
    apt-get clean

# Install pm2 globally
RUN npm install -g pm2

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for efficient caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the ports your app runs on (e.g., 8080 and 8082)
EXPOSE 8080
EXPOSE 8082

# Command to run both app.js and videoDownloader.js using pm2
CMD ["pm2-runtime", "start", "app.js", "--name", "app", "start", "videoDownloader.js", "--name", "videoDownloader"]
