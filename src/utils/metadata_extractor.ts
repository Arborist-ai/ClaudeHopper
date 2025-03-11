/**
 * Enhanced Metadata Extraction for Construction Documents
 * 
 * This module combines multiple approaches to extract metadata:
 * 1. Path-based extraction (from folder structure and filenames)
 * 2. Content-based extraction (from document text)
 * 3. AI-assisted extraction (using LLMs to identify key information)
 */

import * as path from 'path';
import { extractPdfInformation, PdfSection } from './pdf_processor';
import config from '../config';

export interface DocumentMetadata {
  project?: string;        // Project name
  discipline?: string;     // Engineering discipline (Structural, Civil, etc.)
  drawingNumber?: string;  // Drawing identifier
  drawingType?: string;    // Type of drawing (Plan, Elevation, Detail, etc.)
  phase?: string;          // Project phase
  documentType?: string;   // Drawing or TextDoc
  revision?: string;       // Revision information
  section?: string;        // Document section
  sheetNumber?: string;    // Sheet number within discipline set
  buildingArea?: string;   // Building or area identifier
  [key: string]: string | undefined; // Allow for additional custom metadata
}

/**
 * Main metadata extraction function - combines all extraction methods
 * 
 * @param filePath Path to the document file
 * @param content Document text content (optional)
 * @returns Combined metadata object
 */
export async function extractMetadata(filePath: string, content?: string): Promise<DocumentMetadata> {
  // 1. Start with path-based extraction
  const pathMetadata = extractMetadataFromPath(filePath);
  console.log(`Extracted path metadata for ${filePath}:`, pathMetadata);
  
  // 2. If content is provided, do content-based extraction
  let contentMetadata: DocumentMetadata = {};
  if (content) {
    contentMetadata = extractMetadataFromContent(content);
    console.log(`Extracted content metadata for ${filePath}:`, contentMetadata);
  }
  
  // 3. For PDF files, perform AI-assisted extraction
  let aiMetadata: DocumentMetadata = {};
  if (filePath.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfInfo = await extractPdfInformation(filePath);
      aiMetadata = pdfInfo.metadata as DocumentMetadata;
      console.log(`Extracted AI metadata for ${filePath}:`, aiMetadata);
    } catch (error) {
      console.error(`Error extracting AI metadata from ${filePath}:`, error);
    }
  }
  
  // 4. Merge all metadata sources with priority:
  // AI > Path > Content (AI has highest priority, as it's most comprehensive)
  const mergedMetadata = mergeMetadata(contentMetadata, pathMetadata, aiMetadata);
  console.log(`Merged metadata for ${filePath}:`, mergedMetadata);
  
  return mergedMetadata;
}

/**
 * Extracts metadata from file path based on folder structure and filename
 * 
 * Adapted for PDFdrawings-MCP folder structure:
 * /PDFdrawings-MCP/InputDocs/[DocumentType]/filename.pdf
 * 
 * @param filePath Full path to the document file
 * @returns Object containing extracted metadata
 */
export function extractMetadataFromPath(filePath: string): DocumentMetadata {
  const metadata: DocumentMetadata = {};
  
  // Normalize path for consistent processing across platforms
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  
  // Extract filename and remove extension
  const filename = path.basename(normalizedPath);
  const drawingNumber = path.basename(normalizedPath, path.extname(normalizedPath));
  
  metadata.drawingNumber = drawingNumber;
  
  // Identify if this is a drawing or text document based on path
  if (normalizedPath.includes('/Drawings/')) {
    metadata.documentType = 'Drawing';
  } else if (normalizedPath.includes('/TextDocs/')) {
    metadata.documentType = 'TextDoc';
    
    // For text documents with special naming convention
    if (filename.startsWith('Division')) {
      metadata.documentType = 'Specification';
      const divMatch = filename.match(/Division\s+(\d+)/i);
      if (divMatch && divMatch[1]) {
        metadata.discipline = getSpecificationDiscipline(divMatch[1]);
      }
    }
  }
  
  // Set default project name to "PDFdrawings" if nothing better is found
  metadata.project = "PDFdrawings";
  
  // Try to find project and discipline from folder structure
  // Look for common keywords that might indicate project folders
  const projectsIndex = pathParts.findIndex(part => 
    part.toLowerCase() === 'projects' || 
    part.toLowerCase() === 'project' ||
    part.toLowerCase() === 'pdfdrawings-mcp'
  );
  
  if (projectsIndex >= 0 && pathParts.length > projectsIndex + 1) {
    // If the folder structure has a Projects folder, use the next folder as project name
    if (pathParts[projectsIndex].toLowerCase() !== 'pdfdrawings-mcp') {
      metadata.project = pathParts[projectsIndex + 1];
    }
  }
  
  // Try to extract discipline and sheet information from filename patterns
  if (drawingNumber && metadata.documentType === 'Drawing') {
    // Common drawing number patterns: S-50-1001, C-101, A3.01, etc.
    
    // Extract discipline code from drawing number if available
    const disciplineCode = drawingNumber.charAt(0);
    if (disciplineCode) {
      // Map common discipline codes to full discipline names
      const disciplineMap: Record<string, string> = {
        'S': 'Structural',
        'C': 'Civil',
        'A': 'Architectural',
        'M': 'Mechanical',
        'E': 'Electrical',
        'P': 'Plumbing',
        'L': 'Landscape',
        'G': 'General',
        'D': 'Demolition',
        'F': 'Fire Protection',
        'T': 'Telecommunications',
        'I': 'Interiors'
      };
      
      metadata.discipline = disciplineMap[disciplineCode.toUpperCase()] || metadata.discipline;
    }
    
    // Extract building/area number and sheet sequence from drawing number
    const parts = drawingNumber.split('-');
    if (parts.length > 1) {
      // Second segment (e.g., "50" in "S-50-1001") typically represents building/area
      if (parts.length > 1 && parts[1]) {
        metadata.buildingArea = parts[1];
      }
      
      // Third segment (e.g., "1001" in "S-50-1001") typically represents the sheet numbering
      if (parts.length > 2 && parts[2]) {
        metadata.sheetNumber = parts[2];
        
        // Infer drawing type from sheet number ranges
        // This is a common pattern but varies by firm and project
        const sheetNum = parseInt(parts[2]);
        if (!isNaN(sheetNum)) {
          // Fixed: Using regular decimal numbers (no leading zeros)
          if (sheetNum >= 1 && sheetNum <= 99) metadata.drawingType = 'General';
          else if (sheetNum >= 100 && sheetNum <= 199) metadata.drawingType = 'Plans';
          else if (sheetNum >= 200 && sheetNum <= 299) metadata.drawingType = 'Elevations';
          else if (sheetNum >= 300 && sheetNum <= 399) metadata.drawingType = 'Sections';
          else if (sheetNum >= 400 && sheetNum <= 499) metadata.drawingType = 'Details';
          else if (sheetNum >= 500 && sheetNum <= 599) metadata.drawingType = 'Schedules';
          else if (sheetNum >= 600 && sheetNum <= 699) metadata.drawingType = 'Diagrams';
        }
      }
    }
  }
  
  return metadata;
}

