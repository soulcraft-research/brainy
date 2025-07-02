#!/usr/bin/env node

/**
 * CLI Wrapper Script for @soulcraft/brainy-cli
 *
 * This script serves as a wrapper for the Brainy CLI, ensuring that command-line arguments
 * are properly passed to the CLI when invoked through the globally installed package.
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Node.js v23+ compatibility patches were previously applied here,
// but these patches are no longer necessary with current TensorFlow.js versions.
// TensorFlow.js now works correctly with Node.js 24+ without any special handling.

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Find the main package
const mainPackagePath = join(__dirname, 'node_modules', '@soulcraft', 'brainy')

// Path to the actual CLI script in this package
const cliPath = join(__dirname, 'dist', 'cli.js')

// Check if the CLI script exists
if (!fs.existsSync(cliPath)) {
  console.error(`Error: CLI script not found at ${cliPath}`)
  console.error(
    'This is likely because the CLI was not built during package installation.'
  )
  console.error('Please reinstall the package with:')
  console.error('npm uninstall -g @soulcraft/brainy-cli')
  console.error('npm install -g @soulcraft/brainy-cli')
  process.exit(1)
}

// Special handling for version flags
if (process.argv.includes('--version') || process.argv.includes('-V')) {
  // Read version directly from package.json to ensure it's always correct
  try {
    const packageJsonPath = join(__dirname, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    console.log(packageJson.version)
    process.exit(0)
  } catch (error) {
    console.error('Error loading version information:', error.message)
    process.exit(1)
  }
}

// Forward all arguments to the CLI script
const args = process.argv.slice(2)

// Check if npm is passing --force flag
// When npm runs with --force, it sets the npm_config_force environment variable
if (
  process.env.npm_config_force === 'true' &&
  args.includes('clear') &&
  !args.includes('--force') &&
  !args.includes('-f')
) {
  args.push('--force')
}

const cli = spawn('node', [cliPath, ...args], { stdio: 'inherit' })

cli.on('close', (code) => {
  process.exit(code)
})
