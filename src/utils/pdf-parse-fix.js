// This file creates a workaround for the pdf-parse debug mode issue
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the test directory structure if it doesn't exist
const testDir = path.join(__dirname, '../../test/data');
fs.mkdirSync(testDir, { recursive: true });

// Create an empty file to satisfy the pdf-parse debug mode
const testFile = path.join(testDir, '05-versions-space.pdf');
if (!fs.existsSync(testFile)) {
  fs.writeFileSync(testFile, 'Test file for pdf-parse');
  console.log('Created test file for pdf-parse at:', testFile);
}
