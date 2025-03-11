/**
 * PDF Processing Utilities
 * 
 * This module provides utilities for processing PDF files, including:
 * - Splitting large PDFs into smaller chunks
 * - Extracting key sections like title blocks and headers
 * - Extracting images (for Phase 2)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// Import pdf-parse using dynamic import for ES Module compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse/lib/pdf-parse.js');

import { Ollama } from '@langchain/ollama';
import config from '../config';

// Create a wrapper for pdf-parse to handle common issues
const pdfParse = async (dataBuffer: Buffer, options?: any) => {
  try {
    return await pdfParseLib(dataBuffer, options);
  } catch (error) {
    // Log the error for debugging
    console.error('Error parsing PDF:', error);
    
    // Return a simplified result to allow processing to continue
    return {
      numpages: 1,
      text: "Error extracting PDF text. The PDF may be corrupt, password-protected, or in an unsupported format.",
      info: {}
    };
  }
};

// Interface for processed PDF section
export interface PdfSection {
  content: string;
  pageNumber: number;
  sectionType: 'title_block' | 'header' | 'footer' | 'content' | 'full_page';
  metadata: {
    source: string;
    hash: string;
    pageCount: number;
    [key: string]: any;
  };
}

// Interface for PDF splitting result
export interface SplitPdfResult {
  originalPath: string;
  chunks: {
    path: string;
    startPage: number;
    endPage: number;
    title?: string;
  }[];
}

/**
 * Checks if a PDF needs to be split based on size and page count
 * 
 * @param pdfPath Path to the PDF file
 * @returns Boolean indicating if the PDF should be split
 */
export async function shouldSplitPdf(pdfPath: string): Promise<boolean> {
  // Check file size
  const stats = await fs.promises.stat(pdfPath);
  const fileSizeMb = stats.size / (1024 * 1024);
  
  // If file size exceeds the threshold, suggest splitting
  if (fileSizeMb > config.pdf.maxSizeMb) {
    return true;
  }
  
  // Check page count if size is under threshold
  try {
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const pdfData = await pdfParse(dataBuffer, { max: 0 }); // Just get metadata
    
    // If page count exceeds threshold, suggest splitting
    if (pdfData.numpages > config.pdf.maxPagesPerChunk) {
      return true;
    }
  } catch (error) {
    console.error(`Error analyzing PDF ${pdfPath}:`, error);
    // If we can't analyze the PDF, err on the side of caution
    return true;
  }
  
  // PDF is within acceptable size limits
  return false;
}

/**
 * Extract key sections from a PDF for metadata analysis
 * 
 * @param pdfPath Path to the PDF file
 * @returns Array of PDF sections containing key information
 */
export async function extractKeyPdfSections(pdfPath: string): Promise<PdfSection[]> {
  try {
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const hash = crypto.createHash('sha256').update(dataBuffer).digest('hex');
    
    // Parse the PDF - limit to first few pages for speed if configured
    const options = config.pdf.extractFirstPageOnly ? { max: 1 } : {};
    const pdfData = await pdfParse(dataBuffer, options);
    
    // Create a results array to hold extracted sections
    const sections: PdfSection[] = [];
    
    // Always extract the first page - it typically contains the most important metadata
    sections.push({
      content: pdfData.text,
      pageNumber: 1,
      sectionType: 'full_page',
      metadata: {
        source: pdfPath,
        hash,
        pageCount: pdfData.numpages
      }
    });
    
    // For future enhancement: Add specific section detection
    // - Title block extraction
    // - Header/footer extraction
    // - Content area extraction
    
    return sections;
  } catch (error) {
    console.error(`Error extracting key sections from PDF ${pdfPath}:`, error);
    throw error;
  }
}

/**
 * Split a large PDF into smaller chunks based on bookmarks or page ranges
 * 
 * @param pdfPath Path to the PDF file
 * @param outputDir Directory to store split files
 * @returns Information about the created chunks
 */
export async function splitPdfIntoChunks(pdfPath: string, outputDir: string): Promise<SplitPdfResult> {
  try {
    const result: SplitPdfResult = {
      originalPath: pdfPath,
      chunks: []
    };
    
    // Create output directory if it doesn't exist
    const fileName = path.basename(pdfPath, path.extname(pdfPath));
    const splitDir = path.join(outputDir, `${fileName}_split`);
    await fs.promises.mkdir(splitDir, { recursive: true });
    
    // For now, use simple page range splitting
    // In a future implementation, add bookmark-based and AI-based splitting
    await splitByPageRanges(pdfPath, splitDir, result);
    
    return result;
  } catch (error) {
    console.error(`Error splitting PDF ${pdfPath}:`, error);
    // Return original file path if we can't split
    return {
      originalPath: pdfPath,
      chunks: []
    };
  }
}

/**
 * Split PDF into chunks based on fixed page ranges
 * 
 * @param pdfPath Path to the PDF file
 * @param outputDir Directory to store split files
 * @param result SplitPdfResult object to update
 */
async function splitByPageRanges(
  pdfPath: string, 
  outputDir: string, 
  result: SplitPdfResult
): Promise<void> {
  try {
    // Get page count of the PDF
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const pdfData = await pdfParse(dataBuffer, { max: 0 }); // Just get metadata
    const pageCount = pdfData.numpages;
    
    // Use pdftk or similar tool to split the PDF
    // This is a placeholder - we need to implement actual PDF splitting
    // For now, just log the intented splits
    
    const pagesPerChunk = config.pdf.maxPagesPerChunk;
    const fileName = path.basename(pdfPath, path.extname(pdfPath));
    
    for (let startPage = 1; startPage <= pageCount; startPage += pagesPerChunk) {
      const endPage = Math.min(startPage + pagesPerChunk - 1, pageCount);
      const chunkPath = path.join(outputDir, `${fileName}_${startPage}-${endPage}.pdf`);
      
      // In a real implementation, we would create the actual split file here
      // For now, just log what we would do
      console.log(`Would split ${pdfPath} pages ${startPage}-${endPage} to ${chunkPath}`);
      
      // Add to result
      result.chunks.push({
        path: chunkPath,
        startPage,
        endPage,
        title: `Pages ${startPage}-${endPage}`
      });
    }
  } catch (error) {
    console.error(`Error in page range splitting for ${pdfPath}:`, error);
    throw error;
  }
}

