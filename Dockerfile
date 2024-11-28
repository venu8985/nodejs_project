# Use an official Node.js 18 image (Debian-based)
FROM node:18-buster

# Install dependencies (ffmpeg, python3-pip, and yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3-pip \
    curl && \
    pip3 install yt-dlp && \
    apt-get clean

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for efficient caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app runs on (e.g., 8080)
EXPOSE 8080

# Command to run your app
CMD ["node", "app.js"]
