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

// Update README.md with the current version, Node.js version, and TypeScript version
try {
  let readmeContent = fs.readFileSync(readmePath, 'utf8')

  // Get Node.js version requirement from package.json
  const nodeVersion = packageJson.engines.node.replace('>=', '')

  // Get TypeScript version from package.json devDependencies
  const typescriptVersion = packageJson.devDependencies.typescript.replace('^', '')

  // Update npm badge
  readmeContent = readmeContent.replace(
    /\[\!\[npm\]\(https:\/\/img\.shields\.io\/npm\/v\/@soulcraft\/brainy\.svg\)\]\(https:\/\/www\.npmjs\.com\/package\/@soulcraft\/brainy\)/g,
    `[![npm](https://img.shields.io/npm/v/@soulcraft/brainy.svg)](https://www.npmjs.com/package/@soulcraft/brainy)`
  )

  // Update Node.js badge
  readmeContent = readmeContent.replace(
    /\[\!\[Node\.js\]\(https:\/\/img\.shields\.io\/badge\/node-%3E%3D[0-9]+\.[0-9]+\.[0-9]+-brightgreen\.svg\)\]\(https:\/\/nodejs\.org\/\)/g,
    `[![Node.js](https://img.shields.io/badge/node-%3E%3D${nodeVersion}-brightgreen.svg)](https://nodejs.org/)`
  )

  // Update TypeScript badge
  readmeContent = readmeContent.replace(
    /\[\!\[TypeScript\]\(https:\/\/img\.shields\.io\/badge\/TypeScript-[0-9]+\.[0-9]+\.[0-9]+-blue\.svg\)\]\(https:\/\/www\.typescriptlang\.org\/\)/g,
    `[![TypeScript](https://img.shields.io/badge/TypeScript-${typescriptVersion}-blue.svg)](https://www.typescriptlang.org/)`
  )

  // Write the updated README back to disk
  fs.writeFileSync(readmePath, readmeContent)
  console.log(`Updated README.md with npm version ${version}, Node.js version ${nodeVersion}, and TypeScript version ${typescriptVersion}`)
} catch (error) {
  console.error('Error updating README.md:', error)
}
