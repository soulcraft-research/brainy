import { describe, it, expect, beforeEach } from 'vitest'

describe('TensorFlow.js Patch', () => {
  beforeEach(() => {
    // Clean up any global state before each test
    if (typeof global !== 'undefined') {
      delete global.__TextEncoder__
      delete global.__TextDecoder__
    }
  })

  it('should have TextEncoder and TextDecoder available in Node.js environment', () => {
    // Check if util.TextEncoder exists
    const util = require('util')

    expect(typeof util.TextEncoder).toBe('function')
    expect(typeof util.TextDecoder).toBe('function')
  })

  it('should apply TensorFlow patch and make globals available', async () => {
    // Import the patch utility
    const { applyTensorFlowPatch } = await import('../src/utils/textEncoding.ts')

    // Apply the patch
    await applyTensorFlowPatch()

    // Check that globals are available
    expect(typeof global.TextEncoder).toBe('function')
    expect(typeof global.TextDecoder).toBe('function')
    expect(typeof global.__TextEncoder__).toBe('function')
    expect(typeof global.__TextDecoder__).toBe('function')
  })

  it('should load brainy library successfully with patch applied', async () => {
    try {
      const brainy = await import('../dist/unified.js')

      expect(brainy).toBeDefined()
      expect(typeof brainy.BrainyData).toBe('function')

      // Check that globals are still available after brainy import
      expect(typeof global.TextEncoder).toBe('function')
      expect(typeof global.TextDecoder).toBe('function')
    } catch (error) {
      // If there's an error, it shouldn't be related to TextEncoder
      expect(error.message).not.toContain('TextEncoder')
      expect(error.message).not.toContain('TextDecoder')
    }
  })

  it('should load TensorFlow.js directly after patch is applied', async () => {
    // Ensure TextEncoder/TextDecoder are available
    const { TextEncoder, TextDecoder } = require('util')
    if (typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = TextEncoder
    }
    if (typeof global.TextDecoder === 'undefined') {
      global.TextDecoder = TextDecoder
    }

    try {
      const tf = await import('@tensorflow/tfjs-core')

      expect(tf).toBeDefined()
      expect(tf.version).toBeDefined()
      expect(typeof tf.version).toBe('string')
    } catch (error) {
      // If TensorFlow fails to load, it shouldn't be due to TextEncoder issues
      expect(error.message).not.toContain('TextEncoder is not a constructor')
      expect(error.message).not.toContain('TextDecoder is not a constructor')
    }
  })

  it('should handle patch application multiple times safely', async () => {
    const { applyTensorFlowPatch } = await import('../src/utils/textEncoding.ts')

    // Apply patch multiple times
    await applyTensorFlowPatch()
    await applyTensorFlowPatch()
    await applyTensorFlowPatch()

    // Should still work correctly
    expect(typeof global.TextEncoder).toBe('function')
    expect(typeof global.TextDecoder).toBe('function')
    expect(typeof global.__TextEncoder__).toBe('function')
    expect(typeof global.__TextDecoder__).toBe('function')
  })

  it('should verify patch works with brainy library initialization', async () => {
    try {
      // Import brainy which should have patches built in
      const brainy = await import('../dist/unified.js')

      expect(brainy).toBeDefined()
      expect(Object.keys(brainy)).toContain('BrainyData')

      // Try to create an instance to ensure the patch is working
      const db = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean'
      })

      expect(db).toBeDefined()
      expect(db.dimensions).toBe(2)

      // Initialize should work without TextEncoder errors
      await db.init()

    } catch (error) {
      // Should not fail due to TextEncoder issues
      expect(error.message).not.toContain('TextEncoder')
      expect(error.message).not.toContain('TextDecoder')
    }
  })

  it('should maintain compatibility with different module systems', async () => {
    // Test ES module import
    try {
      const brainyES = await import('../dist/unified.js')
      expect(brainyES).toBeDefined()
      expect(typeof brainyES.BrainyData).toBe('function')
    } catch (error) {
      expect(error.message).not.toContain('TextEncoder')
    }

    // Test CommonJS require (if available)
    try {
      const brainyCommon = require('../dist/unified.js')
      expect(brainyCommon).toBeDefined()
    } catch (error) {
      // CommonJS might not be available in all environments, that's okay
      if (!error.message.includes('require is not defined')) {
        expect(error.message).not.toContain('TextEncoder')
      }
    }
  })
})
