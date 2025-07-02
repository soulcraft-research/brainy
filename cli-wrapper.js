#!/usr/bin/env node

/**
 * CLI Wrapper Script
 *
 * This script serves as a wrapper for the Brainy CLI, ensuring that command-line arguments
 * are properly passed to the CLI when invoked through npm scripts.
 */

import { spawn, execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to the actual CLI script
const cliPath = join(__dirname, 'dist', 'cli.js')

// Check if the CLI script exists
if (!fs.existsSync(cliPath)) {
  // Check if we're running in a global installation context
  const isGlobalInstall = __dirname.includes('node_modules') && !__dirname.includes('node_modules/.')

  if (isGlobalInstall) {
    console.error(`Error: CLI script not found at ${cliPath}`)
    console.error('This is likely because the CLI was not built during package installation.')
    console.error('Please reinstall the package with:')
    console.error('npm uninstall -g @soulcraft/brainy')
    console.error('npm install -g @soulcraft/brainy --legacy-peer-deps')
    process.exit(1)
  } else {
    // In a local development context, try to build the CLI
    console.log(`CLI script not found at ${cliPath}. Building CLI...`)

    try {
      // Run the build:cli script
      execSync('npm run build:cli', { stdio: 'inherit' })

      // Check again if the CLI script exists after building
      if (!fs.existsSync(cliPath)) {
        console.error(`Error: Failed to build CLI script at ${cliPath}`)
        process.exit(1)
      }

      console.log('CLI built successfully.')
    } catch (error) {
      console.error(`Error building CLI: ${error.message}`)
      console.error('Make sure you have the necessary dependencies installed.')
      process.exit(1)
    }
  }
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
if (process.env.npm_config_force === 'true' && args.includes('clear') && !args.includes('--force') && !args.includes('-f')) {
  args.push('--force')
}

const cli = spawn('node', [cliPath, ...args], { stdio: 'inherit' })

cli.on('close', (code) => {
  process.exit(code)
})
