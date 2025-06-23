#!/usr/bin/env node

/**
 * Generate Version Script
 *
 * This script generates a version.js file that exports the version from package.json.
 * This allows the CLI to access the version without having to read package.json directly,
 * which can be problematic when the package is installed globally.
 *
 * It also updates the version in the README.md file to ensure it stays in sync with package.json.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the root directory
const rootDir = path.join(__dirname, '..')

// Path to package.json
const packageJsonPath = path.join(rootDir, 'package.json')

// Path to the output directory
const outputDir = path.join(rootDir, 'src', 'utils')

// Path to the output file
const outputFile = path.join(outputDir, 'version.ts')

// Path to README.md
const readmePath = path.join(rootDir, 'README.md')

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generate the version.ts file
const content = `/**
 * This file is auto-generated during the build process.
 * Do not modify this file directly.
 */

export const VERSION = '${version}';
`

// Write the file
fs.writeFileSync(outputFile, content)

console.log(`Generated version.ts with version ${version}`)

// Update README.md with the current version
try {
  let readmeContent = fs.readFileSync(readmePath, 'utf8')

  // Replace the version in the badge URL
  const updatedReadme = readmeContent.replace(
    /\[\!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[0-9]+\.[0-9]+\.[0-9]+-blue\.svg\)\]/g,
    `[![Version](https://img.shields.io/badge/version-${version}-blue.svg)]`
  )

  // Write the updated README back to disk
  fs.writeFileSync(readmePath, updatedReadme)
  console.log(`Updated README.md with version ${version}`)
} catch (error) {
  console.error('Error updating README.md:', error)
}
