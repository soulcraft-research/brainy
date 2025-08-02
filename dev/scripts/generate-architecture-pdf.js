#!/usr/bin/env node

/**
 * Generate Professional PDF from Brainy Architecture Documentation
 * 
 * This script converts the Markdown documentation with Mermaid diagrams
 * into a beautiful, professional PDF using Puppeteer and modern CSS styling.
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const config = {
  readmeFile: path.join(__dirname, '../../README.md'),
  architectureFile: path.join(__dirname, '../docs/brainy_architecture_diagram.md'),
  outputFile: path.join(__dirname, '../../docs/Brainy_Architecture_Documentation.pdf')
}

// Apple-inspired CSS styling with Brainy retro sci-fi aesthetic
const appleInspiredCSS = `
<style>
  /* Import Apple-style fonts */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=SF+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  
  /* Brainy Color Palette - Based on the retro sci-fi logo */
  :root {
    --brainy-primary: #2D5A5A;          /* Deep teal from logo */
    --brainy-primary-light: #4A6B6B;     /* Lighter teal */
    --brainy-primary-dark: #1A3A3A;      /* Dark teal */
    --brainy-accent: #E47B39;            /* Coral orange from logo */
    --brainy-accent-light: #F19B5B;      /* Light coral */
    --brainy-accent-dark: #D36B29;       /* Dark coral */
    --brainy-cream: #F5E6B8;             /* Cream from logo */
    --brainy-cream-dark: #E8D19C;        /* Darker cream */
    --brainy-navy: #1A1A2E;              /* Navy outline */
    --brainy-green: #4A6B4A;             /* Muted green */
    --brainy-background: #FEFEFE;        /* Clean light gray */
    --brainy-surface: #FFFFFF;           /* Pure white */
    --brainy-text: #1D1D1F;              /* Apple-style dark text */
    --brainy-text-secondary: #515154;    /* Secondary text */
    --brainy-text-tertiary: #8E8E93;     /* Tertiary text */
    --brainy-border: #D2D2D7;            /* Light border */
    --brainy-border-dark: #C6C6CC;       /* Darker border */
    
    /* Apple-style elevations with Brainy colors */
    --shadow-subtle: 0 1px 3px rgba(29, 29, 31, 0.08);
    --shadow-medium: 0 4px 16px rgba(29, 29, 31, 0.12);
    --shadow-strong: 0 8px 32px rgba(29, 29, 31, 0.16);
    --shadow-accent: 0 4px 20px rgba(228, 123, 57, 0.25);
  }
  
  /* Apple-style reset and base styles */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.47;
    color: var(--brainy-text);
    background: var(--brainy-background);
    margin: 0;
    padding: 32pt;
    font-size: 16pt;
    font-weight: 400;
    letter-spacing: -0.022em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Apple-style Typography Scale with Brainy colors */
  h1 {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 48pt;
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.024em;
    color: var(--brainy-primary);
    margin: 0 0 32pt 0;
    text-align: center;
    position: relative;
  }
  
  h1::after {
    content: '';
    display: block;
    width: 120pt;
    height: 3pt;
    background: linear-gradient(90deg, var(--brainy-accent), var(--brainy-accent-light));
    margin: 16pt auto 0;
    border-radius: 2pt;
  }
  
  h2 {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 32pt;
    font-weight: 600;
    line-height: 1.125;
    letter-spacing: -0.022em;
    color: var(--brainy-primary);
    margin: 48pt 0 24pt 0;
    padding-bottom: 12pt;
    border-bottom: 2px solid var(--brainy-border);
    position: relative;
  }
  
  h2::before {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60pt;
    height: 2px;
    background: var(--brainy-accent);
  }
  
  h3 {
    font-family: 'Inter', sans-serif;
    font-size: 24pt;
    font-weight: 600;
    line-height: 1.167;
    letter-spacing: -0.021em;
    color: var(--brainy-primary-dark);
    margin: 32pt 0 16pt 0;
  }
  
  h4 {
    font-family: 'Inter', sans-serif;
    font-size: 20pt;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.020em;
    color: var(--brainy-text);
    margin: 24pt 0 12pt 0;
  }
  
  h5 {
    font-family: 'Inter', sans-serif;
    font-size: 17pt;
    font-weight: 600;
    line-height: 1.235;
    letter-spacing: -0.019em;
    color: var(--brainy-text);
    margin: 20pt 0 8pt 0;
  }
  
  /* Subtitle styling */
  .subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 22pt;
    font-weight: 400;
    line-height: 1.364;
    letter-spacing: -0.020em;
    color: var(--brainy-text-secondary);
    text-align: center;
    margin: 0 0 48pt 0;
    max-width: 600pt;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* Body text */
  p {
    font-family: 'Inter', sans-serif;
    font-size: 16pt;
    font-weight: 400;
    line-height: 1.47;
    letter-spacing: -0.022em;
    color: var(--brainy-text);
    margin: 16pt 0;
    text-align: left;
    max-width: 720pt;
  }
  
  /* Apple-style Cards with Brainy aesthetic */
  .card {
    background: var(--brainy-surface);
    border-radius: 16pt;
    border: 1px solid var(--brainy-border);
    padding: 24pt;
    margin: 24pt 0;
    box-shadow: var(--shadow-subtle);
    transition: all 0.3s ease;
  }
  
  .card-elevated {
    background: var(--brainy-surface);
    border-radius: 20pt;
    border: 1px solid var(--brainy-border);
    padding: 32pt;
    margin: 32pt 0;
    box-shadow: var(--shadow-strong);
    position: relative;
  }
  
  .card-elevated::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4pt;
    background: linear-gradient(90deg, var(--brainy-accent), var(--brainy-accent-light));
    border-radius: 20pt 20pt 0 0;
  }
  
  /* Table of contents with retro sci-fi styling */
  .toc {
    background: linear-gradient(135deg, var(--brainy-cream) 0%, var(--brainy-cream-dark) 100%);
    color: var(--brainy-primary-dark);
    border-radius: 20pt;
    padding: 32pt;
    margin: 32pt 0;
    box-shadow: var(--shadow-medium);
    border: 2px solid var(--brainy-accent);
    position: relative;
  }
  
  .toc::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, var(--brainy-accent), var(--brainy-primary));
    border-radius: 22pt;
    z-index: -1;
  }
  
  .toc h2 {
    color: var(--brainy-primary-dark);
    margin-top: 0;
    border: none;
    text-align: center;
    margin-bottom: 24pt;
  }
  
  .toc ol {
    counter-reset: item;
    padding-left: 0;
    margin: 20pt 0;
    list-style: none;
  }
  
  .toc li {
    display: block;
    margin: 12pt 0;
    padding: 8pt 0 8pt 32pt;
    position: relative;
    font-weight: 500;
    font-size: 15pt;
    line-height: 1.4;
    transition: all 0.2s ease;
  }
  
  .toc li:before {
    content: counter(item, decimal);
    counter-increment: item;
    font-weight: 700;
    color: var(--brainy-accent);
    position: absolute;
    left: 0;
    width: 24pt;
    height: 24pt;
    background: var(--brainy-primary);
    border-radius: 6pt;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12pt;
    color: var(--brainy-cream);
  }
  
  /* Feature boxes with retro styling */
  .feature-box {
    background: linear-gradient(135deg, var(--brainy-surface) 0%, #FAFBFC 100%);
    border-radius: 16pt;
    padding: 28pt;
    margin: 28pt 0;
    box-shadow: var(--shadow-accent);
    border: 2px solid var(--brainy-accent);
    position: relative;
    overflow: hidden;
  }
  
  .feature-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6pt;
    background: linear-gradient(90deg, var(--brainy-accent), var(--brainy-accent-light), var(--brainy-accent));
  }
  
  .feature-box h4 {
    color: var(--brainy-primary);
    margin-top: 0;
    margin-bottom: 16pt;
    font-size: 22pt;
  }
  
  /* Principle cards with sci-fi styling */
  .principles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320pt, 1fr));
    gap: 24pt;
    margin: 32pt 0;
  }
  
  .principle {
    background: var(--brainy-surface);
    border-radius: 16pt;
    padding: 24pt;
    box-shadow: var(--shadow-medium);
    border: 2px solid var(--brainy-border);
    position: relative;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .principle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4pt;
    background: linear-gradient(90deg, var(--brainy-primary), var(--brainy-accent));
  }
  
  .principle:hover {
    transform: translateY(-2pt);
    box-shadow: var(--shadow-strong);
    border-color: var(--brainy-accent);
  }
  
  .principle h4 {
    margin-top: 0;
    color: var(--brainy-primary);
    display: flex;
    align-items: center;
    gap: 12pt;
    font-size: 18pt;
    margin-bottom: 12pt;
  }
  
  /* Apple-style Lists */
  ul, ol {
    margin: 16pt 0;
    padding-left: 28pt;
  }
  
  li {
    margin: 8pt 0;
    line-height: 1.47;
    font-size: 16pt;
    color: var(--brainy-text);
  }
  
  ul li::marker {
    color: var(--brainy-accent);
    font-size: 18pt;
  }
  
  ol li::marker {
    color: var(--brainy-accent);
    font-weight: 600;
  }
  
  /* Code styling with Apple aesthetics */
  code {
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
    background: var(--brainy-cream);
    color: var(--brainy-primary-dark);
    padding: 3pt 8pt;
    border-radius: 6pt;
    font-size: 14pt;
    font-weight: 500;
    letter-spacing: -0.01em;
    border: 1px solid var(--brainy-border);
  }
  
  pre {
    background: linear-gradient(135deg, var(--brainy-cream) 0%, var(--brainy-cream-dark) 100%);
    border-radius: 12pt;
    padding: 20pt;
    margin: 20pt 0;
    overflow-x: auto;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
    font-size: 13pt;
    line-height: 1.4;
    box-shadow: var(--shadow-subtle);
    border: 1px solid var(--brainy-border);
    color: var(--brainy-primary-dark);
  }
  
  /* SVG Diagrams with retro sci-fi styling */
  .svg-diagram {
    text-align: center;
    margin: 32pt 0;
    padding: 24pt;
    background: linear-gradient(135deg, var(--brainy-surface) 0%, #FAFBFC 100%);
    border-radius: 20pt;
    box-shadow: var(--shadow-strong);
    border: 2px solid var(--brainy-border);
    position: relative;
    overflow: hidden;
  }
  
  .svg-diagram::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4pt;
    background: linear-gradient(90deg, var(--brainy-primary), var(--brainy-accent), var(--brainy-primary));
  }
  
  .svg-diagram h4 {
    color: var(--brainy-primary);
    margin-top: 0;
    margin-bottom: 20pt;
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 24pt;
    font-weight: 600;
  }
  
  .svg-diagram svg {
    max-width: 100%;
    height: auto;
    filter: drop-shadow(0 4px 12px rgba(45, 90, 90, 0.15));
  }
  
  /* Highlight sections with Brainy styling */
  .highlight {
    background: linear-gradient(135deg, var(--brainy-cream) 0%, #FFF9E6 100%);
    border-left: 6pt solid var(--brainy-accent);
    border-radius: 0 12pt 12pt 0;
    padding: 20pt;
    margin: 20pt 0;
    box-shadow: var(--shadow-medium);
    border-top: 1px solid var(--brainy-border);
    border-right: 1px solid var(--brainy-border);
    border-bottom: 1px solid var(--brainy-border);
    position: relative;
  }
  
  .highlight::before {
    content: '💡';
    position: absolute;
    top: 20pt;
    left: -3pt;
    font-size: 20pt;
    background: var(--brainy-accent);
    width: 6pt;
    height: 40pt;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 6pt 6pt 0;
  }
  
  /* Technology showcase with retro styling */
  .tech-showcase {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240pt, 1fr));
    gap: 20pt;
    margin: 32pt 0;
  }
  
  .tech-item {
    background: var(--brainy-surface);
    border-radius: 16pt;
    padding: 24pt;
    text-align: center;
    box-shadow: var(--shadow-medium);
    border: 2px solid var(--brainy-border);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .tech-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4pt;
    background: linear-gradient(90deg, var(--brainy-accent), var(--brainy-accent-light));
  }
  
  .tech-item:hover {
    transform: translateY(-3pt);
    box-shadow: var(--shadow-strong);
    border-color: var(--brainy-accent);
  }
  
  .tech-item h5 {
    margin: 0 0 12pt 0;
    color: var(--brainy-primary);
    font-size: 18pt;
    font-weight: 600;
  }
  
  /* Page breaks */
  .page-break {
    page-break-before: always;
  }
  
  /* Apple-style Links */
  a {
    color: var(--brainy-accent);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    border-bottom: 1px solid transparent;
  }
  
  a:hover {
    color: var(--brainy-accent-dark);
    border-bottom-color: var(--brainy-accent);
  }
  
  /* Elevated sections with Brainy styling */
  .elevated-section {
    background: var(--brainy-surface);
    border-radius: 20pt;
    padding: 32pt;
    margin: 32pt 0;
    box-shadow: var(--shadow-strong);
    border: 2px solid var(--brainy-border);
    position: relative;
  }
  
  .elevated-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4pt;
    background: linear-gradient(90deg, var(--brainy-primary), var(--brainy-accent), var(--brainy-primary));
    border-radius: 20pt 20pt 0 0;
  }
  
  /* Print styles optimized for investor presentation */
  @media print {
    body {
      font-size: 14pt;
      padding: 24mm;
      line-height: 1.4;
    }
    
    h1 { 
      font-size: 40pt; 
      page-break-after: avoid;
    }
    h2 { 
      font-size: 28pt; 
      page-break-after: avoid;
      margin-top: 32pt;
    }
    h3 { 
      font-size: 22pt; 
      page-break-after: avoid;
    }
    h4 { 
      font-size: 18pt; 
      page-break-after: avoid;
    }
    
    .card, .card-elevated, .principle, .feature-box {
      page-break-inside: avoid;
      margin-bottom: 16pt;
    }
    
    .svg-diagram {
      page-break-inside: avoid;
      margin: 20pt 0;
    }
    
    .toc {
      page-break-after: always;
    }
    
    .tech-showcase {
      page-break-inside: avoid;
    }
    
    /* Ensure good contrast for printing */
    .highlight {
      background: #F5F5F5 !important;
      border-left-color: var(--brainy-primary) !important;
    }
  }
