/**
 * Performance Tests
 * 
 * Purpose:
 * This test suite measures the performance of Brainy operations with different dataset sizes:
 * 1. Small datasets (10-100 items)
 * 2. Medium datasets (100-1000 items)
 * 3. Large datasets (1000+ items)
 * 
 * These tests help identify performance bottlenecks and ensure the library
 * remains efficient as the dataset grows.
 * 
 * Note: These tests are marked as "slow" and may take longer to run.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData, createStorage } from '../dist/unified.js'

// Helper function to measure execution time
const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Helper function to generate test data
const generateTestData = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `Test item ${i} with some additional text for embedding`)
}

describe('Performance Tests', () => {
  let brainyInstance: any
  
  beforeEach(async () => {
    // Create a test BrainyData instance with memory storage for faster tests
    const storage = await createStorage({ forceMemoryStorage: true })
    brainyInstance = new BrainyData({
      storageAdapter: storage
    })
    
    await brainyInstance.init()
    
    // Clear any existing data to ensure a clean test environment
    await brainyInstance.clear()
  })
  
  afterEach(async () => {
    // Clean up after each test
    if (brainyInstance) {
      await brainyInstance.clear()
      await brainyInstance.shutDown()
    }
  })
  
  describe('Small Dataset (10-100 items)', () => {
    it('should add items efficiently', async () => {
      const items = generateTestData(50)
      
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.addBatch(items)
      })
      
      console.log(`Adding 50 items took ${executionTime.toFixed(2)}ms (${(executionTime / 50).toFixed(2)}ms per item)`)
      
      // Verify all items were added
      const size = await brainyInstance.size()
      expect(size).toBe(50)
      
      // No specific performance assertion, just logging for analysis
    })
    
    it('should search efficiently', async () => {
      // Add test data
      const items = generateTestData(50)
      await brainyInstance.addBatch(items)
      
      // Measure search performance
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.search('Test item', 10)
      })
      
      console.log(`Searching in 50 items took ${executionTime.toFixed(2)}ms`)
      
      // No specific performance assertion, just logging for analysis
    })
  })
  
  describe('Medium Dataset (100-1000 items)', () => {
    it('should add items efficiently', async () => {
      const items = generateTestData(200)
      
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.addBatch(items)
      })
      
      console.log(`Adding 200 items took ${executionTime.toFixed(2)}ms (${(executionTime / 200).toFixed(2)}ms per item)`)
      
      // Verify all items were added
      const size = await brainyInstance.size()
      expect(size).toBe(200)
    })
    
    it('should search efficiently', async () => {
      // Add test data
      const items = generateTestData(200)
      await brainyInstance.addBatch(items)
      
      // Measure search performance
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.search('Test item', 10)
      })
      
      console.log(`Searching in 200 items took ${executionTime.toFixed(2)}ms`)
    })
    
    it('should handle multiple concurrent searches efficiently', async () => {
      // Add test data
      const items = generateTestData(200)
      await brainyInstance.addBatch(items)
      
      // Perform multiple concurrent searches
      const searchQueries = [
        'Test item 10',
        'Test item 50',
        'Test item 100',
        'Test item 150',
        'Test item 190'
      ]
      
      const executionTime = await measureExecutionTime(async () => {
        await Promise.all(searchQueries.map(query => brainyInstance.search(query, 10)))
      })
      
      console.log(`5 concurrent searches in 200 items took ${executionTime.toFixed(2)}ms (${(executionTime / 5).toFixed(2)}ms per search)`)
    })
  })
  
  // Large dataset tests are skipped by default as they can be slow
  // Use .only instead of .skip to run these tests specifically
  describe.skip('Large Dataset (1000+ items)', () => {
    it('should add items efficiently', async () => {
      const items = generateTestData(1000)
      
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.addBatch(items)
      })
      
      console.log(`Adding 1000 items took ${executionTime.toFixed(2)}ms (${(executionTime / 1000).toFixed(2)}ms per item)`)
      
      // Verify all items were added
      const size = await brainyInstance.size()
      expect(size).toBe(1000)
    })
    
    it('should search efficiently', async () => {
      // Add test data
      const items = generateTestData(1000)
      await brainyInstance.addBatch(items)
      
      // Measure search performance
      const executionTime = await measureExecutionTime(async () => {
        await brainyInstance.search('Test item', 10)
      })
      
      console.log(`Searching in 1000 items took ${executionTime.toFixed(2)}ms`)
    })
    
    it('should handle multiple concurrent searches efficiently', async () => {
      // Add test data
      const items = generateTestData(1000)
      await brainyInstance.addBatch(items)
      
      // Perform multiple concurrent searches
      const searchQueries = [
        'Test item 100',
        'Test item 300',
        'Test item 500',
        'Test item 700',
        'Test item 900'
      ]
      
      const executionTime = await measureExecutionTime(async () => {
        await Promise.all(searchQueries.map(query => brainyInstance.search(query, 10)))
      })
      
      console.log(`5 concurrent searches in 1000 items took ${executionTime.toFixed(2)}ms (${(executionTime / 5).toFixed(2)}ms per search)`)
    })
  })
  
  describe('Performance Scaling', () => {
    it('should demonstrate search performance scaling with dataset size', async () => {
      // Test with different dataset sizes
      const datasetSizes = [10, 50, 100]
      const results: { size: number; time: number }[] = []
      
      for (const size of datasetSizes) {
        // Add test data
        const items = generateTestData(size)
        await brainyInstance.addBatch(items)
        
        // Measure search performance
        const executionTime = await measureExecutionTime(async () => {
          await brainyInstance.search('Test item', 10)
        })
        
        results.push({ size, time: executionTime })
        
        // Clear for next iteration
        await brainyInstance.clear()
      }
      
      // Log results
      console.log('Search Performance Scaling:')
      results.forEach(result => {
        console.log(`Dataset size: ${result.size}, Search time: ${result.time.toFixed(2)}ms`)
      })
      
      // Calculate scaling factor (how much slower per item)
      if (results.length >= 2) {
        const smallestDataset = results[0]
        const largestDataset = results[results.length - 1]
        
        const scalingFactor = (largestDataset.time / smallestDataset.time) / 
                             (largestDataset.size / smallestDataset.size)
        
        console.log(`Scaling factor: ${scalingFactor.toFixed(2)}x`)
        
        // Ideally, the scaling factor should be close to 1 (linear scaling)
        // or less than 1 (sub-linear scaling)
      }
    })
  })
})
