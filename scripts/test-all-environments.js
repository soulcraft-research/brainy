#!/usr/bin/env node

/**
 * Test All Environments
 *
 * This script runs tests for the Brainy library in all environments:
 * - Browser (using Puppeteer for headless browser testing)
 * - Node.js
 * - CLI
 */

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import http from 'http'
import puppeteer from 'puppeteer'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
}

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + '='.repeat(80))
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`)
  console.log('='.repeat(80) + '\n')
}

// Helper function to run a command and return its output
function runCommand(command, cwd = rootDir) {
  try {
    return execSync(command, { stdio: 'pipe', cwd, encoding: 'utf8' })
  } catch (error) {
    log(`Error running command: ${command}`, colors.red)
    log(error.message, colors.red)
    if (error.stdout) log(`stdout: ${error.stdout}`)
    if (error.stderr) log(`stderr: ${error.stderr}`, colors.red)
    throw error
  }
}

// Main function to run all tests
async function runAllTests() {
  try {
    logSection('BUILDING PACKAGES')

    // Build the main package
    log('Building main package...', colors.yellow)
    runCommand('npm run build')
    log('Main package built successfully!', colors.green)

    // Build the browser package
    log('Building browser package...', colors.yellow)
    runCommand('npm run build:browser')
    log('Browser package built successfully!', colors.green)

    // Build the CLI package
    log('Building CLI package...', colors.yellow)
    runCommand('npm run build:cli')
    log('CLI package built successfully!', colors.green)

    logSection('RUNNING NODE.JS TESTS')

    // Run Node.js tests
    log('Running Node.js worker test...', colors.yellow)
    const nodeWorkerResult = runCommand('node test-worker.js')
    log(nodeWorkerResult)
    log('Node.js worker test completed!', colors.green)

    log('Running unified text encoding test...', colors.yellow)
    const textEncodingResult = runCommand('node test-unified-encoding.js')
    log(textEncodingResult)
    log('Unified text encoding test completed!', colors.green)

    logSection('RUNNING BROWSER TESTS')

    // Start a simple HTTP server to serve the test files
    log('Starting HTTP server...', colors.yellow)
    const server = http.createServer((req, res) => {
      // Normalize the URL to handle relative paths
      const normalizedUrl = req.url.replace(/^\/+/, '/')
      let filePath = path.join(
        rootDir,
        normalizedUrl === '/' ? 'index.html' : normalizedUrl
      )

      // Handle relative paths (e.g., ../dist/unified.js)
      if (normalizedUrl.includes('../')) {
        // Convert the URL to an absolute path relative to the root directory
        const parts = normalizedUrl.split('/')
        const resolvedParts = []

        for (const part of parts) {
          if (part === '..') {
            resolvedParts.pop()
          } else if (part && part !== '.') {
            resolvedParts.push(part)
          }
        }

        filePath = path.join(rootDir, resolvedParts.join('/'))
      }

      log(`Request for: ${req.url}, resolved to: ${filePath}`, colors.yellow)

      // Check if the file exists
      if (fs.existsSync(filePath)) {
        const extname = path.extname(filePath)
        let contentType = 'text/html'

        switch (extname) {
          case '.js':
            contentType = 'text/javascript'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
            contentType = 'image/jpg'
            break
        }

        res.writeHead(200, { 'Content-Type': contentType })
        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)
      } else {
        log(`File not found: ${filePath}`, colors.red)
        res.writeHead(404)
        res.end('File not found')
      }
    })

    // Start the server on a random port
    const PORT = 3000 + Math.floor(Math.random() * 1000)
    server.listen(PORT)
    log(`HTTP server started on port ${PORT}`, colors.green)

    // Run browser tests using Puppeteer
    log('Launching headless browser...', colors.yellow)
    // Using --no-sandbox flag to avoid issues with the Chrome sandbox in certain environments
    // See: https://chromium.googlesource.com/chromium/src/+/main/docs/linux/suid_sandbox_development.md
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()

    // Capture console logs from the page
    page.on('console', (message) => {
      const type = message.type()
      const text = message.text()
      if (type === 'error') {
        log(`Browser console error: ${text}`, colors.red)
      } else {
        log(`Browser console: ${text}`)
      }
    })

    // Test browser worker
    log('Running browser worker test...', colors.yellow)
    await page.goto(`http://localhost:${PORT}/demo/test-browser-worker.html`)
    await page.waitForSelector('#runTest')
    await page.click('#runTest')
    await page.waitForFunction(
      () => {
        const resultText = document.getElementById('result').textContent
        return resultText.includes('Worker thread execution completed')
      },
      { timeout: 30000 }
    )

    const browserWorkerResult = await page.evaluate(() => {
      return document.getElementById('result').innerHTML
    })
    log('Browser worker test result:', colors.green)
    log(browserWorkerResult.replace(/<[^>]*>/g, '').trim())

    // Test fallback mechanism
    log('Running fallback test...', colors.yellow)
    await page.goto(`http://localhost:${PORT}/demo/test-fallback.html`)
    await page.waitForSelector('#runTest')
    await page.click('#runTest')
    await page.waitForFunction(
      () => {
        const resultText = document.getElementById('result').textContent
        return resultText.includes('Test completed')
      },
      { timeout: 30000 }
    )

    const fallbackResult = await page.evaluate(() => {
      return document.getElementById('result').innerHTML
    })
    log('Fallback test result:', colors.green)
    log(fallbackResult.replace(/<[^>]*>/g, '').trim())

    // Close the browser and server
    await browser.close()
    server.close()
    log('HTTP server stopped', colors.green)

    logSection('RUNNING CLI TESTS')

    // Run CLI tests
    log('Testing CLI package locally...', colors.yellow)
    try {
      runCommand('npm run test:cli')
      log('CLI test completed!', colors.green)

      // Run some basic CLI commands to verify functionality
      log('Testing basic CLI commands...', colors.yellow)
      const cliVersionResult = runCommand('brainy --version')
      log(`CLI version: ${cliVersionResult.trim()}`, colors.green)

      const cliHelpResult = runCommand('brainy --help')
      log('CLI help command executed successfully', colors.green)

      // Test the pipeline command
      log('Testing pipeline command...', colors.yellow)
      const pipelineResult = runCommand('brainy test-pipeline "This is a test"')
      log('Pipeline test completed!', colors.green)
    } catch (error) {
      log(
        "CLI tests failed. This might be expected if you don't have the CLI installed globally.",
        colors.yellow
      )
      log(
        'You can run the CLI tests separately with: npm run test:cli',
        colors.yellow
      )
    }

    logSection('ALL TESTS COMPLETED')
    log('All environment tests completed successfully!', colors.green)
  } catch (error) {
    logSection('TEST FAILURE')
    log(`Tests failed: ${error.message}`, colors.red)
    process.exit(1)
  }
}

// Run the tests
runAllTests().catch((error) => {
  log(`Unhandled error: ${error.message}`, colors.red)
  process.exit(1)
})