</style>
`

// SVG Diagram Generation Functions
function generateArchitectureDiagram() {
  return `
<div class="svg-diagram">
  <h4>Brainy System Architecture</h4>
  <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="800" height="600" fill="#FAFAFA" rx="8"/>
    
    <!-- Environment Layer -->
    <rect x="50" y="50" width="700" height="80" fill="#E3F2FD" rx="8" stroke="#1976D2" stroke-width="2"/>
    <text x="400" y="75" text-anchor="middle" fill="#1976D2" font-size="16" font-weight="bold">Environment Detection & Adaptation</text>
    <text x="120" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Browser</text>
    <text x="240" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Node.js</text>
    <text x="360" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Serverless</text>
    <text x="480" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Container</text>
    <text x="600" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Server</text>
    <text x="720" y="100" text-anchor="middle" fill="#1565C0" font-size="12">Cloud</text>
    
    <!-- API Layer -->
    <rect x="50" y="160" width="700" height="60" fill="#D0E4FF" rx="6" stroke="#1976D2" stroke-width="1"/>
    <text x="400" y="185" text-anchor="middle" fill="#001D36" font-size="14" font-weight="bold">Brainy Data API</text>
    <text x="400" y="205" text-anchor="middle" fill="#001D36" font-size="11">add() | search() | addVerb() | get() | delete() | backup() | restore()</text>
    
    <!-- Pipeline Layer -->
    <rect x="50" y="250" width="700" height="80" fill="#B2F2E6" rx="6" stroke="#03DAC6" stroke-width="1"/>
    <text x="400" y="275" text-anchor="middle" fill="#000000" font-size="14" font-weight="bold">Augmentation Pipeline</text>
    <rect x="80" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="120" y="310" text-anchor="middle" fill="#000000" font-size="10">SENSE</text>
    <rect x="180" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="220" y="310" text-anchor="middle" fill="#000000" font-size="10">MEMORY</text>
    <rect x="280" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="320" y="310" text-anchor="middle" fill="#000000" font-size="10">COGNITION</text>
    <rect x="380" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="420" y="310" text-anchor="middle" fill="#000000" font-size="10">CONDUIT</text>
    <rect x="480" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="520" y="310" text-anchor="middle" fill="#000000" font-size="10">PERCEPTION</text>
    <rect x="580" y="295" width="80" height="25" fill="#03DAC6" rx="4"/>
    <text x="620" y="310" text-anchor="middle" fill="#000000" font-size="10">DIALOG</text>
    
    <!-- Processing Layer -->
    <rect x="50" y="360" width="340" height="120" fill="#FFF3E0" rx="6" stroke="#FF9800" stroke-width="1"/>
    <text x="220" y="385" text-anchor="middle" fill="#E65100" font-size="14" font-weight="bold">Vector Processing</text>
    <circle cx="150" cy="420" r="30" fill="#FFB74D" stroke="#FF9800" stroke-width="2"/>
    <text x="150" y="415" text-anchor="middle" fill="#E65100" font-size="10">TensorFlow</text>
    <text x="150" y="430" text-anchor="middle" fill="#E65100" font-size="10">Embedding</text>
    <circle cx="290" cy="420" r="30" fill="#FFB74D" stroke="#FF9800" stroke-width="2"/>
    <text x="290" y="415" text-anchor="middle" fill="#E65100" font-size="10">HNSW</text>
    <text x="290" y="430" text-anchor="middle" fill="#E65100" font-size="10">Index</text>
    <path d="M 180 420 L 260 420" stroke="#FF9800" stroke-width="2" marker-end="url(#arrowhead)"/>
    
    <!-- Storage Layer -->
    <rect x="410" y="360" width="340" height="120" fill="#E8F5E8" rx="6" stroke="#4CAF50" stroke-width="1"/>
    <text x="580" y="385" text-anchor="middle" fill="#1B5E20" font-size="14" font-weight="bold">Adaptive Storage</text>
    <rect x="430" y="395" width="80" height="20" fill="#A5D6A7" rx="3"/>
    <text x="470" y="408" text-anchor="middle" fill="#1B5E20" font-size="9">Hot Cache</text>
    <rect x="530" y="395" width="80" height="20" fill="#A5D6A7" rx="3"/>
    <text x="570" y="408" text-anchor="middle" fill="#1B5E20" font-size="9">Warm Cache</text>
    <rect x="630" y="395" width="80" height="20" fill="#A5D6A7" rx="3"/>
    <text x="670" y="408" text-anchor="middle" fill="#1B5E20" font-size="9">Cold Storage</text>
    <text x="470" y="440" text-anchor="middle" fill="#1B5E20" font-size="10">OPFS</text>
    <text x="570" y="440" text-anchor="middle" fill="#1B5E20" font-size="10">FileSystem</text>
    <text x="670" y="440" text-anchor="middle" fill="#1B5E20" font-size="10">S3/Cloud</text>
    <text x="470" y="455" text-anchor="middle" fill="#1B5E20" font-size="10">Memory</text>
    
    <!-- Sync Layer -->
    <rect x="50" y="510" width="700" height="60" fill="#F3E5F5" rx="6" stroke="#9C27B0" stroke-width="1"/>
    <text x="400" y="535" text-anchor="middle" fill="#4A148C" font-size="14" font-weight="bold">Cross-Platform Synchronization</text>
    <rect x="200" y="545" width="120" height="20" fill="#CE93D8" rx="3"/>
    <text x="260" y="558" text-anchor="middle" fill="#4A148C" font-size="10">WebSocket Conduit</text>
    <rect x="340" y="545" width="120" height="20" fill="#CE93D8" rx="3"/>
    <text x="400" y="558" text-anchor="middle" fill="#4A148C" font-size="10">WebRTC Conduit</text>
    <rect x="480" y="545" width="120" height="20" fill="#CE93D8" rx="3"/>
    <text x="540" y="558" text-anchor="middle" fill="#4A148C" font-size="10">MCP Protocol</text>
    
    <!-- Arrow marker -->
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#FF9800"/>
      </marker>
    </defs>
    
    <!-- Data flow arrows -->
    <path d="M 400 130 L 400 160" stroke="#1976D2" stroke-width="3" marker-end="url(#arrowhead2)"/>
    <path d="M 400 220 L 400 250" stroke="#03DAC6" stroke-width="3" marker-end="url(#arrowhead3)"/>
    <path d="M 220 330 L 220 360" stroke="#FF9800" stroke-width="3" marker-end="url(#arrowhead4)"/>
    <path d="M 580 330 L 580 360" stroke="#4CAF50" stroke-width="3" marker-end="url(#arrowhead5)"/>
    <path d="M 400 480 L 400 510" stroke="#9C27B0" stroke-width="3" marker-end="url(#arrowhead6)"/>
    
    <!-- Additional arrow markers -->
    <defs>
      <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#1976D2"/>
      </marker>
      <marker id="arrowhead3" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#03DAC6"/>
      </marker>
      <marker id="arrowhead4" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#FF9800"/>
      </marker>
      <marker id="arrowhead5" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50"/>
      </marker>
      <marker id="arrowhead6" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#9C27B0"/>
      </marker>
    </defs>
  </svg>
