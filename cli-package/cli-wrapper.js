#!/usr/bin/env node

/**
 * CLI Wrapper Script for @soulcraft/brainy-cli
 *
 * This script serves as a wrapper for the Brainy CLI, ensuring that command-line arguments
 * are properly passed to the CLI when invoked through the globally installed package.
 */

// CRITICAL: Apply TensorFlow.js environment patch before importing any other modules
// This prevents the "TextEncoder is not a constructor" error in Node.js environments
// by ensuring the global.PlatformNode class is defined before TensorFlow.js loads
function applyTensorFlowPatch() {
  try {
    // Define a custom Platform class that works in Node.js environments
    class Platform {
      constructor() {
        // Create a util object with necessary methods and constructors
        this.util = {
          // Use native TextEncoder and TextDecoder constructors
          TextEncoder: global.TextEncoder || TextEncoder,
          TextDecoder: global.TextDecoder || TextDecoder
        }

        // Initialize using native constructors directly
        this.textEncoder = new TextEncoder()
        this.textDecoder = new TextDecoder()
      }

      // Define isTypedArray directly on the instance
      isTypedArray(arr) {
        return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
      }
    }

    // Assign the Platform class to the global object as PlatformNode
    global.PlatformNode = Platform
    // Also create an instance and assign it to global.platformNode (lowercase p)
    global.platformNode = new Platform()

    console.log('Applied TensorFlow.js platform patch in CLI wrapper')
  } catch (error) {
    console.warn('Failed to apply TensorFlow.js platform patch:', error)
  }
}

// Apply the patch immediately
applyTensorFlowPatch()

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Node.js v24+ compatibility patches are now applied above,
// before any imports, to ensure TensorFlow.js can correctly
// detect and use the TextEncoder/TextDecoder in the environment.

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
