#!/usr/bin/env node

/**
 * Simplified TextEncoder Patch
 *
 * This script patches the compiled unified.js file to fix the TextEncoder issue in Node.js
 * by replacing references to this.util.TextEncoder with direct TextEncoder usage.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the compiled unified.js file
const unifiedJsPath = path.join(__dirname, '..', 'dist', 'unified.js')

// Read the file
console.log(`Reading ${unifiedJsPath}...`)
let content = fs.readFileSync(unifiedJsPath, 'utf8')

// Simple replacement: replace all instances of new this.util.TextEncoder() with new TextEncoder()
const pattern = /new\s+this\.util\.TextEncoder\(\)/g
const replacement = 'new TextEncoder()'

// Apply the patch
const patchedContent = content.replace(pattern, replacement)

// Check if the patch was applied
if (patchedContent === content) {
  console.warn(
    'No instances of "new this.util.TextEncoder()" found in the file.'
  )
} else {
  // Write the patched file
  console.log('Writing patched file...')
  fs.writeFileSync(unifiedJsPath, patchedContent, 'utf8')
  console.log('Patch applied successfully!')
}

// Also patch the minified version if it exists
const minifiedJsPath = path.join(__dirname, '..', 'dist', 'unified.min.js')
if (fs.existsSync(minifiedJsPath)) {
  console.log(`Reading ${minifiedJsPath}...`)
  const minContent = fs.readFileSync(minifiedJsPath, 'utf8')

  // Apply the same replacement to the minified file
  const patchedMinContent = minContent.replace(pattern, replacement)

  // Check if the patch was applied
  if (patchedMinContent === minContent) {
    console.warn(
      'No instances of "new this.util.TextEncoder()" found in the minified file.'
    )
  } else {
    // Write the patched file
    console.log('Writing patched minified file...')
    fs.writeFileSync(minifiedJsPath, patchedMinContent, 'utf8')
    console.log('Minified file patched successfully!')
  }
}

// Also patch TextDecoder
console.log('Patching TextDecoder references...')
content = fs.readFileSync(unifiedJsPath, 'utf8')
const decoderPattern = /new\s+this\.util\.TextDecoder\(\)/g
const decoderReplacement = 'new TextDecoder()'
const patchedDecoderContent = content.replace(
  decoderPattern,
  decoderReplacement
)

if (patchedDecoderContent === content) {
  console.warn(
    'No instances of "new this.util.TextDecoder()" found in the file.'
  )
} else {
  fs.writeFileSync(unifiedJsPath, patchedDecoderContent, 'utf8')
  console.log('TextDecoder patch applied successfully!')
}

// Patch the minified file for TextDecoder as well
if (fs.existsSync(minifiedJsPath)) {
  const minContent = fs.readFileSync(minifiedJsPath, 'utf8')
  const patchedMinDecoderContent = minContent.replace(
    decoderPattern,
    decoderReplacement
  )

  if (patchedMinDecoderContent === minContent) {
    console.warn(
      'No instances of "new this.util.TextDecoder()" found in the minified file.'
    )
  } else {
    fs.writeFileSync(minifiedJsPath, patchedMinDecoderContent, 'utf8')
    console.log('TextDecoder patch applied to minified file successfully!')
  }
}