</div>
`;
}

function generateDataFlowDiagram() {
  return `
<div class="svg-diagram">
  <h4>Data Processing Flow</h4>
  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="800" height="400" fill="#FAFAFA" rx="8"/>
    
    <!-- Input -->
    <rect x="50" y="50" width="100" height="60" fill="#E3F2FD" rx="8" stroke="#1976D2" stroke-width="2"/>
    <text x="100" y="75" text-anchor="middle" fill="#1976D2" font-size="12" font-weight="bold">Raw Data</text>
    <text x="100" y="90" text-anchor="middle" fill="#1565C0" font-size="10">Text/JSON</text>
    <text x="100" y="105" text-anchor="middle" fill="#1565C0" font-size="10">Images/Media</text>
    
    <!-- Embedding -->
    <rect x="200" y="50" width="100" height="60" fill="#FFF3E0" rx="8" stroke="#FF9800" stroke-width="2"/>
    <text x="250" y="75" text-anchor="middle" fill="#E65100" font-size="12" font-weight="bold">Embedding</text>
    <text x="250" y="90" text-anchor="middle" fill="#FF6F00" font-size="10">TensorFlow.js</text>
    <text x="250" y="105" text-anchor="middle" fill="#FF6F00" font-size="10">GPU Accel</text>
    
    <!-- Vector Index -->
    <rect x="350" y="50" width="100" height="60" fill="#E8F5E8" rx="8" stroke="#4CAF50" stroke-width="2"/>
    <text x="400" y="75" text-anchor="middle" fill="#1B5E20" font-size="12" font-weight="bold">Vector Index</text>
    <text x="400" y="90" text-anchor="middle" fill="#388E3C" font-size="10">HNSW</text>
    <text x="400" y="105" text-anchor="middle" fill="#388E3C" font-size="10">Algorithm</text>
    
    <!-- Graph Construction -->
    <rect x="500" y="50" width="100" height="60" fill="#F3E5F5" rx="8" stroke="#9C27B0" stroke-width="2"/>
    <text x="550" y="75" text-anchor="middle" fill="#4A148C" font-size="12" font-weight="bold">Graph Build</text>
    <text x="550" y="90" text-anchor="middle" fill="#7B1FA2" font-size="10">Noun-Verb</text>
    <text x="550" y="105" text-anchor="middle" fill="#7B1FA2" font-size="10">Relations</text>
    
    <!-- Storage -->
    <rect x="650" y="50" width="100" height="60" fill="#B2F2E6" rx="8" stroke="#03DAC6" stroke-width="2"/>
    <text x="700" y="75" text-anchor="middle" fill="#00695C" font-size="12" font-weight="bold">Storage</text>
    <text x="700" y="90" text-anchor="middle" fill="#00897B" font-size="10">Multi-tier</text>
    <text x="700" y="105" text-anchor="middle" fill="#00897B" font-size="10">Adaptive</text>
    
    <!-- Query Processing -->
    <rect x="300" y="200" width="200" height="80" fill="#FFF8E1" rx="8" stroke="#FFC107" stroke-width="2"/>
    <text x="400" y="225" text-anchor="middle" fill="#F57F17" font-size="14" font-weight="bold">Query Processing</text>
    <text x="400" y="245" text-anchor="middle" fill="#F9A825" font-size="11">Semantic Search</text>
    <text x="400" y="260" text-anchor="middle" fill="#F9A825" font-size="11">Graph Traversal</text>
    <text x="400" y="275" text-anchor="middle" fill="#F9A825" font-size="11">Result Ranking</text>
    
    <!-- Performance Features -->
    <rect x="50" y="320" width="150" height="60" fill="#FFEBEE" rx="6" stroke="#F44336" stroke-width="1"/>
    <text x="125" y="345" text-anchor="middle" fill="#C62828" font-size="11" font-weight="bold">Performance</text>
    <text x="125" y="360" text-anchor="middle" fill="#D32F2F" font-size="9">Multithreading</text>
    <text x="125" y="375" text-anchor="middle" fill="#D32F2F" font-size="9">Caching</text>
    
    <rect x="220" y="320" width="150" height="60" fill="#E0F2F1" rx="6" stroke="#009688" stroke-width="1"/>
    <text x="295" y="345" text-anchor="middle" fill="#00695C" font-size="11" font-weight="bold">Scalability</text>
    <text x="295" y="360" text-anchor="middle" fill="#00796B" font-size="9">Auto-tuning</text>
    <text x="295" y="375" text-anchor="middle" fill="#00796B" font-size="9">Load Balancing</text>
    
    <rect x="390" y="320" width="150" height="60" fill="#EDE7F6" rx="6" stroke="#673AB7" stroke-width="1"/>
    <text x="465" y="345" text-anchor="middle" fill="#4527A0" font-size="11" font-weight="bold">Synchronization</text>
    <text x="465" y="360" text-anchor="middle" fill="#5E35B1" font-size="9">Real-time</text>
    <text x="465" y="375" text-anchor="middle" fill="#5E35B1" font-size="9">Cross-platform</text>
    
    <rect x="560" y="320" width="150" height="60" fill="#FFF3E0" rx="6" stroke="#FF9800" stroke-width="1"/>
    <text x="635" y="345" text-anchor="middle" fill="#E65100" font-size="11" font-weight="bold">Intelligence</text>
    <text x="635" y="360" text-anchor="middle" fill="#F57C00" font-size="9">Adaptive Learning</text>
    <text x="635" y="375" text-anchor="middle" fill="#F57C00" font-size="9">Pattern Analysis</text>
    
    <!-- Flow arrows -->
    <defs>
      <marker id="flow-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#1976D2"/>
      </marker>
    </defs>
    
    <path d="M 150 80 L 200 80" stroke="#1976D2" stroke-width="3" marker-end="url(#flow-arrow)"/>
    <path d="M 300 80 L 350 80" stroke="#1976D2" stroke-width="3" marker-end="url(#flow-arrow)"/>
    <path d="M 450 80 L 500 80" stroke="#1976D2" stroke-width="3" marker-end="url(#flow-arrow)"/>
    <path d="M 600 80 L 650 80" stroke="#1976D2" stroke-width="3" marker-end="url(#flow-arrow)"/>
    
    <!-- Query flow -->
    <path d="M 400 110 L 400 200" stroke="#FFC107" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#query-arrow)"/>
    <defs>
      <marker id="query-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#FFC107"/>
      </marker>
    </defs>
  </svg>
