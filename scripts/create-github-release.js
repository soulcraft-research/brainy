#!/usr/bin/env node

/**
 * Create GitHub Release Script
 *
 * This script creates a GitHub release with auto-generated release notes
 * for the current version of the package.
 * 
 * It uses the GitHub CLI (gh) to create the release, so the gh CLI must be installed
 * and authenticated with appropriate permissions.
 * 
 * The script:
 * 1. Gets the current version from package.json
 * 2. Creates a GitHub release for that version
 * 3. Auto-generates release notes based on commits since the last release
 * 
 * This ensures that each npm release has a corresponding GitHub release with notes.
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

// Check if the tag exists locally
let tagExistsLocally = false
try {
  execSync(`git tag -l v${version}`, { stdio: 'pipe', cwd: rootDir }).toString().trim() === `v${version}` ? tagExistsLocally = true : tagExistsLocally = false
} catch (error) {
  console.log(`Error checking if tag exists: ${error.message}`)
  tagExistsLocally = false
}

// Push the tag to remote if it exists locally
if (tagExistsLocally) {
  try {
    console.log(`Pushing tag v${version} to remote...`)
    execSync(`git push origin v${version}`, { stdio: 'inherit', cwd: rootDir })
    console.log(`Successfully pushed tag v${version} to remote`)
  } catch (error) {
    console.error(`Error pushing tag to remote: ${error.message}`)
    // Continue with release creation even if tag push fails
  }
} else {
  console.log(`Tag v${version} does not exist locally, skipping tag push`)
}

// Create the GitHub release
try {
  console.log(`Creating GitHub release for v${version}...`)

  // Create a release with auto-generated notes
  // The --generate-notes flag automatically generates release notes based on PRs and commits
  execSync(
    `gh release create v${version} --title "v${version}" --generate-notes`,
    { stdio: 'inherit', cwd: rootDir }
  )

  console.log(`GitHub release v${version} created successfully!`)

  // GitHub will automatically handle the changelog
  console.log('GitHub release created with auto-generated notes')
} catch (error) {
  // If the release already exists, this is not a fatal error
  if (error.message.includes('already exists')) {
    console.log(`GitHub release v${version} already exists, skipping creation.`)

    // GitHub will automatically handle the changelog
    console.log('GitHub release already exists with auto-generated notes')
  } else {
    console.error('Error creating GitHub release:', error.message)
    // Don't exit with error to allow the npm publish to continue
    // process.exit(1)
  }
}
