/**
 * User Configuration
 * 
 * This file contains user-configurable settings for the application.
 * Edit this file to customize the behavior of the system.
 */

import { ModelTaskType } from './models.js';

// User-selected models for each task
// These override the default selections in models.ts
export const userSelectedModels = {
  [ModelTaskType.EMBEDDING]: 'nomic-embed-text',     // Better for technical documents
  [ModelTaskType.SUMMARIZATION]: 'phi4',      // Updated to phi4
  [ModelTaskType.METADATA_EXTRACTION]: 'phi4', // Updated to phi4
  [ModelTaskType.IMAGE_EMBEDDING]: 'granite3.2-vision',  // Using Granite 3.2 Vision for image embedding
  [ModelTaskType.SECTION_DETECTION]: 'phi4'   // Updated to phi4
};

// PDF processing configuration
export const pdfProcessingConfig = {
  // Maximum PDF file size in MB before splitting is applied
  maxPdfSizeBeforeSplitting: 10,
  
  // Maximum pages per document chunk when splitting large PDFs
  maxPagesPerChunk: 20,
  
  // Whether to attempt to extract bookmarks for splitting
  useBookmarksForSplitting: true,
  
  // Whether to use AI-assisted section detection for splitting
  useAiSectionDetection: true,
  
  // Extract only the first page for metadata (faster but less comprehensive)
  extractFirstPageOnlyForMetadata: false,
  
  // Extract images from PDFs (Phase 2 feature)
  extractImages: true,
  
  // Image extraction resolution (DPI)
  imageExtractionResolution: 300
};

// Text extraction and processing settings
export const textProcessingConfig = {
  // Chunk size for text splitting
  chunkSize: 500,
  
  // Chunk overlap to maintain context between chunks
  chunkOverlap: 20,
  
  // Maximum tokens to consider for summarization
  maxSummarizationTokens: 4000,
  
  // Maximum tokens to consider for metadata extraction
  maxMetadataExtractionTokens: 2000
};

// System behavior configuration
export const systemConfig = {
  // Log level (verbose, info, warning, error)
  logLevel: 'info',
  
  // Parallelism for processing multiple documents
  // Set to 0 for automatic (based on CPU cores)
  parallelProcessing: 0,
  
  // Whether to verify model availability before processing
  verifyModelsBeforeProcessing: true
};