</div>
`;
}

function generateHNSWDiagram() {
  return `
<div class="svg-diagram">
  <h4>HNSW (Hierarchical Navigable Small World) Index Structure</h4>
  <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="800" height="500" fill="#FAFAFA" rx="8"/>
    
    <!-- Layer labels -->
    <text x="50" y="100" fill="#1976D2" font-size="14" font-weight="bold">Layer 2</text>
    <text x="50" y="200" fill="#1976D2" font-size="14" font-weight="bold">Layer 1</text>
    <text x="50" y="350" fill="#1976D2" font-size="14" font-weight="bold">Layer 0</text>
    <text x="50" y="370" fill="#1565C0" font-size="12">(Base Layer)</text>
    
    <!-- Layer 2 - Sparse connections -->
    <circle cx="200" cy="100" r="12" fill="#E3F2FD" stroke="#1976D2" stroke-width="2"/>
    <circle cx="400" cy="100" r="12" fill="#E3F2FD" stroke="#1976D2" stroke-width="2"/>
    <circle cx="600" cy="100" r="12" fill="#E3F2FD" stroke="#1976D2" stroke-width="2"/>
    
    <!-- Layer 2 connections -->
    <line x1="212" y1="100" x2="388" y2="100" stroke="#1976D2" stroke-width="2"/>
    <line x1="412" y1="100" x2="588" y2="100" stroke="#1976D2" stroke-width="2"/>
    
    <!-- Layer 1 - Medium density -->
    <circle cx="150" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    <circle cx="250" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    <circle cx="350" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    <circle cx="450" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    <circle cx="550" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    <circle cx="650" cy="200" r="10" fill="#BBDEFB" stroke="#1976D2" stroke-width="1.5"/>
    
    <!-- Layer 1 connections -->
    <line x1="160" y1="200" x2="240" y2="200" stroke="#1976D2" stroke-width="1.5"/>
    <line x1="260" y1="200" x2="340" y2="200" stroke="#1976D2" stroke-width="1.5"/>
    <line x1="360" y1="200" x2="440" y2="200" stroke="#1976D2" stroke-width="1.5"/>
    <line x1="460" y1="200" x2="540" y2="200" stroke="#1976D2" stroke-width="1.5"/>
    <line x1="560" y1="200" x2="640" y2="200" stroke="#1976D2" stroke-width="1.5"/>
    
    <!-- Layer 0 - Dense connections -->
    <circle cx="120" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="160" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="200" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="240" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="280" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="320" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="360" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="400" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="440" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="480" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="520" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="560" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="600" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="640" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    <circle cx="680" cy="350" r="8" fill="#90CAF9" stroke="#1976D2" stroke-width="1"/>
    
    <!-- Layer 0 connections (dense) -->
    <line x1="128" y1="350" x2="152" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="168" y1="350" x2="192" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="208" y1="350" x2="232" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="248" y1="350" x2="272" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="288" y1="350" x2="312" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="328" y1="350" x2="352" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="368" y1="350" x2="392" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="408" y1="350" x2="432" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="448" y1="350" x2="472" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="488" y1="350" x2="512" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="528" y1="350" x2="552" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="568" y1="350" x2="592" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="608" y1="350" x2="632" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="648" y1="350" x2="672" y2="350" stroke="#1976D2" stroke-width="1"/>
    
    <!-- Additional cross-connections for realism -->
    <line x1="160" y1="350" x2="200" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="240" y1="350" x2="280" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="320" y1="350" x2="360" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="400" y1="350" x2="440" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="480" y1="350" x2="520" y2="350" stroke="#1976D2" stroke-width="1"/>
    <line x1="560" y1="350" x2="600" y2="350" stroke="#1976D2" stroke-width="1"/>
    
    <!-- Vertical connections between layers -->
    <line x1="200" y1="112" x2="200" y2="338" stroke="#1976D2" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="400" y1="112" x2="400" y2="338" stroke="#1976D2" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="600" y1="112" x2="600" y2="338" stroke="#1976D2" stroke-width="1" stroke-dasharray="3,3"/>
    
    <!-- Search path illustration -->
    <path d="M 100 50 Q 200 70 300 100 Q 400 120 500 200 Q 600 280 700 350" stroke="#FF5722" stroke-width="4" fill="none" stroke-dasharray="8,4"/>
    <text x="400" y="30" text-anchor="middle" fill="#FF5722" font-size="12" font-weight="bold">Search Path (Logarithmic Complexity)</text>
    
    <!-- Benefits box -->
    <rect x="50" y="420" width="700" height="60" fill="#E8F5E8" rx="6" stroke="#4CAF50" stroke-width="1"/>
    <text x="400" y="440" text-anchor="middle" fill="#1B5E20" font-size="14" font-weight="bold">HNSW Benefits</text>
    <text x="150" y="460" fill="#2E7D32" font-size="11">• Fast similarity search (log complexity)</text>
    <text x="150" y="475" fill="#2E7D32" font-size="11">• Memory efficient indexing</text>
    <text x="450" y="460" fill="#2E7D32" font-size="11">• Scalable to millions of vectors</text>
    <text x="450" y="475" fill="#2E7D32" font-size="11">• Configurable precision/performance</text>
  </svg>
