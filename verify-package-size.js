#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

// Get the current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to get the size of a file in MB
function getFileSizeInMB(filePath) {
  const stats = fs.statSync(filePath)
  return stats.size / (1024 * 1024)
}

// Function to check if a file should be included in the package
function shouldIncludeFile(filePath, npmignorePatterns, includePatterns) {
  const relativePath = path.relative('.', filePath)

  // Check if the file matches any npmignore pattern
  for (const pattern of npmignorePatterns) {
    if (pattern.test(relativePath)) {
      return false
    }
  }

  // If we have explicit include patterns, check if the file matches any
  if (includePatterns.length > 0) {
    for (const pattern of includePatterns) {
      if (pattern.test(relativePath)) {
        return true
      }
    }
    return false
  }

  return true
}

// Parse .npmignore file
function parseNpmignore() {
  const patterns = []
  if (fs.existsSync('.npmignore')) {
    const content = fs.readFileSync('.npmignore', 'utf8')
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // Convert glob pattern to regex
        let pattern = trimmedLine
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')

        // Handle directory patterns
        if (pattern.endsWith('/')) {
          pattern = `${pattern}.*`
        }

        patterns.push(new RegExp(`^${pattern}$`))
      }
    }
  }
  return patterns
}

// Parse package.json files array
function parsePackageFiles() {
  const patterns = []
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  if (packageJson.files && Array.isArray(packageJson.files)) {
    for (const pattern of packageJson.files) {
      // Convert glob pattern to regex
      let regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')

      // Handle directory patterns
      if (regexPattern.endsWith('/')) {
        regexPattern = `${regexPattern}.*`
      }

      patterns.push(new RegExp(`^${regexPattern}$`))
    }
  }

  return patterns
}

// Calculate the total size of files that would be included in the package
function calculatePackageSize() {
  const npmignorePatterns = parseNpmignore()
  const includePatterns = parsePackageFiles()

  let totalSize = 0
  let includedFiles = []

  function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        processDirectory(fullPath)
      } else if (entry.isFile()) {
        if (shouldIncludeFile(fullPath, npmignorePatterns, includePatterns)) {
          const sizeInMB = getFileSizeInMB(fullPath)
          totalSize += sizeInMB
          includedFiles.push({ path: fullPath, size: sizeInMB })
        }
      }
    }
  }

  processDirectory('.')

  // Sort files by size (largest first)
  includedFiles.sort((a, b) => b.size - a.size)

  console.log('Estimated package size: ' + totalSize.toFixed(2) + ' MB')
  console.log('\nLargest files:')
  for (let i = 0; i < Math.min(10, includedFiles.length); i++) {
    console.log(
      `${includedFiles[i].path}: ${includedFiles[i].size.toFixed(2)} MB`
    )
  }
}

calculatePackageSize()
