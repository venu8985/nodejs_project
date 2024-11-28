# Stage 1: Build dependencies
FROM node:16-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Install dependencies for yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y ffmpeg python3-pip && \
    pip3 install --upgrade pip && \
    pip3 install yt-dlp

# Copy Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Stage 2: Create final image with necessary binaries
FROM node:16-slim

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies and files from the builder stage
COPY --from=builder /usr/src/app /usr/src/app

# Copy yt-dlp from the builder stage
COPY --from=builder /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp
COPY --from=builder /usr/bin/ffmpeg /usr/bin/ffmpeg

# Expose the port
# EXPOSE 8080

# Run the app
CMD ["node", "app.js"]
