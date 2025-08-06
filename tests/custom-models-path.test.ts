/**
 * Custom Models Path Test
 * 
 * Tests the custom models directory functionality for Docker deployments
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { RobustModelLoader } from '../src/utils/robustModelLoader.js'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('Custom Models Path', () => {
  let tempDir: string
  let originalEnv: string | undefined

  beforeAll(() => {
    // Save original environment variable
    originalEnv = process.env.BRAINY_MODELS_PATH
  })

  afterAll(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.BRAINY_MODELS_PATH = originalEnv
    } else {
      delete process.env.BRAINY_MODELS_PATH
    }
  })

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = join(tmpdir(), `brainy-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('should use BRAINY_MODELS_PATH environment variable', async () => {
    // Set environment variable
    process.env.BRAINY_MODELS_PATH = tempDir

    const loader = new RobustModelLoader({ verbose: true })
    expect((loader as any).options.customModelsPath).toBe(tempDir)
  })

  it('should use MODELS_PATH environment variable as fallback', async () => {
    // Clear BRAINY_MODELS_PATH and set MODELS_PATH
    delete process.env.BRAINY_MODELS_PATH
    process.env.MODELS_PATH = tempDir

    const loader = new RobustModelLoader({ verbose: true })
    expect((loader as any).options.customModelsPath).toBe(tempDir)

    // Clean up
    delete process.env.MODELS_PATH
  })

  it('should prioritize customModelsPath option over environment variables', async () => {
    process.env.BRAINY_MODELS_PATH = '/env/path'
    const customPath = '/custom/path'

    const loader = new RobustModelLoader({ 
      customModelsPath: customPath,
      verbose: true 
    })
    
    expect((loader as any).options.customModelsPath).toBe(customPath)
  })

  it('should check multiple subdirectories for models', async () => {
    const loader = new RobustModelLoader({ 
      customModelsPath: tempDir,
      verbose: true 
    })

    // Create a mock model.json in one of the expected subdirectories
    const modelDir = join(tempDir, 'universal-sentence-encoder')
    await mkdir(modelDir, { recursive: true })
    
    const mockModelJson = {
      format: 'tfjs-graph-model',
      modelTopology: {},
      weightsManifest: []
    }
    
    await writeFile(
      join(modelDir, 'model.json'), 
      JSON.stringify(mockModelJson, null, 2)
    )

    // Mock the tryLoadFromCustomPath method to avoid actual TensorFlow loading
    const tryLoadSpy = vi.spyOn(loader as any, 'tryLoadFromCustomPath')
    tryLoadSpy.mockResolvedValue(null) // Return null to avoid complex mocking

    await (loader as any).tryLoadLocalBundledModel()

    // Verify the method was called with the correct path
    expect(tryLoadSpy).toHaveBeenCalledWith(tempDir)
  })

  it('should log helpful messages when checking custom path', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const loader = new RobustModelLoader({ 
      customModelsPath: tempDir,
      verbose: true 
    })

    try {
      await (loader as any).tryLoadLocalBundledModel()
    } catch (error) {
      // Expected in test environment
    }

    // Check that it logged the custom path check
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Checking custom models directory: ${tempDir}`)
    )

    consoleSpy.mockRestore()
  })

  it('should handle non-existent custom paths gracefully', async () => {
    const nonExistentPath = '/this/path/does/not/exist'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const loader = new RobustModelLoader({ 
      customModelsPath: nonExistentPath,
      verbose: true 
    })

    const result = await (loader as any).tryLoadFromCustomPath(nonExistentPath)
    expect(result).toBeNull()

    // Should log that no model was found
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`No model found in custom path: ${nonExistentPath}`)
    )

    consoleSpy.mockRestore()
  })

  it('should provide helpful warning messages about custom paths', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Test without any custom path set
    const loader = new RobustModelLoader({ verbose: false })

    try {
      await loader.loadModelWithFallbacks()
    } catch (error) {
      // Expected in test environment without actual models
    }

    // Check that the warning mentions the custom path option or brainy-models
    const warnCalls = consoleSpy.mock.calls.flat()
    const hasCustomPathMention = warnCalls.some(call => 
      typeof call === 'string' && (
        call.includes('BRAINY_MODELS_PATH') ||
        call.includes('customModelsPath') ||
        call.includes('@soulcraft/brainy-models')
      )
    )

    expect(hasCustomPathMention).toBe(true)

    consoleSpy.mockRestore()
  })
})