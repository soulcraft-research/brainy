# Development Tools & Documentation

This directory contains development tools, scripts, and documentation files that are not included in the published npm package.

## Directory Structure

```
dev/
├── docs/           # Development documentation files
│   ├── brainy_architecture_diagram.md
│   ├── PDF_GENERATION_GUIDE.md
│   ├── QUICK_PDF_SETUP.md
│   └── brainy_architecture_visual.md
├── scripts/        # Development scripts
│   └── generate-architecture-pdf.js
└── README.md       # This file
```

## Scripts

### generate-architecture-pdf.js

Generates a professional PDF documentation of Brainy's architecture using:
- Material Design styling
- Custom SVG diagrams
- Comprehensive content from README.md
- Professional visual presentation

**Usage:**
```bash
# From project root
node dev/scripts/generate-architecture-pdf.js

# Or add to package.json scripts
npm run generate-docs
```

**Requirements:**
- puppeteer (for PDF generation)

**Output:**
- `docs/Brainy_Architecture_Documentation.pdf`

## Documentation Files

- **brainy_architecture_diagram.md**: ASCII art diagrams of system architecture
- **PDF_GENERATION_GUIDE.md**: Detailed guide for PDF generation setup
- **QUICK_PDF_SETUP.md**: Quick setup instructions
- **brainy_architecture_visual.md**: Visual architecture documentation

## NPM Package Exclusion

This entire `dev/` directory is excluded from the published npm package via `.npmignore` to keep the package size minimal and focused on the core library functionality.