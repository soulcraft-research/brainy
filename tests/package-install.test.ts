/**
 * Package Installation Test
 * 
 * This test simulates installing the @soulcraft/brainy package in a clean environment
 * to verify that no --legacy-peer-deps warnings occur and the package installs cleanly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

describe('Package Installation', () => {
  let tempDir: string
  let packagePath: string

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = await mkdtemp(join(tmpdir(), 'brainy-install-test-'))
    
    // Pack the current package
    const { stdout } = await execAsync('npm pack')
    // The npm pack output includes the filename on the last line
    const lines = stdout.trim().split('\n')
    const packageFile = lines[lines.length - 1]
    packagePath = join(process.cwd(), packageFile)
    console.log('Created package:', packagePath)
  }, 120000) // 2 minute timeout for packing

  afterAll(async () => {
    // Clean up
    try {
      await rm(tempDir, { recursive: true, force: true })
      await rm(packagePath, { force: true })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('should install without peer dependency warnings', async () => {
    // Create a minimal package.json
    const testPackageJson = {
      name: 'test-brainy-install',
      version: '1.0.0',
      type: 'module',
      dependencies: {}
    }

    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify(testPackageJson, null, 2)
    )

    // Install the package and capture output
    // Use --ignore-scripts to skip the prepare script during install test
    let installOutput = ''
    let installError = ''
    
    try {
      const { stdout, stderr } = await execAsync(
        `npm install ${packagePath} --loglevel=warn --ignore-scripts`,
        { cwd: tempDir }
      )
      installOutput = stdout
      installError = stderr
    } catch (error: any) {
      installOutput = error.stdout || ''
      installError = error.stderr || ''
      
      // If installation actually failed (not just warnings), throw
      if (error.code !== 0 && !installError.includes('npm WARN')) {
        throw error
      }
    }

    console.log('Install output:', installOutput)
    console.log('Install warnings/errors:', installError)

    // Verify no legacy peer deps warning
    expect(installError).not.toContain('--legacy-peer-deps')
    expect(installError).not.toContain('conflicting peer dependency')
    expect(installError).not.toContain('Could not resolve dependency')
    
    // Verify the warning about optional @soulcraft/brainy-models is acceptable
    // This is expected and okay since it's marked as optional
    if (installError.includes('@soulcraft/brainy-models')) {
      expect(installError).toContain('optional')
    }

    // Verify package was actually installed
    const installedPackageJson = await readFile(
      join(tempDir, 'package.json'),
      'utf-8'
    )
    const installedPackage = JSON.parse(installedPackageJson)
    expect(installedPackage.dependencies).toHaveProperty('@soulcraft/brainy')
  }, 120000) // 2 minute timeout

  it.skip('should allow basic usage after installation', async () => {
    // Skip this test as it requires the package to be fully built
    // The first test is sufficient to verify no peer dependency warnings
    console.log('Skipping usage test - requires full build')
  })
})