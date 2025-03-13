#!/bin/bash

# Script to run the seed script with image extraction enabled

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}ClaudeHopper Image Extraction${NC}"
echo -e "${CYAN}=============================${NC}\n"

# Database and files directories
DB_DIR="/Users/tfinlayson/Desktop/PDFdrawings-MCP/Database"
FILES_DIR="/Users/tfinlayson/Desktop/PDFdrawings-MCP/InputDocs/Drawings"

# Check if directories exist
if [ ! -d "$FILES_DIR" ]; then
    echo -e "${RED}Error: Files directory not found at $FILES_DIR${NC}"
    exit 1
fi

# Create database directory if it doesn't exist
if [ ! -d "$DB_DIR" ]; then
    echo -e "${YELLOW}Creating database directory at $DB_DIR${NC}"
    mkdir -p "$DB_DIR"
fi

# Run the seed script with image extraction enabled
echo -e "${CYAN}Running seed with image extraction...${NC}"
cd /Users/tfinlayson/Desktop/ClaudeHopper
npm run seed -- --dbpath "$DB_DIR" --filesdir "$FILES_DIR" --extract_images

echo -e "${GREEN}Seed script completed!${NC}"
echo -e "Now restart the ClaudeHopper server to use the image search capability."
