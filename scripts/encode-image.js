import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the image file
const imagePath = path.join(__dirname, '..', 'brainy.png');

// Read the image file
const imageBuffer = fs.readFileSync(imagePath);

// Convert the image to base64
const base64Image = imageBuffer.toString('base64');

// Get the MIME type based on file extension
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const mimeType = getMimeType(imagePath);

// Create the data URL
const dataUrl = `data:${mimeType};base64,${base64Image}`;

// Output the complete HTML img tag
const imgTag = `<img src="${dataUrl}" alt="Brainy Logo" width="200"/>`;

// Write to a file instead of console.log to avoid truncation
fs.writeFileSync(path.join(__dirname, '..', 'encoded-image.html'), imgTag);

console.log('Base64 encoded image has been saved to encoded-image.html');
