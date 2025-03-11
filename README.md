# 🏗️ ClaudeHopper - AI-Powered Construction Document Assistant

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ClaudeHopper is a specialized Model Context Protocol (MCP) server that enables Claude and other LLMs to interact directly with construction documents, drawings, and specifications through advanced RAG (Retrieval-Augmented Generation) and hybrid search. Ask questions about your construction drawings, locate specific details, and analyze technical specifications with ease.

## ✨ Features

- 🔍 Vector-based search for construction document retrieval optimized for CAD drawings, plans, and specs
- 🏢 Specialized metadata extraction for construction industry document formats
- 📊 Efficient token usage through intelligent document chunking and categorization
- 🔒 Security through local document storage and processing
- 📈 Support for various drawing types and construction disciplines (Structural, Civil, Architectural, etc.)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com/) for local AI models
- Claude Desktop App

### One-Click Setup

1. Download ClaudeHopper
2. Run the setup script:

```bash
cd ~/Desktop/claudehopper
chmod +x run_now_preserve.sh
./run_now_preserve.sh
```

This will:
- Create the necessary directory structure
- Install required AI models
- Process your construction documents
- Configure the Claude Desktop App to use ClaudeHopper

### Adding Documents

Place your construction documents in these folders:

- Drawings: `~/Desktop/PDFdrawings-MCP/InputDocs/Drawings/`
- Specifications: `~/Desktop/PDFdrawings-MCP/InputDocs/TextDocs/`

After adding documents, run:
```bash
./process_pdfdrawings.sh
```

## 🏗️ Using ClaudeHopper with Claude

Try these example questions in the Claude Desktop App:

```
"What architectural drawings do we have for the project?"
"Show me the structural details for the foundation system"
"What are the specifications for interior paint?"
"Find all sections discussing fire protection systems"
```

## 🛠️ Technical Architecture

ClaudeHopper uses a multi-stage pipeline for processing construction documents:

1. **Document Analysis**: PDF documents are analyzed for structure and content type
2. **Metadata Extraction**: AI-assisted extraction of project information, drawing types, disciplines
3. **Content Chunking**: Intelligent splitting of documents to maintain context
4. **Vector Embedding**: Creation of semantic representations for efficient search
5. **Database Storage**: Local LanceDB storage for vector search capabilities

## 📝 Available Search Tools

ClaudeHopper provides several specialized search capabilities:

- `catalog_search`: Find documents by project, discipline, drawing type, etc.
- `chunks_search`: Locate specific content within documents
- `all_chunks_search`: Search across the entire document collection

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
