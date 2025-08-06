#!/usr/bin/env node

/**
 * Metadata Performance Analysis Script
 * Quick performance analysis of metadata filtering system without full test suite
 */

import { BrainyData } from '../dist/brainyData.js'

const measureTime = async (fn) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return { result, time: end - start }
}

const generateTestData = (count) => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR']
  const levels = ['junior', 'senior', 'staff', 'principal']
  const locations = ['SF', 'NYC', 'LA', 'Seattle']

  return Array.from({ length: count }, (_, i) => ({
    text: `Profile ${i}: Professional with experience in software development`,
    metadata: {
      id: `profile-${i}`,
      department: departments[i % departments.length],
      level: levels[i % levels.length],
      location: locations[i % locations.length],
      salary: 50000 + (i % 10) * 10000,
      remote: i % 3 === 0,
      active: i % 5 !== 0
    }
  }))
}

async function analyzePerformance() {
  console.log('=== Metadata Performance Analysis ===\n')
  
  // Test 1: Initialization with vs without metadata indexing
  console.log('1. INITIALIZATION COMPARISON')
  
  const testData = generateTestData(100)
  
  // Without indexing
  const withoutIndex = await measureTime(async () => {
    const brainy = new BrainyData({
      storage: { forceMemoryStorage: true },
      logging: { verbose: false }
    })
    await brainy.init()
    
    for (const item of testData) {
      await brainy.add(item.text, item.metadata)
    }
    
    return brainy
  })
  
  console.log(`WITHOUT indexing: ${withoutIndex.time.toFixed(2)}ms for 100 items`)
  
  // With indexing
  const withIndex = await measureTime(async () => {
    const brainy = new BrainyData({
      storage: { forceMemoryStorage: true },
      logging: { verbose: false },
      metadataIndex: { autoOptimize: true }
    })
    await brainy.init()
    
    for (const item of testData) {
      await brainy.add(item.text, item.metadata)
    }
    
    return brainy
  })
  
  console.log(`WITH indexing: ${withIndex.time.toFixed(2)}ms for 100 items`)
  const overhead = ((withIndex.time - withoutIndex.time) / withoutIndex.time) * 100
  console.log(`Index overhead: ${overhead.toFixed(1)}%\n`)
  
  // Test 2: Search Performance Comparison
  console.log('2. SEARCH PERFORMANCE COMPARISON')
  
  const brainy = withIndex.result
  const searchQuery = 'Professional software development'
  const numSearches = 5
  
  // No filtering
  let totalNoFilter = 0
  for (let i = 0; i < numSearches; i++) {
    const { time } = await measureTime(async () => {
      return await brainy.search(searchQuery, 10)
    })
    totalNoFilter += time
  }
  const avgNoFilter = totalNoFilter / numSearches
  console.log(`No filtering: ${avgNoFilter.toFixed(2)}ms average`)
  
  // Simple filtering
  let totalSimpleFilter = 0
  for (let i = 0; i < numSearches; i++) {
    const { time } = await measureTime(async () => {
      return await brainy.search(searchQuery, 10, {
        metadata: { department: 'Engineering' }
      })
    })
    totalSimpleFilter += time
  }
  const avgSimpleFilter = totalSimpleFilter / numSearches
  console.log(`Simple filter: ${avgSimpleFilter.toFixed(2)}ms average`)
  
  // Complex filtering
  let totalComplexFilter = 0
  for (let i = 0; i < numSearches; i++) {
    const { time } = await measureTime(async () => {
      return await brainy.search(searchQuery, 10, {
        metadata: {
          department: { $in: ['Engineering', 'Marketing'] },
          level: { $in: ['senior', 'staff'] },
          salary: { $gte: 80000 }
        }
      })
    })
    totalComplexFilter += time
  }
  const avgComplexFilter = totalComplexFilter / numSearches
  console.log(`Complex filter: ${avgComplexFilter.toFixed(2)}ms average`)
  
  console.log('\nSearch Performance Impact:')
  console.log(`Simple filter overhead: ${((avgSimpleFilter / avgNoFilter - 1) * 100).toFixed(1)}%`)
  console.log(`Complex filter overhead: ${((avgComplexFilter / avgNoFilter - 1) * 100).toFixed(1)}%\n`)
  
  // Test 3: Index Statistics
  console.log('3. INDEX STATISTICS')
  
  if (brainy.metadataIndex) {
    const stats = await brainy.metadataIndex.getStats()
    console.log(`Total index entries: ${stats.totalEntries}`)
    console.log(`Total indexed IDs: ${stats.totalIds}`)
    console.log(`Fields indexed: ${stats.fieldsIndexed.join(', ')}`)
    console.log(`Estimated index size: ${stats.indexSize} bytes`)
    console.log(`Storage overhead per item: ${(stats.indexSize / 100).toFixed(2)} bytes\n`)
  }
  
  // Test 4: Write Performance
  console.log('4. WRITE PERFORMANCE ANALYSIS')
  
  const newTestData = generateTestData(50)
  
  // Add performance
  const { time: addTime } = await measureTime(async () => {
    for (const item of newTestData) {
      await brainy.add(item.text, item.metadata)
    }
  })
  console.log(`ADD: 50 items in ${addTime.toFixed(2)}ms (${(addTime / 50).toFixed(2)}ms per item)`)
  
  // Update performance
  const updateData = newTestData.slice(0, 20).map(item => ({
    ...item,
    metadata: { ...item.metadata, level: 'updated', salary: item.metadata.salary + 10000 }
  }))
  
  const { time: updateTime } = await measureTime(async () => {
    for (const item of updateData) {
      await brainy.updateMetadata(item.metadata.id, item.metadata)
    }
  })
  console.log(`UPDATE: 20 items in ${updateTime.toFixed(2)}ms (${(updateTime / 20).toFixed(2)}ms per item)`)
  
  // Delete performance
  const idsToDelete = newTestData.slice(30, 40).map(item => item.metadata.id)
  const { time: deleteTime } = await measureTime(async () => {
    for (const id of idsToDelete) {
      await brainy.delete(id)
    }
  })
  console.log(`DELETE: 10 items in ${deleteTime.toFixed(2)}ms (${(deleteTime / 10).toFixed(2)}ms per item)\n`)
  
  // Cleanup
  await withoutIndex.result.shutDown()
  await withIndex.result.shutDown()
  
  console.log('Analysis complete!')
}

analyzePerformance().catch(console.error)