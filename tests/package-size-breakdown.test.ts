/**
 * Package Size Breakdown Test
 * Analyzes the files that would be included in the npm package and reports their sizes
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

// Get the project root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Function to get the size of a file in MB
function getFileSizeInMB(filePath: string): number {
  const stats = fs.statSync(filePath)
  return stats.size / (1024 * 1024)
}

// Function to check if a file should be included in the package
function shouldIncludeFile(
  filePath: string, 
  npmignorePatterns: RegExp[], 
  includePatterns: RegExp[]
): boolean {
  const relativePath = path.relative(projectRoot, filePath)

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
function parseNpmignore(): RegExp[] {
  const patterns: RegExp[] = []
  const npmignorePath = path.join(projectRoot, '.npmignore')
  
  if (fs.existsSync(npmignorePath)) {
    const content = fs.readFileSync(npmignorePath, 'utf8')
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
function parsePackageFiles(): RegExp[] {
  const patterns: RegExp[] = []
  const packageJsonPath = path.join(projectRoot, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

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
function calculatePackageSize(): { 
  totalSize: number, 
  includedFiles: { path: string, size: number }[] 
} {
  const npmignorePatterns = parseNpmignore()
  const includePatterns = parsePackageFiles()

  let totalSize = 0
  const includedFiles: { path: string, size: number }[] = []

  function processDirectory(dirPath: string) {
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

  processDirectory(projectRoot)

  // Sort files by size (largest first)
  includedFiles.sort((a, b) => b.size - a.size)

  return { totalSize, includedFiles }
}

describe('Package Size Breakdown', () => {
  it('should report the estimated package size and largest files', () => {
    const { totalSize, includedFiles } = calculatePackageSize()
    
    console.log('Estimated package size: ' + totalSize.toFixed(2) + ' MB')
    console.log('\nLargest files:')
    for (let i = 0; i < Math.min(10, includedFiles.length); i++) {
      console.log(
        `${includedFiles[i].path}: ${includedFiles[i].size.toFixed(2)} MB`
      )
    }
    
    // Basic sanity check
    expect(totalSize).toBeGreaterThan(0)
    expect(includedFiles.length).toBeGreaterThan(0)
  })
  
  it('should identify files that contribute significantly to package size', () => {
    const { includedFiles } = calculatePackageSize()
    
    // Find files larger than 1MB
    const largeFiles = includedFiles.filter(file => file.size > 1)
    
    if (largeFiles.length > 0) {
      console.log('\nFiles larger than 1MB:')
      largeFiles.forEach(file => {
        console.log(`${file.path}: ${file.size.toFixed(2)} MB`)
      })
    }
    
    // This is not a failure condition, just informational
    expect(true).toBe(true)
  })
})