</div>
`;
}

// Retro logo-inspired diagram for title page
function generateBrainyLogo() {
  return `
<div class="svg-diagram" style="margin: 48pt 0; padding: 32pt;">
  <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Retro badge background -->
    <defs>
      <linearGradient id="badge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4A6B6B;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#2D5A5A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1A3A3A;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="brain-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F19B5B;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#E47B39;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Main badge shape -->
    <ellipse cx="200" cy="100" rx="180" ry="90" fill="url(#badge-bg)" stroke="#E47B39" stroke-width="4"/>
    <ellipse cx="200" cy="100" rx="170" ry="80" fill="none" stroke="#F5E6B8" stroke-width="2"/>
    
    <!-- Brain representation -->
    <circle cx="200" cy="80" r="35" fill="url(#brain-bg)" stroke="#1A3A3A" stroke-width="3"/>
    <path d="M 175 80 Q 200 60 225 80 Q 200 100 175 80" fill="#D36B29" opacity="0.8"/>
    <circle cx="190" cy="75" r="8" fill="#1A3A3A" opacity="0.6"/>
    <circle cx="210" cy="75" r="8" fill="#1A3A3A" opacity="0.6"/>
    <circle cx="200" cy="85" r="6" fill="#1A3A3A" opacity="0.6"/>
    
    <!-- Retro text -->
    <text x="200" y="140" text-anchor="middle" fill="#F5E6B8" font-size="32" font-weight="bold" font-family="Space Grotesk, monospace">BRAINY</text>
    <text x="200" y="165" text-anchor="middle" fill="#E47B39" font-size="14" font-weight="bold" font-family="Space Grotesk, monospace">ARCHITECTURE</text>
    
    <!-- Decorative elements -->
    <circle cx="80" cy="60" r="6" fill="#E47B39" opacity="0.8"/>
    <circle cx="320" cy="60" r="6" fill="#E47B39" opacity="0.8"/>
    <circle cx="80" cy="140" r="6" fill="#E47B39" opacity="0.8"/>
    <circle cx="320" cy="140" r="6" fill="#E47B39" opacity="0.8"/>
  </svg>