/**
 * Maps CSI MasterFormat division numbers to disciplines
 * 
 * @param divisionNumber CSI MasterFormat division number
 * @returns Corresponding discipline
 */
function getSpecificationDiscipline(divisionNumber: string): string {
  const divNum = parseInt(divisionNumber);
  
  if (divNum >= 1 && divNum <= 14) {
    return 'Architectural';
  } else if (divNum >= 21 && divNum <= 23) {
    return 'Mechanical';
  } else if (divNum >= 25 && divNum <= 28) {
    return 'Electrical';
  } else if (divNum >= 31 && divNum <= 35) {
    return 'Civil';
  } else if (divNum === 9) {
    return 'Finishes';
  }
  
  return 'General';
}

/**
 * Extracts additional metadata from document content using pattern matching
 * 
 * @param content Text content extracted from the document
 * @returns Object containing extracted metadata
 */
export function extractMetadataFromContent(content: string): DocumentMetadata {
  const metadata: DocumentMetadata = {};
  
  // Extract project name from title block (if present)
  const projectMatch = content.match(/PROJECT:?\s*(.*?)(?:\n|$)/i) || 
                       content.match(/PROJECT\s+NAME:?\s*(.*?)(?:\n|$)/i) ||
                       content.match(/PROJ(\.|ECT)?\s+TITLE:?\s*(.*?)(?:\n|$)/i);
                       
  if (projectMatch && projectMatch[1]) {
    metadata.project = projectMatch[1].trim();
  }
  
  // Extract phase information if available
  const phaseMatch = content.match(/PHASE:?\s*(.*?)(?:\n|$)/i) ||
                     content.match(/ISSUED\s+FOR\s+(.*?)(?:\n|$)/i) ||
                     content.match(/STATUS:?\s*(.*?)(?:\n|$)/i);
                     
  if (phaseMatch && phaseMatch[1]) {
    metadata.phase = phaseMatch[1].trim();
  }
  
  // Extract revision information
  const revisionMatch = content.match(/REV(ISION)?:?\s*([A-Z0-9]+)/i) ||
                        content.match(/REV\.\s*([A-Z0-9]+)/i);
                        
  if (revisionMatch && revisionMatch[1]) {
    metadata.revision = revisionMatch[1].trim();
  }
  
  // Try to extract discipline from content if not already determined
  if (!metadata.discipline) {
    const disciplineMatch = content.match(/DISCIPLINE:?\s*(.*?)(?:\n|$)/i) ||
                           content.match(/\b(STRUCTURAL|ARCHITECTURAL|MECHANICAL|ELECTRICAL|CIVIL|PLUMBING)\s+DRAWINGS?\b/i);
                           
    if (disciplineMatch && disciplineMatch[1]) {
      metadata.discipline = disciplineMatch[1].trim();
    }
  }
  
  // Extract drawing type if present in content
  const drawingTypeMatch = content.match(/\b(PLAN|ELEVATION|SECTION|DETAIL|SCHEDULE|DIAGRAM)\b/i);
  if (drawingTypeMatch && drawingTypeMatch[1]) {
    metadata.drawingType = drawingTypeMatch[1].trim();
  }
  
  // Extract drawing number if present in content
  const drawingNumberMatch = content.match(/DWG\.?\s*NO\.?:?\s*([A-Z0-9\-\.]+)/i) ||
                            content.match(/DRAWING\s+NUMBER:?\s*([A-Z0-9\-\.]+)/i);
                            
  if (drawingNumberMatch && drawingNumberMatch[1]) {
    metadata.drawingNumber = drawingNumberMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Merges metadata from multiple sources with priority
 * Sources are provided in order of increasing priority
 * (later sources override earlier ones)
 * 
 * @param sources Array of metadata objects in priority order (lowest first)
 * @returns Merged metadata object
 */
export function mergeMetadata(...sources: DocumentMetadata[]): DocumentMetadata {
  const result: DocumentMetadata = {};
  
  // Process sources in order (increasing priority)
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (value) {
        result[key] = value;
      }
    }
  }
  
  return result;
}
