#!/bin/bash

# One-click setup and run script for ClaudeHopper
# Run this script to set up and process construction documents in one go
# This version preserves existing Claude Desktop MCP configurations

echo "=== 🏗️ ClaudeHopper - Construction Document Assistant Setup ==="
echo ""

# Make all scripts executable
echo "Making scripts executable..."
chmod +x ~/Desktop/claudehopper/*.sh

# Create directory structure if needed
echo "Setting up directory structure..."
mkdir -p ~/Desktop/PDFdrawings-MCP/Database
mkdir -p ~/Desktop/PDFdrawings-MCP/InputDocs/Drawings
mkdir -p ~/Desktop/PDFdrawings-MCP/InputDocs/TextDocs

# Check for Ollama
echo "Checking for Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first from https://ollama.com/"
    exit 1
fi

if ! ollama list &> /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama and try again."
    exit 1
fi

# Check for required models by running the install script
echo "Installing required models..."
~/Desktop/claudehopper/install_models.sh

# Fix potential pdf-parse test file issues
echo "Fixing potential issues with pdf-parse..."
PDF_PARSE_TEST_DIR="/Users/tfinlayson/Desktop/claudehopper/test/data"
mkdir -p "$PDF_PARSE_TEST_DIR"
touch "$PDF_PARSE_TEST_DIR/05-versions-space.pdf"

# Process documents
echo "Processing documents..."
~/Desktop/claudehopper/process_pdfdrawings.sh

# Update Claude Desktop configuration
echo "Updating Claude Desktop configuration..."
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
BACKUP_FILE="$CONFIG_DIR/claude_desktop_config.backup.json"
  
# Create directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Check if jq is installed (used for JSON manipulation)
if ! command -v jq &> /dev/null; then
    echo "⚠️ Warning: jq is not installed. Using basic method which may not preserve all settings."
    echo "For best results, install jq with: brew install jq"
fi

# Function to create a new config file if needed
create_new_config() {
    echo "Creating new configuration file..."
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
}

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    echo "Backing up existing configuration to $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    
    if command -v jq &> /dev/null; then
        # JQ method for cleanly updating JSON
        if jq empty "$CONFIG_FILE" 2>/dev/null; then
            # Valid JSON file, update it
            echo "Updating existing configuration with jq..."
            
            # Check if mcpServers key exists
            if jq -e '.mcpServers' "$CONFIG_FILE" >/dev/null 2>&1; then
                # mcpServers exists, add or update claudehopper entry
                jq '.mcpServers.claudehopper = {"command": "node", "args": ["'"$HOME"'/Desktop/claudehopper/dist/index.js", "'"$HOME"'/Desktop/PDFdrawings-MCP/Database"]}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
                mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
            else
                # mcpServers doesn't exist, add it
                jq '. + {"mcpServers": {"claudehopper": {"command": "node", "args": ["'"$HOME"'/Desktop/claudehopper/dist/index.js", "'"$HOME"'/Desktop/PDFdrawings-MCP/Database"]}}}' "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
                mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
            fi
        else
            # Invalid JSON, create new file
            echo "Existing configuration file is not valid JSON. Creating new one..."
            create_new_config
        fi
    else
        # Basic method without jq (less reliable)
        echo "Using basic method to update configuration..."
        
        # Try to determine if the file has mcpServers configuration
        if grep -q '"mcpServers"' "$CONFIG_FILE"; then
            # Check if there's an existing claudehopper entry
            if grep -q '"claudehopper"' "$CONFIG_FILE"; then
                echo "Existing claudehopper configuration found. Attempting to update..."
                # This is a very basic approach and might fail in complex cases
                TMP_FILE=$(mktemp)
                sed -E 's/("claudehopper"[^{]*\{[^}]*"command"[^"]*")[^"]*("[^}]*"args"[^[]*\[[^]]*")[^"]*("[^]]*\])/\1node\2'"$HOME"'\/Desktop\/claudehopper\/dist\/index.js\3/g' "$CONFIG_FILE" > "$TMP_FILE"
                mv "$TMP_FILE" "$CONFIG_FILE"
            else
                echo "Adding claudehopper to existing mcpServers..."
                # Very basic approach to add before the last closing brace of mcpServers
                TMP_FILE=$(mktemp)
                sed '/"mcpServers"[[:space:]]*:[[:space:]]*{/a \
    "claudehopper": {\
      "command": "node",\
      "args": [\
        "'"$HOME"'/Desktop/claudehopper/dist/index.js",\
        "'"$HOME"'/Desktop/PDFdrawings-MCP/Database"\
      ]\
    },' "$CONFIG_FILE" > "$TMP_FILE"
                # If the sed command succeeded
                if [ $? -eq 0 ] && [ -s "$TMP_FILE" ]; then
                    mv "$TMP_FILE" "$CONFIG_FILE"
                else
                    echo "Failed to modify configuration with sed. Creating new file..."
                    create_new_config
                fi
            fi
        else
            echo "No mcpServers configuration found. Creating new file..."
            create_new_config
        fi
    fi
else
    # No existing config, create new one
    create_new_config
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "🏗️ ClaudeHopper is now set up and ready to use!"
echo ""
echo "To add more construction documents:"
echo "1. Place drawings in: ~/Desktop/PDFdrawings-MCP/InputDocs/Drawings/"
echo "2. Place specifications in: ~/Desktop/PDFdrawings-MCP/InputDocs/TextDocs/"
echo "3. Run: ./process_pdfdrawings.sh"
echo ""
echo "Launch Claude Desktop to start asking questions about your construction documents!"
