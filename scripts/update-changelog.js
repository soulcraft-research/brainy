#!/usr/bin/env node

/**
 * Update Changelog Script
 *
 * This script updates the CHANGELOG.md file with the latest release notes
 * from GitHub. It's designed to be called after creating a GitHub release.
 * 
 * The script:
 * 1. Gets the current version from package.json
 * 2. Fetches the release notes from GitHub for that version
 * 3. Updates the CHANGELOG.md file with the new release notes
 * 
 * This ensures that the CHANGELOG.md file is always up-to-date with the
 * latest release notes, which will be displayed on npmjs.com.
 */

import { execSync } from 'child_process'
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

// Path to CHANGELOG.md
const changelogPath = path.join(rootDir, 'CHANGELOG.md')

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

// Check if GitHub CLI is installed
try {
  execSync('gh --version', { stdio: 'ignore' })
} catch (error) {
  console.error('Error: GitHub CLI (gh) is not installed or not in PATH')
  console.error('Please install it from https://cli.github.com/ and authenticate with `gh auth login`')
  process.exit(1)
}

// Fetch release notes from GitHub
try {
  console.log(`Fetching release notes for v${version} from GitHub...`)
  
  // Get the release notes using GitHub CLI
  const releaseNotes = execSync(
    `gh release view v${version} --json body --jq .body`,
    { encoding: 'utf8', cwd: rootDir }
  ).trim()
  
  // Create or update the CHANGELOG.md file
  let changelog = ''
  
  // If CHANGELOG.md exists, read its content
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, 'utf8')
  } else {
    // Create a new CHANGELOG.md file with a header
    changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n'
  }
  
  // Format the new entry
  const date = new Date().toISOString().split('T')[0]
  const newEntry = `## [${version}] - ${date}\n\n${releaseNotes}\n\n`
  
  // Check if this version is already in the changelog
  if (changelog.includes(`## [${version}]`)) {
    // Replace the existing entry
    const versionRegex = new RegExp(`## \\[${version}\\].*?(?=## \\[|$)`, 's')
    changelog = changelog.replace(versionRegex, newEntry)
  } else {
    // Add the new entry after the header (before the first version entry)
    const firstVersionIndex = changelog.search(/## \[\d+\.\d+\.\d+\]/)
    
    if (firstVersionIndex !== -1) {
      // Insert before the first version entry
      changelog = changelog.slice(0, firstVersionIndex) + newEntry + changelog.slice(firstVersionIndex)
    } else {
      // No existing version entries, append to the end
      changelog += newEntry
    }
  }
  
  // Write the updated changelog
  fs.writeFileSync(changelogPath, changelog)
  
  console.log(`CHANGELOG.md updated with release notes for v${version}`)
  
  // Also update the CLI package's CHANGELOG.md
  const cliChangelogPath = path.join(rootDir, 'cli-package', 'CHANGELOG.md')
  
  // Create or update the CLI CHANGELOG.md file
  let cliChangelog = ''
  
  // If CLI CHANGELOG.md exists, read its content
  if (fs.existsSync(cliChangelogPath)) {
    cliChangelog = fs.readFileSync(cliChangelogPath, 'utf8')
  } else {
    // Create a new CHANGELOG.md file with a header
    cliChangelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n'
  }
  
  // Check if this version is already in the changelog
  if (cliChangelog.includes(`## [${version}]`)) {
    // Replace the existing entry
    const versionRegex = new RegExp(`## \\[${version}\\].*?(?=## \\[|$)`, 's')
    cliChangelog = cliChangelog.replace(versionRegex, newEntry)
  } else {
    // Add the new entry after the header (before the first version entry)
    const firstVersionIndex = cliChangelog.search(/## \[\d+\.\d+\.\d+\]/)
    
    if (firstVersionIndex !== -1) {
      // Insert before the first version entry
      cliChangelog = cliChangelog.slice(0, firstVersionIndex) + newEntry + cliChangelog.slice(firstVersionIndex)
    } else {
      // No existing version entries, append to the end
      cliChangelog += newEntry
    }
  }
  
  // Write the updated CLI changelog
  fs.writeFileSync(cliChangelogPath, cliChangelog)
  
  console.log(`CLI package CHANGELOG.md updated with release notes for v${version}`)
  
} catch (error) {
  console.error('Error updating CHANGELOG.md:', error.message)
  // Don't exit with error to allow the process to continue
  // process.exit(1)
}
