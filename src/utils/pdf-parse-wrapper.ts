// Custom wrapper for pdf-parse that avoids debug mode issues
import * as path from 'path';
import * as fs from 'fs';

// Import the actual pdf-parse functionality without the debug mode
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

// Create a test file to satisfy the pdf-parse debug mode
const createTestFile = () => {
  try {
    const testDir = path.join(__dirname, '../../test/data');
    fs.mkdirSync(testDir, { recursive: true });
    
    const testFile = path.join(testDir, '05-versions-space.pdf');
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'Test file for pdf-parse');
      console.log('Created test file for pdf-parse at:', testFile);
    }
  } catch (error) {
    console.error('Error creating test file:', error);
  }
};

// Create the test file when this module is imported
createTestFile();

// Export the function without the debug code
export default pdfParse;
