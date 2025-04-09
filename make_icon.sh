#!/bin/bash

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required but not installed. Please install ffmpeg first."
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build/icons

# Generate random color
COLOR=$(printf "%02x%02x%02x" $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256)))

# Check if icon exists
if [ ! -f "icon.png" ]; then
    echo "Generating new placeholder icon..."
    ffmpeg -f lavfi -i "color=#$COLOR:1920x1080" -vf "drawtext=text='Motor\nControl':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=48:fontcolor=white" -frames:v 1 icon.png -y
fi

# Resize to required sizes
echo "Resizing icons..."
sizes=(16 24 32 48 64 128 256 512 1024)
for size in "${sizes[@]}"; do
    ffmpeg -i icon.png -vf "scale=$size:$size" build/icons/${size}x${size}.png -y > /dev/null 2>&1
done

echo "Icons prepared in build/icons/"