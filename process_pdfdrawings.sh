#!/bin/bash

# Script to process construction documents for ClaudeHopper
# Usage: ./process_pdfdrawings.sh [--overwrite] [--extract-images]

# Process command line arguments
OVERWRITE=""
EXTRACT_IMAGES=""

for arg in "$@"; do
  case $arg in
    --overwrite)
      OVERWRITE="--overwrite"
      echo "Overwrite flag set - will recreate database tables"
      ;;
    --extract-images)
      EXTRACT_IMAGES="--extract_images"
      echo "Extract images flag set - will attempt to extract images from PDFs"
      ;;
  esac
done

# Build the project first to ensure latest changes are included
echo "Building project..."
npm run build

# Read model configuration from user_config.ts
echo "Reading model configuration..."
CONFIG_FILE="src/config/user_config.ts"

# Function to extract model name from user_config.ts
get_model_name() {
  local model_type=$1
  grep -o "\\[ModelTaskType.${model_type}\\]: '[^']*'" "$CONFIG_FILE" | sed "s/.*: '\\(.*\\)'.*/\\1/"
}

# Extract model names
EMBEDDING_MODEL=$(get_model_name "EMBEDDING")
SUMMARIZATION_MODEL=$(get_model_name "SUMMARIZATION")
METADATA_MODEL=$(get_model_name "METADATA_EXTRACTION")

# If we couldn't extract the model names, use defaults
if [ -z "$EMBEDDING_MODEL" ]; then
  EMBEDDING_MODEL="nomic-embed-text"
fi

if [ -z "$SUMMARIZATION_MODEL" ]; then
  SUMMARIZATION_MODEL="llama3.1:8b"
fi

if [ -z "$METADATA_MODEL" ]; then
  METADATA_MODEL="llama3.1:8b"
fi

echo "Using models for construction document processing:"
echo "- Embedding: $EMBEDDING_MODEL"
echo "- Summarization: $SUMMARIZATION_MODEL"
echo "- Metadata extraction: $METADATA_MODEL"

# Check if models are available
MISSING_MODELS=false

if ! ollama list 2>/dev/null | grep -q "$EMBEDDING_MODEL"; then
  echo "❌ Embedding model $EMBEDDING_MODEL is not installed"
  MISSING_MODELS=true
fi

if ! ollama list 2>/dev/null | grep -q "$SUMMARIZATION_MODEL"; then
  echo "❌ Summarization model $SUMMARIZATION_MODEL is not installed"
  MISSING_MODELS=true
fi

if [ "$METADATA_MODEL" != "$SUMMARIZATION_MODEL" ]; then
  if ! ollama list 2>/dev/null | grep -q "$METADATA_MODEL"; then
    echo "❌ Metadata extraction model $METADATA_MODEL is not installed"
    MISSING_MODELS=true
  fi
fi

if [ "$MISSING_MODELS" = true ]; then
  echo ""
  echo "Some required models are missing. Would you like to install them now? (y/n)"
  read -r answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    echo "Installing missing models..."
    if ! ollama list 2>/dev/null | grep -q "$EMBEDDING_MODEL"; then
      echo "Installing $EMBEDDING_MODEL..."
      ollama pull "$EMBEDDING_MODEL"
    fi
    if ! ollama list 2>/dev/null | grep -q "$SUMMARIZATION_MODEL"; then
      echo "Installing $SUMMARIZATION_MODEL..."
      ollama pull "$SUMMARIZATION_MODEL"
    fi
    if [ "$METADATA_MODEL" != "$SUMMARIZATION_MODEL" ]; then
      if ! ollama list 2>/dev/null | grep -q "$METADATA_MODEL"; then
        echo "Installing $METADATA_MODEL..."
        ollama pull "$METADATA_MODEL"
      fi
    fi
  else
    echo "Please install the missing models before running this script."
    exit 1
  fi
fi

# Check if PDF directories exist
if [ ! -d ~/Desktop/PDFdrawings-MCP/InputDocs ]; then
  echo "❌ Input directory not found: ~/Desktop/PDFdrawings-MCP/InputDocs"
  echo "Creating directory..."
  mkdir -p ~/Desktop/PDFdrawings-MCP/InputDocs/Drawings
  mkdir -p ~/Desktop/PDFdrawings-MCP/InputDocs/TextDocs
  echo "✅ Created input directories"
fi

if [ ! -d ~/Desktop/PDFdrawings-MCP/Database ]; then
  echo "❌ Database directory not found: ~/Desktop/PDFdrawings-MCP/Database"
  echo "Creating directory..."
  mkdir -p ~/Desktop/PDFdrawings-MCP/Database
  echo "✅ Created database directory"
fi

# Apply the pdf-parse fix before running the seed script
echo "Applying pdf-parse fix..."
node ~/Desktop/claudehopper/src/utils/pdf-parse-fix.cjs

# Run the seed script with the PDFdrawings-MCP paths
echo "Processing construction documents..."
npm run seed -- --dbpath ~/Desktop/PDFdrawings-MCP/Database --filesdir ~/Desktop/PDFdrawings-MCP/InputDocs $OVERWRITE $EXTRACT_IMAGES

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Done!"
  echo ""
  echo "To use with Claude Desktop, ensure your config file at:"
  echo "~/Library/Application\ Support/Claude/claude_desktop_config.json"
  echo "is set up correctly. See claude_desktop_config.json for reference."
  echo ""
  echo "After making changes to documents, rerun this script to update the database."
else
  echo "❌ Processing failed with an error. Please check the output above for details."
  exit 1
fi

# Offer to configure Claude Desktop
echo ""
echo "Would you like to update your Claude Desktop configuration now? (y/n)"
read -r answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  CONFIG_DIR="$HOME/Library/Application Support/Claude"
  CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
  
  # Create directory if it doesn't exist
  mkdir -p "$CONFIG_DIR"
  
  # Write configuration
  cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "claudehopper": {
      "command": "node",
      "args": [
        "$HOME/Desktop/claudehopper/dist/index.js",
        "$HOME/Desktop/PDFdrawings-MCP/Database"
      ]
    }
  }
}
EOF
  
  echo "✅ Claude Desktop configuration updated successfully!"
  echo "You may need to restart Claude Desktop for the changes to take effect."
fi
