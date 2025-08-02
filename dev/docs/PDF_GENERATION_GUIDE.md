# Brainy Architecture PDF Generation Guide

This guide shows you how to generate a professional PDF from the Brainy architecture documentation with beautiful diagrams.

## Quick Start

### Option 1: Using the npm script (Recommended)

```bash
# Make sure you're in the brainy project directory
cd /path/to/brainy

# Install dependencies if not already installed
npm install

# Generate the PDF
npm run generate-pdf
```

### Option 2: Direct script execution

```bash
# Make sure you're in the brainy project directory
cd /path/to/brainy

# Install Puppeteer if not already installed
npm install puppeteer

# Run the script directly
node dev/dev/scripts/generate-architecture-pdf.js
```

## Installation Requirements

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Dependencies
The script uses:
- **Puppeteer**: For PDF generation and browser automation
- **Mermaid**: For rendering diagrams (loaded via CDN)
- **Google Fonts**: For professional typography (loaded via CDN)

### Install Dependencies

```bash
# If you don't have puppeteer installed globally or in the project
npm install puppeteer

# Or install as dev dependency
npm install --save-dev puppeteer
```

## Output

The PDF will be generated at:
```
docs/Brainy_Architecture_Documentation.pdf
```

## Features of the Generated PDF

### Professional Styling
- **Modern Typography**: Uses Inter font family for clean, readable text
- **Code Font**: JetBrains Mono for code blocks and technical content
- **Color Scheme**: Professional blue theme with proper contrast
- **Layout**: A4 format with proper margins and spacing

### Rich Diagrams
- **Mermaid Diagrams**: All diagrams are rendered as vector graphics
- **Interactive Elements**: Flowcharts, sequence diagrams, mindmaps, and more
- **Consistent Styling**: All diagrams follow the same color scheme
- **High Quality**: Vector-based rendering for crisp output

### Document Structure
- **Table of Contents**: Linked navigation
- **Page Headers/Footers**: Professional branding and page numbers
- **Section Breaks**: Logical page breaks between major sections
- **Code Highlighting**: Syntax highlighting for JSON and code blocks

## Customization

### Modify Styling
Edit the `professionalCSS` variable in `dev/scripts/generate-architecture-pdf.js`:

```javascript
const professionalCSS = `
  /* Your custom CSS here */
  h1 {
    color: #your-color;
    font-size: 24pt;
  }
  /* ... */
`
```

### Change Output Location
Modify the `config` object:

```javascript
const config = {
  inputFile: path.join(__dirname, '../docs/brainy_architecture_visual.md'),
  outputFile: path.join(__dirname, '../docs/YOUR_CUSTOM_NAME.pdf'),
  // ...
}
```

### Adjust PDF Settings
Modify the `page.pdf()` options:

```javascript
await page.pdf({
  path: config.outputFile,
  format: 'A4', // or 'Letter', 'Legal', etc.
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm', 
    bottom: '20mm',
    left: '15mm'
  },
  // ... other options
})
```

## Troubleshooting

### Common Issues

#### 1. "Puppeteer not found"
```bash
npm install puppeteer
```

#### 2. "Chrome/Chromium not found"
```bash
# On Ubuntu/Debian
sudo apt-get install chromium-browser

# On macOS
brew install chromium

# Or let Puppeteer download Chromium
npm install puppeteer --unsafe-perm=true
```

#### 3. "Permission denied"
```bash
chmod +x dev/scripts/generate-architecture-pdf.js
```

#### 4. "Diagrams not rendering"
Check your internet connection - Mermaid is loaded from CDN. For offline use, you can download mermaid.min.js locally and update the path.

### Advanced Configuration

#### Use Local Mermaid
Download mermaid.min.js and update the config:

```javascript
const config = {
  // ...
  mermaidCDN: './path/to/mermaid.min.js'
}
```

#### Custom Fonts
Add additional fonts to the CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600&display=swap');

body {
  font-family: 'YourFont', sans-serif;
}
```

## Adding to package.json

Add this script to your `package.json`:

```json
{
  "scripts": {
    "generate-pdf": "node dev/dev/scripts/generate-architecture-pdf.js",
    "docs:pdf": "npm run generate-pdf"
  },
  "devDependencies": {
    "puppeteer": "^22.5.0"
  }
}
```

## Alternative PDF Generators

If you prefer other tools, you can also use:

### 1. Pandoc + LaTeX
```bash
# Install pandoc and latex
sudo apt-get install pandoc texlive-latex-recommended

# Convert (note: won't render Mermaid diagrams)
pandoc docs/brainy_architecture_visual.md -o docs/brainy_architecture.pdf
```

### 2. mdpdf
```bash
npm install -g mdpdf
mdpdf docs/brainy_architecture_visual.md --output=docs/brainy_architecture.pdf
```

### 3. markdown-pdf
```bash
npm install -g markdown-pdf
markdown-pdf docs/brainy_architecture_visual.md -o docs/brainy_architecture.pdf
```

**Note**: The custom Puppeteer script provides the best results with proper Mermaid diagram rendering and professional styling.

## Sample Output

The generated PDF will include:

1. **Cover Page** with title and subtitle
2. **Table of Contents** with page links
3. **System Overview** with environment detection diagram
4. **Core Architecture** with layered architecture diagram
5. **Data Model** with noun/verb type hierarchies
6. **Vector Search Engine** with HNSW visualization
7. **Storage Architecture** with multi-tier caching diagrams
8. **Augmentation Pipeline** with flow diagrams
9. **Performance Optimizations** with threading models
10. **Integration Patterns** with network topology
11. **Data Flow Examples** with sequence diagrams

Total pages: ~25-30 pages with full diagrams and explanations.

---

*For questions or issues with PDF generation, please check the troubleshooting section or create an issue in the repository.*