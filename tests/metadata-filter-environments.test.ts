import { describe, it, expect, beforeEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { isNode, isBrowser } from '../src/utils/environment.js'

describe('Metadata Filtering - Cross-Environment', () => {
  const testConfigurations = [
    {
      name: 'Memory Storage',
      config: { storage: { forceMemoryStorage: true } }
    }
  ]

  // Add Node.js specific storage adapters
  if (isNode()) {
    testConfigurations.push({
      name: 'FileSystem Storage',
      config: { storage: { forceFileSystemStorage: true } }
    })
  }

  // Add browser specific storage adapters
  if (isBrowser()) {
    testConfigurations.push({
      name: 'OPFS Storage',
      config: { storage: { requestPersistentStorage: false } }
    })
  }

  // Test each storage configuration
  for (const testConfig of testConfigurations) {
    describe(`${testConfig.name}`, () => {
      let brainy: BrainyData

      beforeEach(async () => {
        brainy = new BrainyData({
          ...testConfig.config,
          hnsw: { M: 8, efConstruction: 50 },
          logging: { verbose: false }
        })
        await brainy.init()

        // Add test data
        const testData = [
          { 
            content: 'Senior React developer in San Francisco',
            metadata: { level: 'senior', skill: 'React', location: 'SF', remote: true }
          },
          { 
            content: 'Junior Vue developer in New York',
            metadata: { level: 'junior', skill: 'Vue', location: 'NYC', remote: false }
          },
          { 
            content: 'Mid-level TypeScript developer remote',
            metadata: { level: 'mid', skill: 'TypeScript', location: 'Remote', remote: true }
          },
          { 
            content: 'Senior Python engineer in San Francisco',
            metadata: { level: 'senior', skill: 'Python', location: 'SF', remote: false }
          },
          { 
            content: 'Senior JavaScript developer in Austin',
            metadata: { level: 'senior', skill: 'JavaScript', location: 'Austin', remote: true }
          }
        ]

        for (const item of testData) {
          await brainy.add(item.content, item.metadata)
        }
      })

      it('should filter by exact metadata match', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: { level: 'senior' }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => r.metadata?.level === 'senior')).toBe(true)
      })

      it('should filter by multiple fields', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: { 
            level: 'senior',
            location: 'SF'
          }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => 
          r.metadata?.level === 'senior' && 
          r.metadata?.location === 'SF'
        )).toBe(true)
      })

      it('should handle boolean filters', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: { remote: true }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => r.metadata?.remote === true)).toBe(true)
      })

      it('should handle $in operator', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: { 
            skill: { $in: ['React', 'Vue', 'TypeScript'] }
          }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => 
          ['React', 'Vue', 'TypeScript'].includes(r.metadata?.skill)
        )).toBe(true)
      })

      it('should handle combined filters with $and', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: {
            $and: [
              { level: 'senior' },
              { remote: true }
            ]
          }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => 
          r.metadata?.level === 'senior' && 
          r.metadata?.remote === true
        )).toBe(true)
      })

      it('should handle $or operator', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: {
            $or: [
              { location: 'SF' },
              { location: 'NYC' }
            ]
          }
        })

        expect(results.length).toBeGreaterThan(0)
        expect(results.every(r => 
          r.metadata?.location === 'SF' || 
          r.metadata?.location === 'NYC'
        )).toBe(true)
      })

      it('should return empty results when no items match filter', async () => {
        const results = await brainy.searchText('developer', 10, {
          metadata: { 
            level: 'expert' // Non-existent level
          }
        })

        expect(results.length).toBe(0)
      })

      it('should work with searchWithinItems', async () => {
        // First get all senior developers
        const allItems = await brainy.getNouns({
          filter: {
            metadata: { level: 'senior' }
          }
        })
        
        const seniorIds = allItems.items.map(item => item.id)
        
        // Search within senior developers only
        const results = await brainy.searchWithinItems(
          'JavaScript',
          seniorIds,
          5
        )

        expect(results.length).toBeGreaterThanOrEqual(0)
        expect(results.every(r => seniorIds.includes(r.id))).toBe(true)
      })

      it('should handle metadata updates correctly', async () => {
        // Add an item
        const id = await brainy.add('Test developer', { level: 'junior' })
        
        // Search should find it with junior filter
        let results = await brainy.searchText('Test developer', 10, {
          metadata: { level: 'junior' }
        })
        expect(results.some(r => r.id === id)).toBe(true)

        // Update metadata
        await brainy.updateMetadata(id, { level: 'senior' })

        // Should now find it with senior filter
        results = await brainy.searchText('Test developer', 10, {
          metadata: { level: 'senior' }
        })
        expect(results.some(r => r.id === id)).toBe(true)

        // Should NOT find it with junior filter anymore
        results = await brainy.searchText('Test developer', 10, {
          metadata: { level: 'junior' }
        })
        expect(results.some(r => r.id === id)).toBe(false)
      })

      it('should handle null/undefined metadata gracefully', async () => {
        // Add item without metadata
        await brainy.add('No metadata item')

        // Search with filter should not crash
        const results = await brainy.searchText('metadata', 10, {
          metadata: { level: 'senior' }
        })

        // Should only return items that match the filter
        expect(results.every(r => r.metadata?.level === 'senior')).toBe(true)
      })
    })
  }

  describe('Performance considerations', () => {
    it('should handle large result sets efficiently', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        hnsw: { M: 16, efConstruction: 100 },
        logging: { verbose: false }
      })
      await brainy.init()

      // Add many items
      const categories = ['A', 'B', 'C', 'D', 'E']
      const levels = ['junior', 'mid', 'senior']
      
      for (let i = 0; i < 100; i++) {
        await brainy.add(
          `Item ${i} with various properties`,
          {
            category: categories[i % categories.length],
            level: levels[i % levels.length],
            index: i
          }
        )
      }

      const startTime = Date.now()
      
      // Search with complex filter
      const results = await brainy.searchText('Item', 20, {
        metadata: {
          $and: [
            { category: { $in: ['A', 'B', 'C'] } },
            { level: { $ne: 'junior' } }
          ]
        }
      })

      const duration = Date.now() - startTime

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(20)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      
      // Verify all results match the filter
      expect(results.every(r => {
        const m = r.metadata
        return ['A', 'B', 'C'].includes(m?.category) && m?.level !== 'junior'
      })).toBe(true)
    })
  })
})