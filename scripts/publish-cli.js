#!/usr/bin/env node

/**
 * Script to build and publish both the main package and CLI package
 *
 * This script:
 * 1. Ensures versions are in sync by running generate-version.js
 * 2. Builds the main package
 * 3. Builds the CLI
 * 4. Publishes the main package
 * 5. Publishes the CLI package
 * 
 * This ensures both packages are always published together with the same version.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
const cliPackageDir = path.join(rootDir, 'cli-package')

// Ensure the CLI package directory exists
if (!fs.existsSync(cliPackageDir)) {
  console.error(`Error: CLI package directory not found at ${cliPackageDir}`)
  process.exit(1)
}

try {
  // Step 1: Ensure versions are in sync
  console.log('Ensuring versions are in sync...')
  execSync('node scripts/generate-version.js', { stdio: 'inherit', cwd: rootDir })

  // Step 2: Build the main package
  console.log('Building main package...')
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir })

  // Step 3: Build the CLI
  console.log('Building CLI...')
  execSync('npm run build:cli', { stdio: 'inherit', cwd: rootDir })

  // Step 4: Verify the CLI was built successfully
  const cliPath = path.join(rootDir, 'dist', 'cli.js')
  if (!fs.existsSync(cliPath)) {
    console.error(`Error: CLI build failed. File not found at ${cliPath}`)
    process.exit(1)
  }

  // Step 5: Publish the main package
  console.log('Publishing main package...')
  execSync('npm publish', { stdio: 'inherit', cwd: rootDir })

  // Step 6: Publish the CLI package
  console.log('Publishing CLI package...')
  execSync('npm publish', { stdio: 'inherit', cwd: cliPackageDir })

  console.log('Both packages published successfully!')
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
}
