#!/bin/sh

# Check if ffmpeg is installed
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "Error: ffmpeg is required but not installed. Please install ffmpeg first."
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build/icons

# Use fixed black background
COLOR=000000

# Check if icon exists
if [ ! -f "icon.png" ]; then
    echo "Generating new placeholder icon..."
    
    # Create temporary text file with newline
    TEXT_FILE=$(mktemp)
    printf "Motor\nControl" > "$TEXT_FILE"
    
    # Generate 1024x1024 base icon with full-square text
    ffmpeg -f lavfi -i "color=#$COLOR:1024x1024" \
      -vf "drawtext=textfile=$TEXT_FILE:
            x=(w-text_w)/2:
            y=(h-text_h)/2:
            fontsize=200:
            fontcolor=white:
            box=1:
            boxcolor=black@0:
            boxborderw=20:
            line_spacing=-30" \
      -frames:v 1 icon.png -y
    
    # Clean up temporary file
    rm "$TEXT_FILE"
fi

# Resize to required sizes
echo "Resizing icons..."
sizes="16 24 32 48 64 128 256 512 1024"
for size in $sizes; do
    ffmpeg -i icon.png -vf "scale=$size:$size:force_original_aspect_ratio=disable" \
      build/icons/${size}x${size}.png -y >/dev/null 2>&1
done

echo "Icons prepared in build/icons/"