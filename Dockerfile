# Use the node:16-slim base image
FROM node:16-slim

# Set the working directory for the application
WORKDIR /usr/src/app

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip curl && \
    # Install yt-dlp
    pip3 install yt-dlp && \
    # Verify yt-dlp installation and path
    yt-dlp --version && \
    which yt-dlp

# Copy package.json and package-lock.json and install node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 8080 (or change this to match your app's port)
EXPOSE 8080

# Command to run the app
CMD ["node", "app.js"]
