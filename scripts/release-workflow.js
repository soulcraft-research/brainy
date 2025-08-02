#!/usr/bin/env node

/**
 * Release Workflow Script
 *
 * This script provides a comprehensive workflow for releasing a new version:
 * 1. Updates the version (major, minor, or patch)
 * 2. Automatically updates the CHANGELOG.md with commit messages since the last release
 * 3. Creates a GitHub release
 * 4. Deploys to NPM
 *
 * Usage:
 *   node scripts/release-workflow.js [patch|minor|major]
 *
 * If no version type is specified, it defaults to "patch"
 */

/* global process, console */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the root directory
const rootDir = path.join(__dirname, '..')

// Get the version type from command line arguments
const args = process.argv.slice(2)
const versionType = args[0] || 'patch'

// Validate version type
if (!['patch', 'minor', 'major'].includes(versionType)) {
  // eslint-disable-next-line no-console
  console.error('Error: Version type must be one of: patch, minor, major')
  // eslint-disable-next-line no-process-exit
  process.exit(1)
}

// Function to execute a command and log its output
function executeStep(command, description) {
  // eslint-disable-next-line no-console
  console.log(`\n🚀 ${description}...\n`)
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir })
    // eslint-disable-next-line no-console
    console.log(`✅ ${description} completed successfully!\n`)
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ Error during ${description.toLowerCase()}: ${error.message}`
    )
    return false
  }
}

// Main workflow
async function runReleaseWorkflow() {
  // eslint-disable-next-line no-console
  console.log(`\n=== Starting Release Workflow (${versionType}) ===\n`)

  // Step 1: Build the project
  if (!executeStep('npm run build', 'Building project')) {
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }

  // Step 2: Run tests to ensure everything is working
  if (!executeStep('npm test', 'Running tests')) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️ Tests failed. This might indicate issues with the release.'
    )

    // Ask the user if they want to continue despite test failures
    // eslint-disable-next-line no-console
    console.log(
      '\n⚠️ Do you want to continue with the release process despite test failures? (y/N)'
    )

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const response = await new Promise((resolve) => {
      readline.question('', (answer) => {
        readline.close()
        resolve(answer.toLowerCase())
      })
    })

    if (response !== 'y' && response !== 'yes') {
      // eslint-disable-next-line no-console
      console.error('Release process aborted due to test failures.')
      // eslint-disable-next-line no-process-exit
      process.exit(1)
    }

    // eslint-disable-next-line no-console
    console.log('Continuing with release process despite test failures...')
  }

  // Step 3: Update version and generate changelog
  if (
    !executeStep(
      `npm run _release:${versionType}`,
      `Updating version (${versionType}) and generating changelog`
    )
  ) {
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }

  // Step 4: Create GitHub release
  if (!executeStep('npm run _github-release', 'Creating GitHub release')) {
    // eslint-disable-next-line no-console
    console.log(
      'Warning: GitHub release creation failed, but continuing with deployment...'
    )
  }

  // Step 5: Publish to NPM
  if (!executeStep('npm publish', 'Publishing to NPM')) {
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }

  // Get the new version from package.json
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const newVersion = packageJson.version

  // eslint-disable-next-line no-console
  console.log(`\n🎉 Release v${newVersion} completed successfully! 🎉\n`)
  // eslint-disable-next-line no-console
  console.log('Summary of actions:')
  // eslint-disable-next-line no-console
  console.log(`- Project built and tested`)
  // eslint-disable-next-line no-console
  console.log(`- Version bumped to v${newVersion} (${versionType})`)
  // eslint-disable-next-line no-console
  console.log(`- CHANGELOG.md updated with recent commits`)
  // eslint-disable-next-line no-console
  console.log(`- GitHub release created with auto-generated notes`)
  // eslint-disable-next-line no-console
  console.log(`- Package published to NPM`)
  // eslint-disable-next-line no-console
  console.log('\nThank you for using the release workflow!\n')
}

// Run the workflow
runReleaseWorkflow().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error during release workflow:', error)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
