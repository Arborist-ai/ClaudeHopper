# ClaudeHopper Quick Start Guide

Welcome to ClaudeHopper, your AI-powered construction document assistant! This guide will help you get up and running quickly.

## Prerequisites

Before you begin, make sure you have:

1. [Claude Desktop](https://claude.ai/desktop) installed
2. [Ollama](https://ollama.com/) installed for local AI models
3. Node.js 18+ installed

## Setup in 3 Easy Steps

### 1. Make Scripts Executable

Open Terminal and run:

```bash
cd ~/Desktop/claudehopper
chmod +x *.sh
```

### 2. Run the Setup Script

```bash
./run_now_preserve.sh
```

This will:
- Create the necessary folder structure
- Install required AI models
- Configure Claude Desktop

### 3. Add Your Construction Documents

Place your documents in the following folders:

- **Drawings**: `~/Desktop/PDFdrawings-MCP/InputDocs/Drawings/`
- **Specifications**: `~/Desktop/PDFdrawings-MCP/InputDocs/TextDocs/`

After adding documents, run:
```bash
./process_pdfdrawings.sh
```

## Using ClaudeHopper with Claude

1. Launch Claude Desktop
2. Ask questions about your construction documents, such as:

```
"What architectural drawings do we have for this project?"
"Show me the structural details for the foundation system"
"What are the specification requirements for interior paint?"
"Find all sections discussing fire protection"
```

## Example Workflows

### Finding Specific Details

```
"Find all details related to roof connections in the structural drawings"
```

### Cross-Referencing Documents

```
"Compare the mechanical requirements in the specs with what's shown on the MEP drawings"
```

### Extracting Information from Drawings

```
"What are the dimensions of the foundation shown in drawing S-10-1001?"
```

### Understanding Specifications

```
"Summarize the requirements for concrete mix design in Division 03"
```

## Troubleshooting

If you encounter issues:

1. **Claude can't find documents**: Make sure you've run the processing script after adding documents
2. **Missing models**: Run `./install_models.sh` to install required AI models
3. **Processing errors**: Verify that Ollama is running before processing documents

For more detailed information, see the [README.md](README.md) and [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md).