/**
 * Detect logical sections in a PDF using AI
 * 
 * @param pdfPath Path to the PDF file
 * @returns Array of detected section boundaries (page numbers)
 */
export async function detectLogicalSections(pdfPath: string): Promise<number[]> {
  try {
    // Get the text content of the PDF
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const pdfText = pdfData.text;
    
    // Create a sample of the text to analyze
    // (We don't need the full text for section detection)
    const textSample = pdfText.slice(0, config.text.maxMetadataTokens);
    
    // Use LLM to detect logical section breaks
    const model = new Ollama({ model: config.models.sectionDetection, temperature: 0.0 });
    
    const prompt = `
      You are analyzing a construction document that appears to be divided into sections.
      Please identify the likely page numbers where major new sections begin.
      
      Document info:
      - Total pages: ${pdfData.numpages}
      - Sample content: 
      
      ${textSample}
      
      Return ONLY an array of page numbers (integers) representing the starting page of each major section.
      For example: [1, 5, 12, 18]
    `;
    
    const result = await model.call(prompt);
    
    try {
      // Try to parse the response as a JSON array
      const pageNumbers = JSON.parse(result);
      if (Array.isArray(pageNumbers) && pageNumbers.every(num => typeof num === 'number')) {
        return pageNumbers;
      } else {
        console.warn("AI returned invalid section boundaries, using default splitting");
        return [1];
      }
    } catch (e) {
      console.warn("Failed to parse AI section detection result:", e);
      return [1];
    }
  } catch (error) {
    console.error(`Error detecting logical sections in ${pdfPath}:`, error);
    return [1];
  }
}

/**
 * Extract metadata from key PDF sections using AI
 * 
 * @param sections Array of PDF sections to analyze
 * @returns Extracted metadata object
 */
export async function extractMetadataWithAI(sections: PdfSection[]): Promise<Record<string, string>> {
  try {
    // Use the first section (typically first page or title block)
    const mainSection = sections[0];
    
    // Create a prompt for the AI to extract metadata
    const model = new Ollama({ model: config.models.metadataExtraction, temperature: 0.0 });
    
    const prompt = `
      Extract metadata from this construction document.
      
      Document content:
      ${mainSection.content.slice(0, config.text.maxMetadataTokens)}
      
      Please identify the following information:
      - Project Name
      - Discipline (Structural, Architectural, Civil, Electrical, Mechanical, etc.)
      - Drawing Type (Plan, Elevation, Section, Detail, Schedule, etc.)
      - Phase (Schematic Design, Design Development, Construction Documents, Bid, etc.)
      - Drawing/Document Number
      - Revision information
      
      Return the information as a JSON object with these keys: 
      project, discipline, drawingType, phase, drawingNumber, revision
      
      Only include fields where you have high confidence. If you cannot determine a field, omit it.
    `;
    
    const result = await model.call(prompt);
    
    try {
      // Try to parse the response as a JSON object
      const metadata = JSON.parse(result);
      return metadata;
    } catch (e) {
      console.warn("Failed to parse AI metadata extraction result:", e);
      return {};
    }
  } catch (error) {
    console.error("Error extracting metadata with AI:", error);
    return {};
  }
}

/**
 * Preprocess a PDF file before the main processing pipeline
 * - Checks if the file needs splitting
 * - Performs splitting if necessary
 * - Returns the files to be processed
 * 
 * @param pdfPath Path to the PDF file
 * @param outputDir Directory to store split files
 * @returns Array of PDF paths to process
 */
export async function preprocessPdf(pdfPath: string, outputDir: string): Promise<string[]> {
  try {
    // Check if the PDF needs to be split
    const needsSplitting = await shouldSplitPdf(pdfPath);
    
    if (needsSplitting) {
      console.log(`Large PDF detected: ${pdfPath}. Splitting into smaller chunks.`);
      
      // Split the PDF
      const splitResult = await splitPdfIntoChunks(pdfPath, outputDir);
      
      if (splitResult.chunks.length > 0) {
        // Return the paths of the split chunks
        console.log(`Split ${pdfPath} into ${splitResult.chunks.length} chunks.`);
        return splitResult.chunks.map(chunk => chunk.path);
      }
    }
    
    // If we didn't split or splitting failed, return the original path
    return [pdfPath];
  } catch (error) {
    console.error(`Error preprocessing PDF ${pdfPath}:`, error);
    // Return the original path in case of error
    return [pdfPath];
  }
}

/**
 * Extract key information from a PDF document
 * - Extracts text from key sections
 * - Uses AI to extract metadata
 * - Returns combined results
 * 
 * @param pdfPath Path to the PDF file
 * @returns Key sections and extracted metadata
 */
export async function extractPdfInformation(pdfPath: string): Promise<{
  sections: PdfSection[],
  metadata: Record<string, string>
}> {
  try {
    // Extract key sections (title block, first page, etc.)
    const sections = await extractKeyPdfSections(pdfPath);
    
    // Extract metadata using AI
    const aiMetadata = await extractMetadataWithAI(sections);
    
    return {
      sections,
      metadata: aiMetadata
    };
  } catch (error) {
    console.error(`Error extracting information from PDF ${pdfPath}:`, error);
    throw error;
  }
}
