/**
 * Statistics Functionality Tests
 * Tests the getStatistics function as a consumer would use it
 */

import { describe, it, expect, beforeAll } from 'vitest'

describe('Brainy Statistics Functionality', () => {
  let brainy: any

  beforeAll(async () => {
    // Load brainy library as a consumer would
    brainy = await import('../dist/unified.js')
  })

  describe('Library Exports', () => {
    it('should export getStatistics function at the root level', () => {
      expect(brainy.getStatistics).toBeDefined()
      expect(typeof brainy.getStatistics).toBe('function')
    })
  })

  describe('getStatistics Functionality', () => {
    it('should retrieve statistics from a BrainyData instance', async () => {
      // Create a BrainyData instance
      const data = new brainy.BrainyData({
        dimensions: 3,
        metric: 'euclidean'
      })

      await data.init()
      await data.clear() // Clear any existing data

      // Add some test data
      await data.add([1, 0, 0], { id: 'v1', label: 'x-axis' })
      await data.add([0, 1, 0], { id: 'v2', label: 'y-axis' })
      await data.add([0, 0, 1], { id: 'v3', label: 'z-axis' })

      // Add a verb
      await data.addVerb('v1', 'v2', [0.5, 0.5, 0], { type: 'connected_to' })

      // Get statistics using the standalone function
      const stats = await brainy.getStatistics(data)

      // Verify statistics
      expect(stats).toBeDefined()
      expect(stats.nounCount).toBe(3)
      expect(stats.verbCount).toBe(1)
      expect(stats.metadataCount).toBe(3) // Each noun has metadata
      expect(stats.hnswIndexSize).toBe(3)
    })

    it('should throw an error when no instance is provided', async () => {
      await expect(brainy.getStatistics()).rejects.toThrow('BrainyData instance must be provided')
    })

    it('should match the instance method results', async () => {
      // Create a BrainyData instance
      const data = new brainy.BrainyData({
        dimensions: 3
      })

      await data.init()
      
      // Add some test data
      await data.add([1, 1, 1], { id: 'test1' })
      
      // Get statistics using both methods
      const instanceStats = await data.getStatistics()
      const functionStats = await brainy.getStatistics(data)
      
      // Verify they match
      expect(functionStats).toEqual(instanceStats)
    })
  })
})