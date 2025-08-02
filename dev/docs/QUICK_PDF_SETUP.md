# Quick PDF Generation Setup

## 🚀 Generate Professional Brainy Architecture PDF

### One-Command Setup & Generation

```bash
# Install Puppeteer and generate PDF in one go
npm install puppeteer && npm run generate-pdf
```

### Step-by-Step

1. **Install Puppeteer** (if not already installed):
   ```bash
   npm install puppeteer
   ```

2. **Generate the PDF**:
   ```bash
   npm run generate-pdf
   ```

3. **Find your PDF**:
   ```
   docs/Brainy_Architecture_Documentation.pdf
   ```

## ✨ What You Get

- **25-30 page professional PDF** with full diagrams
- **Vector graphics** for all Mermaid diagrams  
- **Modern typography** with Inter font family
- **Consistent branding** throughout the document
- **Table of contents** with page links
- **Professional headers/footers**

## 📊 Sample Sections Include

- System Overview with environment detection
- Core Architecture layers
- Data Model (23 Noun Types, 38 Verb Types)
- Vector Search Engine with HNSW visualization
- Storage Architecture with multi-tier caching
- Augmentation Pipeline flows
- Performance optimizations
- Cross-platform integration patterns
- Real data flow examples

## 🛠️ Troubleshooting

### Issue: "Puppeteer not found"
```bash
npm install puppeteer
```

### Issue: "Chrome not found" 
```bash
# Let Puppeteer download Chromium
npm install puppeteer --unsafe-perm=true
```

### Issue: "Permission denied"
```bash
chmod +x dev/scripts/generate-architecture-pdf.js
```

## 🎨 Customization

Edit `dev/scripts/generate-architecture-pdf.js` to:
- Change colors and fonts
- Modify page layout
- Adjust diagram styling
- Add custom branding

---

**Ready to generate?** Run `npm run generate-pdf` and get your professional architecture documentation!

For detailed setup instructions, see `PDF_GENERATION_GUIDE.md`.