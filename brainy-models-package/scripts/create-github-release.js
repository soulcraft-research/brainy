#!/usr/bin/env node

/**
 * Create GitHub Release Script for @soulcraft/brainy-models-package
 *
 * This script creates a GitHub release with auto-generated release notes
 * for the current version of the brainy-models-package.
 * 
 * It uses the GitHub CLI (gh) to create the release, so the gh CLI must be installed
 * and authenticated with appropriate permissions.
 * 
 * The script:
 * 1. Gets the current version from package.json
 * 2. Creates a GitHub release for that version with models-package prefix
 * 3. Auto-generates release notes based on commits since the last release
 * 
 * This ensures that each npm release has a corresponding GitHub release with notes.
 */

/* global process, console */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the brainy-models-package directory
const packageDir = path.join(__dirname, '..')
const rootDir = path.join(__dirname, '..', '..')

// Path to package.json
const packageJsonPath = path.join(packageDir, 'package.json')

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version
const tagName = `models-package-v${version}`

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
  const tagOutput = execSync(`git tag -l ${tagName}`, { stdio: 'pipe', cwd: rootDir }).toString().trim()
  tagExistsLocally = tagOutput === tagName
} catch (error) {
  console.log(`Error checking if tag exists: ${error.message}`)
  tagExistsLocally = false
}

// Create and push the tag if it doesn't exist
if (!tagExistsLocally) {
  try {
    console.log(`Creating tag ${tagName}...`)
    execSync(`git tag ${tagName}`, { stdio: 'inherit', cwd: rootDir })
    console.log(`Successfully created tag ${tagName}`)
  } catch (error) {
    console.error(`Error creating tag: ${error.message}`)
    process.exit(1)
  }
}

// Push the tag to remote
try {
  console.log(`Pushing tag ${tagName} to remote...`)
  execSync(`git push origin ${tagName}`, { stdio: 'inherit', cwd: rootDir })
  console.log(`Successfully pushed tag ${tagName} to remote`)
} catch (error) {
  console.error(`Error pushing tag to remote: ${error.message}`)
  // Continue with release creation even if tag push fails
}

// Create the GitHub release
try {
  console.log(`Creating GitHub release for @soulcraft/brainy-models-package v${version}...`)

  // Create a release with auto-generated notes
  // The --generate-notes flag automatically generates release notes based on PRs and commits
  execSync(
    `gh release create ${tagName} --title "@soulcraft/brainy-models-package v${version}" --generate-notes --notes "Release of @soulcraft/brainy-models-package v${version} - Pre-bundled TensorFlow models for maximum reliability with Brainy vector database."`,
    { stdio: 'inherit', cwd: rootDir }
  )

  console.log(`GitHub release ${tagName} created successfully!`)
  console.log('GitHub release created with auto-generated notes')
} catch (error) {
  // If the release already exists, this is not a fatal error
  if (error.message.includes('already exists')) {
    console.log(`GitHub release ${tagName} already exists, skipping creation.`)
    console.log('GitHub release already exists with auto-generated notes')
  } else {
    console.error('Error creating GitHub release:', error.message)
    // Don't exit with error to allow the npm publish to continue
    // process.exit(1)
  }
}
