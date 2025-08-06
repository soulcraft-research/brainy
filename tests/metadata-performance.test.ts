/**
 * Metadata Filtering Performance Analysis
 * 
 * This test suite analyzes the performance impact of the metadata filtering system:
 * 1. Index Build Time - How metadata indexing affects initialization
 * 2. Index Storage Overhead - Storage space required for inverted indexes
 * 3. Search Performance - Filtered vs non-filtered search speeds
 * 4. Memory Usage - Additional memory needed for metadata indexes
 * 5. Write Performance - Impact on add/update/delete operations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { MetadataIndexManager } from '../src/utils/metadataIndex.js'

// Helper function to measure execution time
const measureTime = async (fn: () => Promise<any>): Promise<{ result: any, time: number }> => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return { result, time: end - start }
}

// Helper function to estimate memory usage
const measureMemory = () => {
  if (typeof performance.memory !== 'undefined') {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    }
  }
  return null
}

// Generate realistic test data with metadata
const generateTestDataWithMetadata = (count: number) => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
  const levels = ['junior', 'senior', 'staff', 'principal', 'director']
  const locations = ['SF', 'NYC', 'LA', 'Seattle', 'Austin', 'Boston']
  const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker']
  const companies = ['TechCorp', 'DataSys', 'CloudInc', 'DevTools', 'AILabs']

  return Array.from({ length: count }, (_, i) => ({
    text: `Profile ${i}: Professional with extensive experience in software development and team leadership`,
    metadata: {
      id: `profile-${i}`,
      department: departments[i % departments.length],
      level: levels[i % levels.length],
      location: locations[i % locations.length],
      salary: 50000 + (i % 10) * 10000,
      experience: 1 + (i % 15),
      skills: skills.slice(0, 2 + (i % 4)),
      company: companies[i % companies.length],
      remote: i % 3 === 0,
      active: i % 5 !== 0,
      tags: [`tag-${i % 20}`, `category-${i % 10}`],
      nested: {
        profile: {
          rating: 1 + (i % 5),
          verified: i % 4 === 0
        },
        preferences: {
          timezone: `UTC-${(i % 12) - 6}`,
          workStyle: i % 2 === 0 ? 'collaborative' : 'independent'
        }
      }
    }
  }))
}

describe('Metadata Filtering Performance Analysis', () => {
  describe('1. Index Build Time Impact', () => {
    it('should measure initialization time with vs without metadata indexing', async () => {
      const testData = generateTestDataWithMetadata(500)
      
      console.log('\n=== Index Build Time Analysis ===')
      
      // Test WITHOUT metadata indexing
      const withoutIndexing = await measureTime(async () => {
        const brainy = new BrainyData({
          storage: { forceMemoryStorage: true },
          hnsw: { M: 8, efConstruction: 50 },
          logging: { verbose: false }
          // No metadataIndex config
        })
        await brainy.init()
        
        // Add data
        for (const item of testData) {
          await brainy.add(item.text, item.metadata)
        }
        
        return brainy
      })
      
      console.log(`WITHOUT indexing: ${withoutIndexing.time.toFixed(2)}ms for 500 items`)
      console.log(`Per item: ${(withoutIndexing.time / 500).toFixed(2)}ms`)
      
      // Test WITH metadata indexing
      const withIndexing = await measureTime(async () => {
        const brainy = new BrainyData({
          storage: { forceMemoryStorage: true },
          hnsw: { M: 8, efConstruction: 50 },
          logging: { verbose: false },
          metadataIndex: {
            maxIndexSize: 10000,
            autoOptimize: true,
            excludeFields: ['id']
          }
        })
        await brainy.init()
        
        // Add data
        for (const item of testData) {
          await brainy.add(item.text, item.metadata)
        }
        
        return brainy
      })
      
      console.log(`WITH indexing: ${withIndexing.time.toFixed(2)}ms for 500 items`)
      console.log(`Per item: ${(withIndexing.time / 500).toFixed(2)}ms`)
      
      const overhead = ((withIndexing.time - withoutIndexing.time) / withoutIndexing.time) * 100
      console.log(`Index build overhead: ${overhead.toFixed(1)}%`)
      
      // Cleanup
      await withoutIndexing.result.shutDown()
      await withIndexing.result.shutDown()
    })
    
    it('should measure batch insert performance with indexing', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      const batchSizes = [50, 100, 200, 500]
      console.log('\n=== Batch Insert Performance ===')
      
      for (const size of batchSizes) {
        const testData = generateTestDataWithMetadata(size)
        
        const { time } = await measureTime(async () => {
          for (const item of testData) {
            await brainy.add(item.text, item.metadata)
          }
        })
        
        console.log(`${size} items: ${time.toFixed(2)}ms (${(time / size).toFixed(2)}ms per item)`)
        
        // Clear for next batch
        await brainy.clear()
      }
      
      await brainy.shutDown()
    })
  })

  describe('2. Index Storage Overhead', () => {
    it('should analyze storage requirements for metadata indexes', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      const testData = generateTestDataWithMetadata(1000)
      
      console.log('\n=== Storage Overhead Analysis ===')
      
      // Add data and measure index size
      for (const item of testData) {
        await brainy.addNoun(item.text, item.metadata)
      }
      
      // Get index statistics
      if (brainy.metadataIndex) {
        const stats = await brainy.metadataIndex.getStats()
        console.log(`Total index entries: ${stats.totalEntries}`)
        console.log(`Total indexed IDs: ${stats.totalIds}`)
        console.log(`Fields indexed: ${stats.fieldsIndexed.length}`)
        console.log(`Estimated index size: ${stats.indexSize} bytes`)
        console.log(`Fields: ${stats.fieldsIndexed.join(', ')}`)
        
        // Calculate overhead per item
        const overheadPerItem = stats.indexSize / 1000
        console.log(`Storage overhead per item: ${overheadPerItem.toFixed(2)} bytes`)
        
        // Estimate total storage efficiency
        const totalDataSize = 1000 * 200 // rough estimate of 200 bytes per item
        const storageEfficiency = (stats.indexSize / totalDataSize) * 100
        console.log(`Index storage overhead: ${storageEfficiency.toFixed(1)}% of data size`)
      }
      
      await brainy.shutDown()
    })
  })

  describe('3. Search Performance Comparison', () => {
    it('should compare filtered vs non-filtered search performance', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      // Add test data
      const testData = generateTestDataWithMetadata(1000)
      for (const item of testData) {
        await brainy.addNoun(item.text, item.metadata)
      }
      
      console.log('\n=== Search Performance Comparison ===')
      
      const searchQuery = 'Professional software development experience'
      const numSearches = 10
      
      // Test 1: No filtering
      const noFilterTimes: number[] = []
      for (let i = 0; i < numSearches; i++) {
        const { time } = await measureTime(async () => {
          return await brainy.search(searchQuery, 20)
        })
        noFilterTimes.push(time)
      }
      const avgNoFilter = noFilterTimes.reduce((a, b) => a + b) / numSearches
      console.log(`No filtering: ${avgNoFilter.toFixed(2)}ms average`)
      
      // Test 2: Simple metadata filtering (high selectivity)
      const simpleFilterTimes: number[] = []
      for (let i = 0; i < numSearches; i++) {
        const { time } = await measureTime(async () => {
          return await brainy.search(searchQuery, 20, {
            metadata: { department: 'Engineering' }
          })
        })
        simpleFilterTimes.push(time)
      }
      const avgSimpleFilter = simpleFilterTimes.reduce((a, b) => a + b) / numSearches
      console.log(`Simple filter (dept=Engineering): ${avgSimpleFilter.toFixed(2)}ms average`)
      
      // Test 3: Complex metadata filtering (low selectivity)
      const complexFilterTimes: number[] = []
      for (let i = 0; i < numSearches; i++) {
        const { time } = await measureTime(async () => {
          return await brainy.search(searchQuery, 20, {
            metadata: {
              department: { $in: ['Engineering', 'Marketing'] },
              level: { $in: ['senior', 'staff'] },
              salary: { $gte: 80000 },
              remote: true
            }
          })
        })
        complexFilterTimes.push(time)
      }
      const avgComplexFilter = complexFilterTimes.reduce((a, b) => a + b) / numSearches
      console.log(`Complex filter: ${avgComplexFilter.toFixed(2)}ms average`)
      
      // Test 4: Nested field filtering
      const nestedFilterTimes: number[] = []
      for (let i = 0; i < numSearches; i++) {
        const { time } = await measureTime(async () => {
          return await brainy.search(searchQuery, 20, {
            metadata: {
              'nested.profile.rating': { $gte: 4 },
              'nested.profile.verified': true
            }
          })
        })
        nestedFilterTimes.push(time)
      }
      const avgNestedFilter = nestedFilterTimes.reduce((a, b) => a + b) / numSearches
      console.log(`Nested filter: ${avgNestedFilter.toFixed(2)}ms average`)
      
      // Performance analysis
      console.log('\nPerformance Impact:')
      console.log(`Simple filter overhead: ${((avgSimpleFilter / avgNoFilter - 1) * 100).toFixed(1)}%`)
      console.log(`Complex filter overhead: ${((avgComplexFilter / avgNoFilter - 1) * 100).toFixed(1)}%`)
      console.log(`Nested filter overhead: ${((avgNestedFilter / avgNoFilter - 1) * 100).toFixed(1)}%`)
      
      await brainy.shutDown()
    })

    it('should test search performance with different ef multipliers', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        hnsw: { efSearch: 50 }, // Base ef for testing multiplier effect
        logging: { verbose: false }
      })
      await brainy.init()
      
      // Add test data
      const testData = generateTestDataWithMetadata(500)
      for (const item of testData) {
        await brainy.addNoun(item.text, item.metadata)
      }
      
      console.log('\n=== EF Multiplier Impact Analysis ===')
      
      const searchQuery = 'Professional software development experience'
      
      // Test with different selectivity filters
      const filters = [
        { name: 'High selectivity', filter: { department: 'Engineering' }, expected: '~17%' },
        { name: 'Medium selectivity', filter: { level: { $in: ['senior', 'staff'] } }, expected: '~40%' },
        { name: 'Low selectivity', filter: { active: true }, expected: '~80%' }
      ]
      
      for (const { name, filter, expected } of filters) {
        const { result, time } = await measureTime(async () => {
          return await brainy.search(searchQuery, 10, { metadata: filter })
        })
        
        console.log(`${name} (${expected}): ${time.toFixed(2)}ms, ${result.length} results`)
      }
      
      await brainy.shutDown()
    })
  })

  describe('4. Memory Usage Analysis', () => {
    it('should measure memory consumption of metadata indexes', async () => {
      if (!measureMemory()) {
        console.log('\nMemory measurement not available in this environment')
        return
      }
      
      console.log('\n=== Memory Usage Analysis ===')
      
      const initialMemory = measureMemory()!
      console.log(`Initial memory: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB`)
      
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      const afterInitMemory = measureMemory()!
      console.log(`After init: ${(afterInitMemory.used / 1024 / 1024).toFixed(2)}MB`)
      
      // Add data in batches and measure memory growth
      const batchSize = 100
      const numBatches = 5
      
      for (let batch = 1; batch <= numBatches; batch++) {
        const testData = generateTestDataWithMetadata(batchSize)
        
        for (const item of testData) {
          await brainy.add(item.text, item.metadata)
        }
        
        const currentMemory = measureMemory()!
        const totalItems = batch * batchSize
        console.log(`${totalItems} items: ${(currentMemory.used / 1024 / 1024).toFixed(2)}MB`)
      }
      
      // Get final index stats
      if (brainy.metadataIndex) {
        const stats = await brainy.metadataIndex.getStats()
        console.log(`Index entries: ${stats.totalEntries}, Memory per entry: ${((measureMemory()!.used - initialMemory.used) / stats.totalEntries).toFixed(2)} bytes`)
      }
      
      await brainy.shutDown()
    })
  })

  describe('5. Write Performance Impact', () => {
    it('should measure add/update/delete performance with indexing', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      console.log('\n=== Write Performance Analysis ===')
      
      // Test ADD performance
      const testData = generateTestDataWithMetadata(200)
      const { time: addTime } = await measureTime(async () => {
        for (const item of testData) {
          await brainy.add(item.text, item.metadata)
        }
      })
      console.log(`ADD: 200 items in ${addTime.toFixed(2)}ms (${(addTime / 200).toFixed(2)}ms per item)`)
      
      // Test UPDATE performance
      const updateData = testData.slice(0, 50).map((item, i) => ({
        ...item,
        metadata: {
          ...item.metadata,
          level: 'updated-level',
          salary: item.metadata.salary + 10000,
          updateCount: i
        }
      }))
      
      const { time: updateTime } = await measureTime(async () => {
        for (const item of updateData) {
          await brainy.updateMetadata(item.metadata.id, item.metadata)
        }
      })
      console.log(`UPDATE: 50 items in ${updateTime.toFixed(2)}ms (${(updateTime / 50).toFixed(2)}ms per item)`)
      
      // Test DELETE performance
      const idsToDelete = testData.slice(100, 150).map(item => item.metadata.id)
      const { time: deleteTime } = await measureTime(async () => {
        for (const id of idsToDelete) {
          await brainy.delete(id)
        }
      })
      console.log(`DELETE: 50 items in ${deleteTime.toFixed(2)}ms (${(deleteTime / 50).toFixed(2)}ms per item)`)
      
      // Verify index consistency
      if (brainy.metadataIndex) {
        const stats = await brainy.metadataIndex.getStats()
        console.log(`Final index state: ${stats.totalEntries} entries, ${stats.totalIds} IDs`)
        
        // Should have 150 items remaining (200 - 50 deleted)
        const expectedItems = 200 - 50
        const actualItems = await brainy.size()
        console.log(`Data consistency: ${actualItems}/${expectedItems} items remaining`)
      }
      
      await brainy.shutDown()
    })

    it('should test concurrent write performance', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { autoOptimize: true },
        logging: { verbose: false }
      })
      await brainy.init()
      
      console.log('\n=== Concurrent Write Performance ===')
      
      const testData = generateTestDataWithMetadata(100)
      
      // Sequential writes
      const { time: sequentialTime } = await measureTime(async () => {
        for (const item of testData) {
          await brainy.add(item.text, item.metadata)
        }
      })
      
      await brainy.clear()
      
      // Concurrent writes (batched)
      const batchSize = 20
      const { time: concurrentTime } = await measureTime(async () => {
        const promises: Promise<any>[] = []
        
        for (let i = 0; i < testData.length; i += batchSize) {
          const batch = testData.slice(i, i + batchSize)
          promises.push(
            Promise.all(batch.map(item => brainy.add(item.text, item.metadata)))
          )
        }
        
        await Promise.all(promises)
      })
      
      console.log(`Sequential: ${sequentialTime.toFixed(2)}ms`)
      console.log(`Concurrent (batched): ${concurrentTime.toFixed(2)}ms`)
      console.log(`Speedup: ${(sequentialTime / concurrentTime).toFixed(2)}x`)
      
      await brainy.shutDown()
    })
  })

  describe('6. Index Maintenance and Optimization', () => {
    it('should analyze index rebuild performance', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { 
          autoOptimize: true,
          rebuildThreshold: 0.1 
        },
        logging: { verbose: false }
      })
      await brainy.init()
      
      console.log('\n=== Index Maintenance Analysis ===')
      
      // Add initial data
      const testData = generateTestDataWithMetadata(300)
      for (const item of testData) {
        await brainy.addNoun(item.text, item.metadata)
      }
      
      // Measure manual rebuild
      if (brainy.metadataIndex) {
        const { time: rebuildTime } = await measureTime(async () => {
          await brainy.metadataIndex!.rebuild()
        })
        
        const stats = await brainy.metadataIndex.getStats()
        console.log(`Rebuild: ${rebuildTime.toFixed(2)}ms for ${stats.totalEntries} entries`)
        console.log(`Per entry: ${(rebuildTime / stats.totalEntries).toFixed(2)}ms`)
        
        // Test flush performance
        const { time: flushTime } = await measureTime(async () => {
          await brainy.metadataIndex!.flush()
        })
        console.log(`Flush: ${flushTime.toFixed(2)}ms`)
      }
      
      await brainy.shutDown()
    })

    it('should test index cache performance', async () => {
      const brainy = new BrainyData({
        storage: { forceMemoryStorage: true },
        metadataIndex: { 
          maxIndexSize: 1000,
          autoOptimize: true 
        },
        logging: { verbose: false }
      })
      await brainy.init()
      
      console.log('\n=== Index Cache Performance ===')
      
      // Add test data
      const testData = generateTestDataWithMetadata(200)
      for (const item of testData) {
        await brainy.addNoun(item.text, item.metadata)
      }
      
      if (!brainy.metadataIndex) return
      
      // Test cache hit performance (repeated queries)
      const filter = { department: 'Engineering' }
      
      // First query (cache miss)
      const { time: cacheMissTime } = await measureTime(async () => {
        return await brainy.metadataIndex!.getIdsForCriteria(filter)
      })
      
      // Subsequent queries (cache hits)
      const cacheHitTimes: number[] = []
      for (let i = 0; i < 10; i++) {
        const { time } = await measureTime(async () => {
          return await brainy.metadataIndex!.getIdsForCriteria(filter)
        })
        cacheHitTimes.push(time)
      }
      
      const avgCacheHit = cacheHitTimes.reduce((a, b) => a + b) / cacheHitTimes.length
      console.log(`Cache miss: ${cacheMissTime.toFixed(2)}ms`)
      console.log(`Cache hit (avg): ${avgCacheHit.toFixed(2)}ms`)
      console.log(`Cache speedup: ${(cacheMissTime / avgCacheHit).toFixed(2)}x`)
      
      await brainy.shutDown()
    })
  })
})