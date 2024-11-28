FROM node:16-slim

# Set the working directory
WORKDIR /usr/src/app

# Install dependencies for yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y ffmpeg python3-pip && \
    pip3 install --upgrade pip && \
    pip3 install yt-dlp && \
    ln -s /usr/local/bin/yt-dlp /usr/bin/yt-dlp  # Ensure yt-dlp is in /usr/bin

# Copy package.json and install node modules
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["node", "app.js"]
