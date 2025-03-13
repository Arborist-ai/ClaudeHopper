#!/bin/bash
# Make script executable

# Test Script for ClaudeHopper Image Search

# Colors for better terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}ClaudeHopper Image Search Test${NC}"
echo -e "${CYAN}=============================${NC}\n"

# Check if poppler is installed
if ! command -v pdfimages &> /dev/null; then
    echo -e "${RED}Warning: pdfimages command not found!${NC}"
    echo -e "Image extraction requires poppler-utils:"
    echo -e "${YELLOW}  - On macOS: brew install poppler${NC}"
    echo -e "${YELLOW}  - On Ubuntu: apt-get install poppler-utils${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Make sure the application is built
echo -e "${CYAN}Building the application...${NC}"
npm run build

# Directory paths
DB_DIR="./Database"
PDF_DIR="$HOME/Desktop/PDFdrawings-MCP/InputDocs/Drawings"

# Check if database exists
if [ ! -d "$DB_DIR" ]; then
    echo -e "${YELLOW}Database directory not found. Creating it...${NC}"
    mkdir -p "$DB_DIR"
fi

# Check if PDF directory exists
if [ ! -d "$PDF_DIR" ]; then
    echo -e "${RED}Error: PDF drawings directory not found at $PDF_DIR${NC}"
    echo "Please put your drawings in this directory or edit this script to point to the correct location."
    exit 1
fi

# Run seed script with image extraction enabled
echo -e "${CYAN}Seeding the database with image extraction enabled...${NC}"
npm run seed -- --dbpath "$DB_DIR" --filesdir "$PDF_DIR" --extract_images

# Run the test script
echo -e "\n${CYAN}Running image search tests...${NC}"
node tools/test_image_search.js "$DB_DIR"

echo -e "\n${GREEN}Test complete!${NC}"
echo -e "${YELLOW}You can now use the image search functionality in ClaudeHopper.${NC}"
