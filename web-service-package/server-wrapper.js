#!/usr/bin/env node

// Entry point wrapper for the Brainy Web Service
// This file serves as the executable entry point when installed via npm

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to load the built version first, fallback to source
const builtServerPath = join(__dirname, 'dist', 'server.js')
const sourceServerPath = join(__dirname, 'src', 'server.ts')

if (existsSync(builtServerPath)) {
  // Load the built version
  console.log('Starting Brainy Web Service (built version)...')
  import(builtServerPath).catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
} else if (existsSync(sourceServerPath)) {
  // Development mode - load source with ts-node
  console.log('Starting Brainy Web Service (development mode)...')
  console.log('Note: For production, run "npm run build" first')
  
  // Check if ts-node is available and load source
  import('ts-node/esm').then(() => {
    import(sourceServerPath).catch(error => {
      console.error('Failed to start server:', error)
      process.exit(1)
    })
  }).catch(error => {
    console.error('ts-node not found. Please install it for development mode or run "npm run build" first.')
    console.error('Install ts-node: npm install -g ts-node')
    process.exit(1)
  })
} else {
  console.error('Server files not found. Please ensure the package is properly installed.')
  process.exit(1)
}
