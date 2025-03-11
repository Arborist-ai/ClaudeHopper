#!/bin/bash

# Script to copy necessary source files from lance-mcp-enhanced to claudehopper
# This preserves the core functionality while allowing for rebranding

echo "=== Copying source files from lance-mcp-enhanced to claudehopper ==="
echo ""

# Source directory
SRC_DIR="/Users/tfinlayson/Desktop/lance-mcp-enhanced"
DEST_DIR="/Users/tfinlayson/Desktop/claudehopper"

# Make sure destination directory exists
mkdir -p "$DEST_DIR"
mkdir -p "$DEST_DIR/src"
mkdir -p "$DEST_DIR/dist"
mkdir -p "$DEST_DIR/test"

# Copy source code directories
echo "Copying source code..."
cp -r "$SRC_DIR/src" "$DEST_DIR/"

# Copy configuration files
echo "Copying configuration files..."
cp "$SRC_DIR/tsconfig.json" "$DEST_DIR/"
cp "$SRC_DIR/claude_desktop_config.json" "$DEST_DIR/"

# Copy build outputs (if they exist)
if [ -d "$SRC_DIR/dist" ]; then
    echo "Copying build artifacts..."
    cp -r "$SRC_DIR/dist" "$DEST_DIR/"
fi

# Copy test files
if [ -d "$SRC_DIR/test" ]; then
    echo "Copying test files..."
    cp -r "$SRC_DIR/test" "$DEST_DIR/"
fi

# Copy license
if [ -f "$SRC_DIR/LICENSE" ]; then
    echo "Copying license..."
    cp "$SRC_DIR/LICENSE" "$DEST_DIR/"
fi

echo ""
echo "=== Copy completed successfully ==="
echo ""
echo "Next steps:"
echo "1. Make scripts executable: chmod +x *.sh"
echo "2. Run ClaudeHopper setup: ./run_now_preserve.sh"
echo ""
echo "Note: You may need to run 'npm install' in the claudehopper directory"
echo "to install dependencies before building or running the application."
