#!/bin/bash

# Script to install the required Ollama models for the ClaudeHopper project
# Usage: ./install_models.sh [--all]

echo "=== 🏗️ Installing Ollama Models for ClaudeHopper ==="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first from https://ollama.com/"
    exit 1
fi

# Check ollama status
if ! ollama list &> /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama and try again."
    exit 1
fi

# Read model configuration from user_config.ts
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
IMAGE_MODEL=$(get_model_name "IMAGE_EMBEDDING")
SECTION_MODEL=$(get_model_name "SECTION_DETECTION")

# If we couldn't extract the model names, use defaults
if [ -z "$EMBEDDING_MODEL" ]; then
  EMBEDDING_MODEL="nomic-embed-text"
fi

if [ -z "$SUMMARIZATION_MODEL" ]; then
  SUMMARIZATION_MODEL="phi4"
fi

if [ -z "$METADATA_MODEL" ]; then
  METADATA_MODEL="phi4"
fi

if [ -z "$IMAGE_MODEL" ]; then
  IMAGE_MODEL="clip"
fi

if [ -z "$SECTION_MODEL" ]; then
  SECTION_MODEL="phi4"
fi

# Check if --all flag is provided
INSTALL_ALL=false
if [ "$1" == "--all" ]; then
    INSTALL_ALL=true
    echo "Installing ALL available models (this may take a while)..."
else
    echo "Installing default models for construction document processing:"
    echo "- Embedding: $EMBEDDING_MODEL"
    echo "- Summarization: $SUMMARIZATION_MODEL"
    echo "- Metadata extraction: $METADATA_MODEL"
    echo "- Section detection: $SECTION_MODEL"
    echo ""
    echo "Use --all flag to install all available models."
fi

# Install required models from configuration
echo ""
echo "Installing embedding model: $EMBEDDING_MODEL"
ollama pull "$EMBEDDING_MODEL"

echo ""
echo "Installing summarization model: $SUMMARIZATION_MODEL"
ollama pull "$SUMMARIZATION_MODEL"

# Only install metadata model if different from summarization model
if [ "$METADATA_MODEL" != "$SUMMARIZATION_MODEL" ]; then
    echo ""
    echo "Installing metadata extraction model: $METADATA_MODEL"
    ollama pull "$METADATA_MODEL"
fi

# Only install section detection model if different from other models
if [ "$SECTION_MODEL" != "$SUMMARIZATION_MODEL" ] && [ "$SECTION_MODEL" != "$METADATA_MODEL" ]; then
    echo ""
    echo "Installing section detection model: $SECTION_MODEL"
    ollama pull "$SECTION_MODEL"
fi

# Install additional models if --all flag is provided
if [ "$INSTALL_ALL" = true ]; then
    # Get all available models from models.ts registry
    MODELS_FILE="src/config/models.ts"
    
    echo ""
    echo "Installing additional embedding models..."
    for model in $(grep -o "'[^']*'" "$MODELS_FILE" | grep -v "$EMBEDDING_MODEL" | sort | uniq | tr -d "'"); do
        # Skip models we've already installed
        if [ "$model" != "$SUMMARIZATION_MODEL" ] && [ "$model" != "$METADATA_MODEL" ] && [ "$model" != "$SECTION_MODEL" ]; then
            # Check if it looks like a model name (no spaces, special chars)
            if [[ $model =~ ^[a-zA-Z0-9._:-]+$ ]]; then
                echo "Installing $model..."
                ollama pull "$model" || echo "Failed to install $model (may not be available)"
            fi
        fi
    done
fi

echo ""
echo "=== Model Installation Complete ==="
echo ""
echo "Installed models for construction document processing:"
echo "- $EMBEDDING_MODEL (embedding)"
echo "- $SUMMARIZATION_MODEL (summarization)"
if [ "$METADATA_MODEL" != "$SUMMARIZATION_MODEL" ]; then
    echo "- $METADATA_MODEL (metadata extraction)"
fi
if [ "$SECTION_MODEL" != "$SUMMARIZATION_MODEL" ] && [ "$SECTION_MODEL" != "$METADATA_MODEL" ]; then
    echo "- $SECTION_MODEL (section detection)"
fi
echo ""
echo "You can customize which models are used in the configuration file:"
echo "- src/config/user_config.ts"
echo ""
echo "Run the processing script to use these models:"
echo "cd ~/Desktop/claudehopper && ./process_pdfdrawings.sh"
echo ""
