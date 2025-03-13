/**
 * Image processing utilities for construction drawings
 * 
 * This module provides tools for processing extracted images from construction
 * documents and preparing them for embedding and search.
 */

import * as path from 'path';
import { Document } from "@langchain/core/documents";

/**
 * Generate a description for a construction drawing image
 * 
 * @param imagePath Path to the image file
 * @param metadata Drawing metadata
 * @param pageNumber Optional page number
 * @returns Textual description of the image for embedding
 */
export function generateImageDescription(
  imagePath: string,
  metadata: any,
  pageNumber?: number
): string {
  // Extract page number from filename if not provided
  if (pageNumber === undefined) {
    const fileName = path.basename(imagePath);
    const pageMatch = fileName.match(/p(\d+)/);
    pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;
  }
  
  // Create a description that combines metadata with image info
  // This will be used for text-to-image search
  let description = `Technical drawing from ${metadata.documentType || 'document'} `;
  
  if (metadata.drawingNumber) {
    description += `${metadata.drawingNumber} `;
  }
  
  if (metadata.discipline) {
    description += `(${metadata.discipline}) `;
  }
  
  if (metadata.drawingType) {
    description += `showing ${metadata.drawingType} `;
  }
  
  if (metadata.buildingArea) {
    description += `of ${metadata.buildingArea} area `;
  }
  
  description += `page ${pageNumber}`;
  
  return description;
}

/**
 * Process extracted images and create document objects for embedding
 * 
 * @param imagePaths Array of paths to extracted images
 * @param pdfMetadata Metadata from the source PDF
 * @returns Array of document objects with image metadata
 */
export function processImages(imagePaths: string[], pdfMetadata: any): Document[] {
  const imageDocuments: Document[] = [];
  
  for (const imagePath of imagePaths) {
    try {
      // Extract page number from filename
      const fileName = path.basename(imagePath);
      const pageMatch = fileName.match(/p(\d+)/);
      const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;
      
      // Generate description
      const imageDescription = generateImageDescription(imagePath, pdfMetadata, pageNumber);
      
      // Create document with the description as content and metadata
      imageDocuments.push(new Document({
        pageContent: imageDescription,
        metadata: {
          ...pdfMetadata,
          imagePath,
          page: pageNumber,
          imageType: path.extname(imagePath).slice(1).toLowerCase(),
        },
      }));
    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      // Continue with other images
    }
  }
  
  return imageDocuments;
}

/**
 * Calculate the similarity score between two embeddings
 * 
 * @param embedding1 First embedding vector
 * @param embedding2 Second embedding vector
 * @returns Similarity score (0 to 1)
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  // Cosine similarity
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}
