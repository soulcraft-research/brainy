#!/usr/bin/env node

/**
 * Test CLI Package Locally
 *
 * This script allows testing the CLI package locally before publishing to npm.
 * It builds both packages, creates local tarballs, and installs the CLI package
 * globally for testing.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
const cliPackageDir = path.join(rootDir, 'cli-package')

// Ensure the CLI package directory exists
if (!fs.existsSync(cliPackageDir)) {
  console.error(`Error: CLI package directory not found at ${cliPackageDir}`)
  process.exit(1)
}

try {
  // Step 1: Ensure versions are in sync
  console.log('Ensuring versions are in sync...')
  execSync('node scripts/generate-version.js', {
    stdio: 'inherit',
    cwd: rootDir
  })

  // Step 2: Build the main package
  console.log('Building main package...')
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir })

  // Step 3: Create a local tarball of the main package
  console.log('Creating local tarball of main package...')
  execSync('npm pack', { stdio: 'inherit', cwd: rootDir })

  // Read the main package.json to get the name and version
  const mainPackageJsonPath = path.join(rootDir, 'package.json')
  const mainPackageJson = JSON.parse(
    fs.readFileSync(mainPackageJsonPath, 'utf8')
  )

  // The tarball name follows a standard format: <package-name>-<version>.tgz
  const mainPackageName = mainPackageJson.name
    .replace('@', '')
    .replace('/', '-')
  const mainPackageVersion = mainPackageJson.version
  const mainTarballName = `${mainPackageName}-${mainPackageVersion}.tgz`
  const mainPackageTarball = path.join(rootDir, mainTarballName)

  // Verify the tarball exists
  if (!fs.existsSync(mainPackageTarball)) {
    console.error(
      `Error: Main package tarball not found at ${mainPackageTarball}`
    )
    process.exit(1)
  }

  console.log(`Main package tarball created: ${mainPackageTarball}`)

  // Step 4: Build the CLI package
  console.log('Building CLI package...')
  execSync('npm run build', { stdio: 'inherit', cwd: cliPackageDir })

  // Step 5: Verify the CLI was built successfully
  const cliPath = path.join(cliPackageDir, 'dist', 'cli.js')
  if (!fs.existsSync(cliPath)) {
    console.error(`Error: CLI build failed. File not found at ${cliPath}`)
    process.exit(1)
  }

  // Step 6: Temporarily update the CLI package.json to use the local main package
  console.log('Updating CLI package.json to use local main package...')
  const cliPackageJsonPath = path.join(cliPackageDir, 'package.json')
  const cliPackageJson = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8'))

  // Save the original dependency for restoration later
  const originalDependency = cliPackageJson.dependencies['@soulcraft/brainy']

  // Update to use the local tarball
  cliPackageJson.dependencies['@soulcraft/brainy'] =
    `file:${mainPackageTarball}`

  // Write the updated package.json
  fs.writeFileSync(cliPackageJsonPath, JSON.stringify(cliPackageJson, null, 2))

  // Step 7: Create a local tarball of the CLI package
  console.log('Creating local tarball of CLI package...')
  execSync('npm pack', { stdio: 'inherit', cwd: cliPackageDir })

  // The tarball name follows a standard format: <package-name>-<version>.tgz
  const cliPackageName = cliPackageJson.name.replace('@', '').replace('/', '-')
  const cliPackageVersion = cliPackageJson.version
  const cliTarballName = `${cliPackageName}-${cliPackageVersion}.tgz`
  const cliPackageTarball = path.join(cliPackageDir, cliTarballName)

  // Verify the tarball exists
  if (!fs.existsSync(cliPackageTarball)) {
    console.error(
      `Error: CLI package tarball not found at ${cliPackageTarball}`
    )
    process.exit(1)
  }

  console.log(`CLI package tarball created: ${cliPackageTarball}`)

  // Step 8: Install the CLI package globally for testing
  console.log('Installing CLI package globally for testing...')
  execSync(`npm install -g "${cliPackageTarball}"`, { stdio: 'inherit' })

  // Step 9: Restore the original dependency in CLI package.json
  console.log('Restoring original dependency in CLI package.json...')
  cliPackageJson.dependencies['@soulcraft/brainy'] = originalDependency
  fs.writeFileSync(cliPackageJsonPath, JSON.stringify(cliPackageJson, null, 2))

  console.log('\nCLI package installed globally for testing!')
  console.log('You can now run the CLI using the "brainy" command.')
  console.log('\nTo uninstall after testing:')
  console.log('npm uninstall -g @soulcraft/brainy-cli')
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
}