</div>
`;
}

// HTML template with Apple-inspired structure
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brainy Architecture Documentation</title>
    ${appleInspiredCSS}
</head>
<body>
    <!-- Content will be inserted here -->
    {{CONTENT}}
</body>
</html>
`

// Generate comprehensive content combining README and architecture documentation
function generateComprehensiveContent() {
  const readmeContent = fs.readFileSync(config.readmeFile, 'utf8')
  const architectureContent = fs.readFileSync(config.architectureFile, 'utf8')
  
  // Extract key sections from README
  const overviewMatch = readmeContent.match(/## ✨ Overview([\s\S]*?)(?=\n## |$)/)
  const featuresMatch = readmeContent.match(/### 🚀 Key Features([\s\S]*?)(?=\n## |\n### |$)/)
  const howItWorksMatch = readmeContent.match(/## 🧩 How It Works([\s\S]*?)(?=\n## |$)/)
  const pipelineMatch = readmeContent.match(/## 🚀 The Brainy Pipeline([\s\S]*?)(?=\n## |$)/)
  const dataModelMatch = readmeContent.match(/## Data Model([\s\S]*?)(?=\n## |$)/)
  const scalingMatch = readmeContent.match(/## 📈 Scaling Strategy([\s\S]*?)(?=\n## |$)/)
  const performanceMatch = readmeContent.match(/### Performance Tuning([\s\S]*?)(?=\n## |\n### |$)/)
  
  const content = `
${generateBrainyLogo()}

# Brainy Architecture Documentation
<div class="subtitle">A Comprehensive Guide to the Advanced AI Graph Database Platform</div>

<div class="toc card-elevated">
<h2>Table of Contents</h2>

1. Executive Summary
2. System Overview & Key Features  
3. Core Architecture & Design Principles
4. Advanced Data Processing Pipeline
5. Vector Search & Graph Database Technology
6. Storage Architecture & Environment Adaptation
7. Performance & Scalability Features
8. Cross-Platform Integration & Synchronization
9. Technical Implementation Details
10. Architecture Diagrams & Visual Guide
</div>

<div class="elevated-section">
<h2>1. Executive Summary</h2>

Brainy represents a revolutionary approach to AI-powered data management, combining the semantic understanding of vector databases with the relational power of graph structures. This platform automatically adapts to any computing environment while providing enterprise-grade performance and scalability.

<div class="tech-showcase">
<div class="tech-item">
<h5>🌐 Universal Deployment</h5>
Runs seamlessly across browsers, servers, containers, and cloud platforms
</div>
<div class="tech-item">
<h5>🧠 Intelligent Adaptation</h5>
Automatically optimizes for your environment and usage patterns
</div>
<div class="tech-item">
<h5>⚡ Advanced Performance</h5>
Built-in TensorFlow.js with GPU acceleration and multithreading
</div>
<div class="tech-item">
<h5>🔄 Real-time Sync</h5>
WebSocket and WebRTC support for distributed systems
</div>
</div>

${overviewMatch ? overviewMatch[1].trim() : ''}

<div class="feature-box">
<h4>Why Choose Brainy?</h4>

Brainy eliminates the complexity typically associated with vector databases and graph systems. It automatically handles environment detection, storage optimization, performance tuning, and scaling—allowing developers to focus on building innovative applications rather than managing infrastructure.

<div class="highlight">
<strong>Zero Configuration Required:</strong> Works out-of-the-box with intelligent defaults that adapt to your specific use case and environment.
</div>
</div>
</div>

## 2. System Overview & Key Features

${featuresMatch ? featuresMatch[1].trim() : ''}

### Advanced Capabilities

- **Multi-Environment Deployment**: Seamlessly runs in browsers, Node.js, serverless functions, containers, and dedicated servers
- **Intelligent Storage Selection**: Automatically chooses optimal storage (OPFS, filesystem, S3, or memory) based on environment
- **GPU-Accelerated Processing**: Leverages WebGL and TensorFlow.js for high-performance vector operations
- **Real-time Data Streaming**: Built-in WebSocket support for live data processing
- **Extensible Augmentation System**: Modular architecture for custom functionality
- **Enterprise-Ready Scaling**: Handles datasets from small collections to terabyte-scale deployments

## 3. Core Architecture & Design Principles

${howItWorksMatch ? howItWorksMatch[1].trim() : ''}

### Architectural Principles

Brainy is built on seven core principles that ensure scalability, performance, and ease of use:

<div class="principles">
<div class="principle">
<h4>🌐 Environment Agnostic</h4>
Automatically adapts to any computing environment without configuration changes
</div>

<div class="principle">
<h4>🧠 Intelligent Storage</h4>
Multi-tier caching with automatic storage selection and optimization
</div>

<div class="principle">
<h4>🔍 Vector + Graph</h4>
Combines semantic search with graph relationships in a unified model
</div>

<div class="principle">
<h4>🔧 Extensible Pipeline</h4>
Modular augmentation system for custom processing and integration
</div>

<div class="principle">
<h4>⚡ Performance Optimized</h4>
GPU acceleration, multithreading, and intelligent caching
</div>

<div class="principle">
<h4>🔄 Scalable Sync</h4>
WebSocket and WebRTC for real-time synchronization
</div>

<div class="principle">
<h4>🤖 AI Integration</h4>
MCP protocol for external AI model integration
</div>
</div>

## 4. Advanced Data Processing Pipeline

${pipelineMatch ? pipelineMatch[1].trim() : ''}

### Pipeline Innovation

The Brainy pipeline represents a breakthrough in data processing architecture:

- **Adaptive Learning**: The system learns from usage patterns and automatically optimizes performance
- **Multi-threaded Execution**: Parallel processing across Web Workers and Worker Threads
- **Streaming Data Support**: Real-time processing of incoming data streams
- **Intelligent Caching**: Multi-level caching that adapts to data access patterns
- **Error Resilience**: Robust error handling and recovery mechanisms

## 5. Vector Search & Graph Database Technology

### HNSW Algorithm Implementation

Brainy uses an optimized Hierarchical Navigable Small World (HNSW) algorithm for fast similarity search:

- **Hierarchical Structure**: Multi-layer graph for logarithmic search complexity
- **Memory Efficiency**: Product quantization for large datasets
- **Disk-Based Storage**: Hybrid approach for datasets exceeding memory limits
- **Configurable Parameters**: Tunable for precision vs. performance tradeoffs

### Vector Embedding Technology

- **TensorFlow Universal Sentence Encoder**: High-quality text embeddings
- **GPU Acceleration**: WebGL backend for fast computation
- **Batch Processing**: Efficient handling of multiple embeddings
- **Custom Embedding Support**: Pluggable embedding functions

## 6. Storage Architecture & Environment Adaptation

### Multi-Tier Storage Strategy

Brainy implements a sophisticated three-tier storage architecture:

1. **Hot Cache (RAM)**: Most frequently accessed data with LRU eviction
2. **Warm Cache (Local Storage)**: Recently accessed data with TTL management
3. **Cold Storage (Persistent)**: Complete dataset with batch optimization

### Environment-Specific Optimizations

- **Browser**: Origin Private File System (OPFS) with IndexedDB fallback
- **Node.js**: File system with optional S3 integration
- **Serverless**: In-memory with cloud persistence options
- **Container**: Automatic detection and adaptation
- **Server**: Full S3-compatible cloud storage support

## 7. Performance & Scalability Features

${performanceMatch ? performanceMatch[1].trim() : ''}

### Scaling Capabilities

${scalingMatch ? scalingMatch[1].trim() : ''}

### Performance Optimizations

- **Intelligent Defaults**: Automatic parameter tuning based on environment and dataset
- **Memory-Aware Caching**: Dynamic cache sizing based on available resources
- **Batch Operations**: Optimized bulk data processing
- **Lazy Loading**: On-demand data loading for large datasets
- **Query Optimization**: Smart query planning and execution

## 8. Cross-Platform Integration & Synchronization

### Real-Time Synchronization

Brainy provides multiple synchronization mechanisms:

- **WebSocket Conduits**: Browser-server and server-server synchronization
- **WebRTC Conduits**: Direct peer-to-peer browser communication
- **Change Logging**: Efficient delta synchronization
- **Conflict Resolution**: Automatic handling of concurrent updates

### Model Control Protocol (MCP)

Integration with external AI models through standardized protocols:

- **Data Access**: Secure access to Brainy data for external models
- **Tool Integration**: Expose Brainy functionality as AI tools
- **Service Architecture**: WebSocket and REST API support

## 9. Technical Implementation Details

${dataModelMatch ? dataModelMatch[1].trim() : ''}

### Advanced Features

- **Type Safety**: Full TypeScript support with generics
- **Field Standardization**: Cross-service field mapping and search
- **Backup & Restore**: Complete data portability
- **Testing Suite**: Comprehensive test coverage with Vitest
- **CLI Tools**: Command-line interface for data management

### Development & Operations

- **Zero Configuration**: Works out-of-the-box with intelligent defaults
- **Monitoring**: Built-in statistics and performance metrics
- **Documentation**: Comprehensive guides and API reference
- **Community**: Open-source with active development

## 10. Architecture Diagrams & Visual Guide

${generateArchitectureDiagram()}

${generateDataFlowDiagram()}

${generateHNSWDiagram()}

### Original Architecture Documentation

${architectureContent}

<div class="elevated-section">
<h3>Conclusion</h3>

Brainy represents the next generation of AI-powered data platforms, combining ease of use with enterprise-grade capabilities. Its intelligent adaptation, powerful features, and comprehensive architecture make it the ideal choice for modern applications requiring semantic search, graph relationships, and real-time data processing.

Whether you're building a simple browser application or a complex distributed system, Brainy automatically adapts to provide optimal performance and functionality in any environment.

*For more information, visit the [Brainy GitHub repository](https://github.com/soulcraft-research/brainy) or try the [live demo](https://soulcraft-research.github.io/brainy/demo/index.html).*
`
  
  return content
}

// Function to convert markdown to HTML with enhanced formatting
function markdownToHTML(markdown) {
  let html = markdown
    
  // Convert headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
  
  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr>')
  
  // Remove image syntax (since we can't embed images in PDF easily)
  html = html.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
  
  // Convert paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(\s*<h[1-6])/g, '$1')
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>(\s*<hr)/g, '$1')
  html = html.replace(/(<hr>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>(\s*<div)/g, '$1')
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1')
  
  // Convert lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>')
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
  html = html.replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
  
  // Wrap consecutive list items in ul/ol tags
  html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, (match) => {
    return '<ul>' + match + '</ul>'
  })
  
  // Handle code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`
  })
  
  // Convert custom SVG diagram calls
  html = html.replace(/\$\{generateBrainyLogo\(\)\}/g, generateBrainyLogo())
  html = html.replace(/\$\{generateArchitectureDiagram\(\)\}/g, generateArchitectureDiagram())
  html = html.replace(/\$\{generateDataFlowDiagram\(\)\}/g, generateDataFlowDiagram())
  html = html.replace(/\$\{generateHNSWDiagram\(\)\}/g, generateHNSWDiagram())
  
  // Handle special divs
  html = html.replace(/<div class="([^"]+)">([\s\S]*?)<\/div>/g, '<div class="$1">$2</div>')
  
  // Add page breaks for major sections
  html = html.replace(/<h2>/g, '<div class="page-break"></div><h2>')
  
  // Enhance key features section
  html = html.replace(/### Key Features([\s\S]*?)(?=<h2>|$)/g, (match) => {
    return match.replace(/<li>/g, '<li class="feature-item">')
  })
  
  return html
}

// Main function to generate PDF
async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...')
    
    // Check required files exist
    if (!fs.existsSync(config.readmeFile)) {
      throw new Error(`README file not found: ${config.readmeFile}`)
    }
    if (!fs.existsSync(config.architectureFile)) {
      throw new Error(`Architecture file not found: ${config.architectureFile}`)
    }
    
    console.log('📖 Generating comprehensive content...')
    const comprehensiveContent = generateComprehensiveContent()
    
    console.log('🔄 Converting to HTML...')
    const contentHTML = markdownToHTML(comprehensiveContent)
    const fullHTML = htmlTemplate.replace('{{CONTENT}}', contentHTML)
    
    // Launch Puppeteer
    console.log('🌐 Launching browser...')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Set content and wait for SVG diagrams to render
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' })
    console.log('🎨 Rendering SVG diagrams...')
    
    // Wait for all SVG diagrams to be present
    await page.waitForFunction(() => {
      const svgElements = document.querySelectorAll('.svg-diagram svg')
      return svgElements.length >= 3 // We have 3 main diagrams
    }, { timeout: 15000 })
    
    // Generate PDF with professional settings
    console.log('📄 Generating PDF...')
    await page.pdf({
      path: config.outputFile,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
          <span style="font-weight: 600;">Brainy Architecture Documentation</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
          <span>Generated from Brainy v0.34.0 | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    })
    
    await browser.close()
    
    console.log('✅ PDF generated successfully!')
    console.log(`📁 Output file: ${config.outputFile}`)
    
    // Check file size
    const stats = fs.statSync(config.outputFile)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`📊 File size: ${fileSizeInMB} MB`)
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    process.exit(1)
  }
}

// Check dependencies
async function checkDependencies() {
  try {
    const puppeteerVersion = (await import('puppeteer')).default
    console.log('✅ Dependencies verified')
  } catch (error) {
    console.error('❌ Missing dependencies. Run: npm install puppeteer')
    process.exit(1)
  }
}

// Main execution
async function main() {
  console.log('🏗️  Brainy Architecture PDF Generator')
  console.log('=====================================')
  
  await checkDependencies()
  
  // Ensure output directory exists
  const outputDir = path.dirname(config.outputFile)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  await generatePDF()
  
  console.log('=====================================')
  console.log('🎉 PDF generation complete!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { generatePDF, config }