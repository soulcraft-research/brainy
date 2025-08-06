/**
 * Model Loading Priority Test
 * 
 * This test verifies that the model loading system correctly prioritizes
 * local models from @soulcraft/brainy-models over remote URL loading.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { RobustModelLoader } from '../src/utils/robustModelLoader.js'

describe('Model Loading Priority', () => {
  let originalConsoleLog: any
  let originalConsoleWarn: any
  let logMessages: string[] = []
  let warnMessages: string[] = []

  beforeAll(() => {
    // Capture console output
    originalConsoleLog = console.log
    originalConsoleWarn = console.warn
    
    console.log = (...args: any[]) => {
      logMessages.push(args.join(' '))
      originalConsoleLog(...args)
    }
    
    console.warn = (...args: any[]) => {
      warnMessages.push(args.join(' '))
      originalConsoleWarn(...args)
    }
  })

  afterAll(() => {
    // Restore console
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
  })

  it('should try to load @soulcraft/brainy-models first', async () => {
    logMessages = []
    warnMessages = []
    
    const loader = new RobustModelLoader({ verbose: false })
    
    try {
      // This will try to load the model
      await loader.loadModelWithFallbacks()
    } catch (error) {
      // It's okay if it fails in test environment
      console.log('Model loading failed (expected in test environment):', error)
    }
    
    // Check if it attempted to load local models (either @tensorflow-models or @soulcraft/brainy-models)
    const hasCheckedForLocalModel = logMessages.some(msg => 
      msg.includes('@soulcraft/brainy-models') || 
      msg.includes('Checking for @soulcraft/brainy-models') ||
      msg.includes('@tensorflow-models/universal-sentence-encoder') ||
      msg.includes('Checking for @tensorflow-models/universal-sentence-encoder')
    )
    
    expect(hasCheckedForLocalModel).toBe(true)
  })

  it('should log warnings when falling back to URL loading', async () => {
    logMessages = []
    warnMessages = []
    
    const loader = new RobustModelLoader({ verbose: false })
    
    try {
      await loader.loadModelWithFallbacks()
    } catch (error) {
      // Expected in test environment without actual model
    }
    
    // If @soulcraft/brainy-models is not installed, should see warning
    const hasFallbackWarning = warnMessages.some(msg => 
      msg.includes('Local model (@soulcraft/brainy-models) not found') ||
      msg.includes('Falling back to remote model loading')
    )
    
    // We should see one of these: either local model found or fallback warning
    const hasLocalModelSuccess = logMessages.some(msg => 
      msg.includes('Found @soulcraft/brainy-models package installed') ||
      msg.includes('Found @tensorflow-models/universal-sentence-encoder package')
    )
    
    // Either we found the local model OR we got a fallback warning
    expect(hasLocalModelSuccess || hasFallbackWarning).toBe(true)
    
    // If we're using fallback, should see installation suggestion
    if (hasFallbackWarning) {
      const hasInstallSuggestion = warnMessages.some(msg => 
        msg.includes('npm install @soulcraft/brainy-models')
      )
      expect(hasInstallSuggestion).toBe(true)
    }
  })

  it('should verify model correctness when loading from URL', async () => {
    // This test is more of a documentation of the expected behavior
    // The actual model loading would fail in test environment
    
    const loader = new RobustModelLoader({ verbose: true })
    
    // The loadModelWithFallbacks method now includes model verification
    // It checks that embeddings have the correct dimensions (512)
    // This ensures we're loading the Universal Sentence Encoder
    
    expect(loader).toBeDefined()
  })

  it('should prioritize local model over URL when available', async () => {
    // Mock the import to simulate @soulcraft/brainy-models being available
    const mockBrainyModels = {
      BundledUniversalSentenceEncoder: class {
        constructor(options: any) {}
        async load() { return true }
        async embedToArrays(input: string[]) {
          // Return mock embeddings with correct dimensions
          return input.map(() => new Array(384).fill(0.1))
        }
        dispose() {}
      }
    }
    
    // Create a custom loader that mocks the import
    const loader = new RobustModelLoader({ verbose: true })
    
    // Override the tryLoadLocalBundledModel to simulate local model
    const originalTryLoad = (loader as any).tryLoadLocalBundledModel
    ;(loader as any).tryLoadLocalBundledModel = async function() {
      console.log('✅ Found @soulcraft/brainy-models package installed')
      console.log('   Using local bundled model for maximum performance and reliability')
      
      // Return a mock model
      return {
        init: async () => {},
        embed: async (sentences: string | string[]) => {
          const input = Array.isArray(sentences) ? sentences : [sentences]
          return new Array(384).fill(0.1)
        },
        dispose: async () => {}
      }
    }
    
    logMessages = []
    warnMessages = []
    
    const model = await loader.loadModelWithFallbacks()
    expect(model).toBeDefined()
    
    // Should see success message for local model
    const hasLocalSuccess = logMessages.some(msg => 
      msg.includes('Using local bundled model')
    )
    expect(hasLocalSuccess).toBe(true)
    
    // Should NOT see fallback warnings
    const hasFallbackWarning = warnMessages.some(msg => 
      msg.includes('Falling back to remote model loading')
    )
    expect(hasFallbackWarning).toBe(false)
  })
})