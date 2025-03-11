/**
 * Main Configuration
 * 
 * This file imports and aggregates all configuration settings
 * from the modular configuration system.
 */

import { ModelTaskType, getModelConfig } from './config/models.js';
import { userSelectedModels, pdfProcessingConfig, textProcessingConfig, systemConfig } from './config/user_config.js';

// Database tables
export const CATALOG_TABLE_NAME = "catalog";
export const CHUNKS_TABLE_NAME = "chunks";
export const IMAGE_TABLE_NAME = "images";

// Get model names from the configuration system
export const EMBEDDING_MODEL = getModelConfig(ModelTaskType.EMBEDDING, userSelectedModels[ModelTaskType.EMBEDDING]).name;
export const SUMMARIZATION_MODEL = getModelConfig(ModelTaskType.SUMMARIZATION, userSelectedModels[ModelTaskType.SUMMARIZATION]).name;
export const METADATA_EXTRACTION_MODEL = getModelConfig(ModelTaskType.METADATA_EXTRACTION, userSelectedModels[ModelTaskType.METADATA_EXTRACTION]).name;
export const IMAGE_EMBEDDING_MODEL = getModelConfig(ModelTaskType.IMAGE_EMBEDDING, userSelectedModels[ModelTaskType.IMAGE_EMBEDDING]).name;
export const SECTION_DETECTION_MODEL = getModelConfig(ModelTaskType.SECTION_DETECTION, userSelectedModels[ModelTaskType.SECTION_DETECTION]).name;

// Image processing configuration
export const IMAGE_RESOLUTION = pdfProcessingConfig.imageExtractionResolution;
export const EXTRACT_FULL_PAGE = pdfProcessingConfig.extractFirstPageOnlyForMetadata;
export const EXTRACT_IMAGES = pdfProcessingConfig.extractImages;
export const DETECT_SECTIONS = pdfProcessingConfig.useAiSectionDetection;

// Text processing configuration
export const CHUNK_SIZE = textProcessingConfig.chunkSize;
export const CHUNK_OVERLAP = textProcessingConfig.chunkOverlap;
export const MAX_SUMMARIZATION_TOKENS = textProcessingConfig.maxSummarizationTokens;
export const MAX_METADATA_TOKENS = textProcessingConfig.maxMetadataExtractionTokens;

// PDF processing configuration
export const MAX_PDF_SIZE_MB = pdfProcessingConfig.maxPdfSizeBeforeSplitting;
export const MAX_PAGES_PER_CHUNK = pdfProcessingConfig.maxPagesPerChunk;
export const USE_BOOKMARKS = pdfProcessingConfig.useBookmarksForSplitting;
export const USE_AI_SECTION_DETECTION = pdfProcessingConfig.useAiSectionDetection;

// System configuration
export const LOG_LEVEL = systemConfig.logLevel;
export const PARALLEL_PROCESSING = systemConfig.parallelProcessing;
export const VERIFY_MODELS = systemConfig.verifyModelsBeforeProcessing;

// Metadata fields to extract and store
export const METADATA_FIELDS = [
  "project",
  "discipline",
  "drawingNumber",
  "drawingType",
  "phase",
  "documentType",
  "section",
  "revision"
];

// Export the complete configuration for use in other modules
export const config = {
  models: {
    embedding: EMBEDDING_MODEL,
    summarization: SUMMARIZATION_MODEL,
    metadataExtraction: METADATA_EXTRACTION_MODEL,
    imageEmbedding: IMAGE_EMBEDDING_MODEL,
    sectionDetection: SECTION_DETECTION_MODEL
  },
  tables: {
    catalog: CATALOG_TABLE_NAME,
    chunks: CHUNKS_TABLE_NAME,
    images: IMAGE_TABLE_NAME
  },
  pdf: {
    maxSizeMb: MAX_PDF_SIZE_MB,
    maxPagesPerChunk: MAX_PAGES_PER_CHUNK,
    useBookmarks: USE_BOOKMARKS,
    useAiSectionDetection: USE_AI_SECTION_DETECTION,
    extractFirstPageOnly: EXTRACT_FULL_PAGE,
    extractImages: EXTRACT_IMAGES,
    imageResolution: IMAGE_RESOLUTION
  },
  text: {
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    maxSummarizationTokens: MAX_SUMMARIZATION_TOKENS,
    maxMetadataTokens: MAX_METADATA_TOKENS
  },
  system: {
    logLevel: LOG_LEVEL,
    parallelProcessing: PARALLEL_PROCESSING,
    verifyModels: VERIFY_MODELS
  },
  metadata: {
    fields: METADATA_FIELDS
  }
};

// Default export for easier importing
export default config;
