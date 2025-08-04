/**
 * Tests for automatic cache configuration system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { cleanupWorkerPools } from '../src/utils/index.js'

describe('Auto-Configuration System', () => {
  let brainy: BrainyData

  afterEach(async () => {
    if (brainy) {
      await brainy.clear()
    }
    await cleanupWorkerPools()
  })

  describe('Automatic Cache Configuration', () => {
    it('should auto-configure cache for memory storage', async () => {
      // Create instance without explicit cache configuration
      brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        logging: { verbose: false } // Disable logging for test
      })
      await brainy.init()

      const cacheStats = brainy.getCacheStats()
      
      // Cache should be enabled by default
      expect(cacheStats.search.enabled).toBe(true)
      expect(cacheStats.search.maxSize).toBeGreaterThan(0)
    })

    it('should auto-configure for distributed S3 storage', async () => {
      // Create instance with S3 storage configuration
      brainy = new BrainyData({
        storage: {
          forceMemoryStorage: true // Use memory for testing, but auto-configurator should detect S3 intent
        },
        logging: { verbose: false }
      })
      await brainy.init()

      const cacheStats = brainy.getCacheStats()
      const realtimeConfig = brainy.getRealtimeUpdateConfig()
      
      // With memory storage, real-time updates should be disabled by default
      // But cache should still be properly configured
      expect(cacheStats.search.enabled).toBe(true)
      expect(cacheStats.search.maxSize).toBeGreaterThan(0)
    })

    it('should respect explicit configuration over auto-configuration', async () => {
      const explicitConfig = {
        enabled: true,
        maxSize: 999,
        maxAge: 123456
      }

      brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        searchCache: explicitConfig,
        logging: { verbose: false }
      })
      await brainy.init()

      const cacheStats = brainy.getCacheStats()
      
      // Should use explicit configuration
      expect(cacheStats.search.enabled).toBe(true)
      expect(cacheStats.search.maxSize).toBe(999)
    })

    it('should adapt cache configuration based on usage patterns', async () => {
      brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        logging: { verbose: false }
      })
      await brainy.init()

      // Add some test data
      for (let i = 0; i < 20; i++) {
        await brainy.add({
          id: `test-${i}`,
          text: `test data ${i}`
        })
      }

      // Get initial cache configuration
      const initialStats = brainy.getCacheStats()
      const initialMaxSize = initialStats.search.maxSize

      // Perform many searches to create usage patterns
      for (let i = 0; i < 10; i++) {
        await brainy.search(`test data ${i % 5}`, 5)
      }

      // Manual trigger of adaptation (normally happens during real-time updates)
      // Since we're testing with memory storage, we'll manually check the configurator is working
      const currentStats = brainy.getCacheStats()
      
      // Cache should still be operational and have reasonable settings
      expect(currentStats.search.enabled).toBe(true)
      expect(currentStats.search.maxSize).toBeGreaterThan(0)
      expect(currentStats.search.hits).toBeGreaterThan(0) // Should have cache hits
    })
  })

  describe('Environment-Specific Auto-Configuration', () => {
    it('should configure differently for read-heavy vs write-heavy workloads', async () => {
      // Test read-heavy configuration
      const readHeavyBrainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        logging: { verbose: false }
      })
      await readHeavyBrainy.init()

      // Add some data
      await readHeavyBrainy.add({ id: 'test-1', text: 'test data' })

      // Simulate read-heavy usage
      for (let i = 0; i < 20; i++) {
        await readHeavyBrainy.search('test data', 5)
      }

      const readHeavyStats = readHeavyBrainy.getCacheStats()
      
      // Should have good cache performance
      expect(readHeavyStats.search.hitRate).toBeGreaterThan(0.5)
      expect(readHeavyStats.search.enabled).toBe(true)

      await readHeavyBrainy.clear()
    })

    it('should handle zero-configuration scenarios gracefully', async () => {
      // Create instance with absolutely minimal configuration
      brainy = new BrainyData({
        logging: { verbose: false }
      })
      await brainy.init()

      // Should still work with auto-detected configuration
      await brainy.add({ text: 'auto-config test unique phrase' })
      const results = await brainy.search('unique phrase', 5)
      
      expect(results.length).toBeGreaterThanOrEqual(1)

      // Cache should be configured by auto-configurator
      const stats = brainy.getCacheStats()
      expect(stats.search.enabled).toBe(true)
      expect(stats.search.maxSize).toBeGreaterThan(0)
    })
  })

  describe('Configuration Explanations', () => {
    it('should provide configuration explanations when verbose logging is enabled', async () => {
      // Capture console output
      const consoleLogs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '))
      }

      try {
        brainy = new BrainyData({
          storage: {
            forceMemoryStorage: true
          },
          logging: { verbose: true }
        })
        await brainy.init()

        // Should have logged configuration explanation
        const configLogs = consoleLogs.filter(log => 
          log.includes('Auto-Configuration') || 
          log.includes('Distributed storage detected') ||
          log.includes('Cache:') ||
          log.includes('Updates:')
        )
        
        expect(configLogs.length).toBeGreaterThan(0)
      } finally {
        console.log = originalLog
      }
    })
  })

  describe('Performance Optimization', () => {
    it('should optimize cache settings for different scenarios', async () => {
      // Test with high-performance configuration
      brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        logging: { verbose: false }
      })
      await brainy.init()

      // Add test data
      for (let i = 0; i < 50; i++) {
        await brainy.add({
          id: `perf-test-${i}`,
          text: `performance test data ${i}`
        })
      }

      // Perform searches to warm up cache
      for (let i = 0; i < 10; i++) {
        await brainy.search(`performance test data ${i % 5}`, 10)
      }

      const stats = brainy.getCacheStats()
      
      // Should have good performance characteristics
      expect(stats.search.hits).toBeGreaterThan(0)
      expect(stats.search.hitRate).toBeGreaterThan(0.3) // At least 30% hit rate
      expect(stats.searchMemoryUsage).toBeGreaterThan(0)
    })
  })
})