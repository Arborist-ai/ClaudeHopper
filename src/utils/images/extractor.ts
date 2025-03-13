/**
 * Image extraction utilities for construction drawings
 * 
 * This module provides tools for extracting images from PDF documents,
 * with a focus on technical drawings and construction plans.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { PDFDocument } from 'pdf-lib';

/**
 * Extract images from PDF files
 * @param pdfPath Path to the PDF file
 * @param outputDir Directory to save extracted images
 * @param resolution DPI resolution for image extraction
 * @returns Array of paths to extracted images
 */
export async function extractImagesFromPdf(pdfPath: string, outputDir: string, resolution: number = 300): Promise<string[]> {
  try {
    // Create output directory if it doesn't exist
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Get the filename without extension
    const baseName = path.basename(pdfPath, '.pdf');
    
    // Create a subdirectory for this PDF's images
    const pdfImagesDir = path.join(outputDir, baseName);
    await fs.promises.mkdir(pdfImagesDir, { recursive: true });
    
    console.log(`Extracting images from ${pdfPath} to ${pdfImagesDir}...`);
    
    // First, load the PDF to determine the number of pages
    const pdfBytes = await fs.promises.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // Extract images using pdfimages (if available) or an alternative method
    try {
      // Try to use pdfimages (common on Linux/Mac)
      const pdfImagesPath = path.join(pdfImagesDir, 'image');
      
      // Execute pdfimages with desired resolution
      await new Promise<void>((resolve, reject) => {
        const process = child_process.spawn('pdfimages', [
          '-j',          // Output JPEG images
          '-p',          // Include page number in image filename
          pdfPath,       // Input PDF
          pdfImagesPath  // Output path prefix
        ]);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`pdfimages exited with code ${code}`));
          }
        });
      });
      
      // Get the list of extracted images
      const files = await fs.promises.readdir(pdfImagesDir);
      return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .map(file => path.join(pdfImagesDir, file));
    } catch (error) {
      console.error(`Error using pdfimages, falling back to alternative method:`, error);
      
      // Fallback method: Generate whole page images using pdf2image
      try {
        // Try using pdftoppm for whole page extraction as fallback
        const pdfImagesPath = path.join(pdfImagesDir, 'page');
        
        await new Promise<void>((resolve, reject) => {
          const process = child_process.spawn('pdftoppm', [
            '-jpeg',        // Output JPEG images
            '-r', resolution.toString(), // Resolution
            pdfPath,        // Input PDF
            pdfImagesPath   // Output path prefix
          ]);
          
          process.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`pdftoppm exited with code ${code}`));
            }
          });
        });
        
        // Get the list of extracted page images
        const files = await fs.promises.readdir(pdfImagesDir);
        return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file))
          .map(file => path.join(pdfImagesDir, file));
      } catch (fallbackError) {
        console.error(`Fallback extraction also failed:`, fallbackError);
        console.error(`Image extraction fallback not successful. Please install pdfimages or pdftoppm.`);
        return [];
      }
    }
  } catch (error) {
    console.error(`Error extracting images from ${pdfPath}:`, error);
    return [];
  }
}

/**
 * Check if pdfimages utility is available on the system
 * @returns Promise resolving to boolean indicating availability
 */
export async function isPdfImagesAvailable(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const process = child_process.spawn('pdfimages', ['-v']);
      process.on('close', (code) => {
        if (code === 0 || code === 1) { // pdfimages might return 1 for version info
          resolve();
        } else {
          reject(new Error(`pdfimages check exited with code ${code}`));
        }
      });
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if pdftoppm utility is available on the system
 * @returns Promise resolving to boolean indicating availability
 */
export async function isPdftoppmAvailable(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const process = child_process.spawn('pdftoppm', ['-v']);
      process.on('close', (code) => {
        if (code === 0 || code === 1) { // pdftoppm might return 1 for version info
          resolve();
        } else {
          reject(new Error(`pdftoppm check exited with code ${code}`));
        }
      });
    });
    return true;
  } catch (error) {
    return false;
  }
}
