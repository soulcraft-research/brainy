#!/usr/bin/env node

/* eslint-env node */
/* eslint no-console: "off" */

/**
 * Update Changelog Script
 *
 * This script helps maintain the CHANGELOG.md file by:
 * 1. Moving unreleased changes to a new version section
 * 2. Adding the current date
 * 3. Creating a new empty unreleased section
 * 
 * Usage:
 * - npm run changelog:update - Interactive mode to update changelog
 * - node scripts/update-changelog.js <version> - Direct version update
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the root directory and CHANGELOG.md
const rootDir = path.join(__dirname, '..')
const changelogPath = path.join(rootDir, 'CHANGELOG.md')

// Get version from command line argument or package.json
function getVersion() {
  const args = process.argv.slice(2)
  if (args.length > 0) {
    return args[0]
  }
  
  // Read from package.json
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  return packageJson.version
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split('T')[0]
}

// Update the changelog
function updateChangelog(version) {
  if (!fs.existsSync(changelogPath)) {
    console.error('CHANGELOG.md not found!')
    process.exit(1)
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8')
  const lines = changelog.split('\n')
  
  // Find the unreleased section
  const unreleasedIndex = lines.findIndex(line => line.includes('## [Unreleased]'))
  if (unreleasedIndex === -1) {
    console.error('Could not find [Unreleased] section in CHANGELOG.md')
    process.exit(1)
  }

  // Find the next version section or end of unreleased content
  let nextSectionIndex = lines.findIndex((line, index) => 
    index > unreleasedIndex && line.startsWith('## [') && !line.includes('[Unreleased]')
  )
  
  if (nextSectionIndex === -1) {
    nextSectionIndex = lines.length
  }

  // Extract unreleased content
  const unreleasedContent = lines.slice(unreleasedIndex + 1, nextSectionIndex)
  
  // Check if there's actual content in unreleased section
  const hasContent = unreleasedContent.some(line => 
    line.trim() && !line.startsWith('#') && line.includes('-')
  )

  if (!hasContent) {
    console.log('No unreleased changes found. Please add changes to the [Unreleased] section first.')
    console.log('Example:')
    console.log('## [Unreleased]')
    console.log('')
    console.log('### Added')
    console.log('- New feature description')
    console.log('')
    console.log('### Fixed')
    console.log('- Bug fix description')
    return
  }

  // Create new version section
  const currentDate = getCurrentDate()
  const newVersionSection = [
    `## [${version}] - ${currentDate}`,
    ...unreleasedContent
  ]

  // Create new unreleased section
  const newUnreleasedSection = [
    '## [Unreleased]',
    '',
    '### Added',
    '',
    '### Changed',
    '',
    '### Fixed',
    '',
  ]

  // Reconstruct the changelog
  const newLines = [
    ...lines.slice(0, unreleasedIndex),
    ...newUnreleasedSection,
    ...newVersionSection,
    ...lines.slice(nextSectionIndex)
  ]

  // Write the updated changelog
  fs.writeFileSync(changelogPath, newLines.join('\n'))
  console.log(`✅ CHANGELOG.md updated for version ${version}`)
  console.log(`📅 Release date: ${currentDate}`)
  console.log('🔄 New [Unreleased] section created')
}

// Main execution
try {
  const version = getVersion()
  console.log(`Updating CHANGELOG.md for version ${version}...`)
  updateChangelog(version)
} catch (error) {
  console.error('Error updating changelog:', error.message)
  process.exit(1)
}
