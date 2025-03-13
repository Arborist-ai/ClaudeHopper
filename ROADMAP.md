# ClaudeHopper Development Roadmap

This document outlines the development plan and progress for the ClaudeHopper tool, focusing on enhancing its capabilities for construction drawing search and analysis.

## Project Phases

### Phase 1: Core Text Search (Completed)
- ✅ Basic infrastructure setup
- ✅ LanceDB integration for vector storage
- ✅ PDF text extraction and chunking
- ✅ Embedding generation for text chunks
- ✅ Document metadata extraction
- ✅ Text search capabilities
  - ✅ Chunks search (specific text within documents)
  - ✅ Catalog search (document-level search)
  - ✅ Broad chunks search (search across all documents)

### Phase 2: Image Search (In Progress)
- ✅ Image search API implementation
- ✅ Configuration updates for image extraction
- ✅ Database schema for image storage
- ✅ Integration with CLIP model for text-to-image search
- 🔄 Image extraction from PDFs
  - ✅ PDF page extraction logic
  - 🔄 Image embedding generation
  - 🔄 Metadata linking between images and source documents
- 🔄 Testing with construction drawings
- ⬜ Performance optimization for large document sets

### Phase 3: Enhanced Visual Search (Planned)
- ⬜ Image-to-image similarity search
- ⬜ Object detection in construction drawings
- ⬜ Image annotation capabilities
- ⬜ Visual element recognition (symbols, dimensions, notes)
- ⬜ Advanced filtering by visual elements

### Phase 4: Integration and Advanced Features (Planned)
- ⬜ BIM integration capabilities
- ⬜ CAD file support
- ⬜ Multi-modal search (combining text and image queries)
- ⬜ Comparison tools for drawing revisions
- ⬜ Collaborative annotation features
- ⬜ UI improvements

## Current Focus

We are currently focused on completing Phase 2 by implementing and testing the image search functionality. This includes:

1. Extracting images from PDF drawings
2. Generating embeddings for these images
3. Building efficient search capabilities for finding drawings based on visual similarity
4. Testing with real construction documents

## Installation Requirements for Image Search

To enable image extraction from PDFs, ensure the following tools are installed:

- **pdfimages** utility (part of poppler-utils)
  - On macOS: `brew install poppler`
  - On Ubuntu: `apt-get install poppler-utils`

## Next Steps

1. Test image extraction with various PDF drawing types
2. Improve the text-to-image prompt quality for better search results
3. Optimize embedding storage for large document sets
4. Add sample queries and documentation for image search

## Future Enhancements

### Phase 5: Expanded Model Support and Processing Options
- ⬜ Integration with hosted models through openrouter.ai or other OpenAI-compatible services
  - Support for GPT-4V and other advanced vision models
  - Configurable API settings for different model providers
  - Cost management and optimization features
- ⬜ Reprocessing capabilities
  - Option to rerun all analysis on existing documents
  - Selective reprocessing of specific documents or drawings
  - Batch processing improvements for large document sets
  - Version control for different processing runs
