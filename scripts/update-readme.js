import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to the files
const readmePath = path.join(__dirname, '..', 'README.md');
const encodedImagePath = path.join(__dirname, '..', 'encoded-image.html');

// Read the files
const readmeContent = fs.readFileSync(readmePath, 'utf8');
const encodedImageTag = fs.readFileSync(encodedImagePath, 'utf8');

// Replace the image tag in the README
const updatedReadme = readmeContent.replace(
  /<img src="brainy\.png" alt="Brainy Logo" width="200"\/>/,
  encodedImageTag
);

// Write the updated README
fs.writeFileSync(readmePath, updatedReadme);

console.log('README.md has been updated with the base64-encoded image.');
