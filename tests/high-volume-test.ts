/**
 * High-volume test to verify automatic adaptation under load
 */

import { BrainyData } from '../src/index.js'
import { getGlobalPerformanceMonitor } from '../src/utils/performanceMonitor.js'

async function testHighVolume() {
  console.log('Starting high-volume test with automatic adaptation...')
  
  // Create a Brainy instance with S3 storage (configure as needed)
  const brainy = new BrainyData({
    dimensions: 384,
    storage: { type: 'memory' }  // Use memory for testing
  })
  
  const monitor = getGlobalPerformanceMonitor()
  
  // Generate test data
  const numItems = 1000
  const batchSize = 50
  
  console.log(`Testing with ${numItems} items in batches of ${batchSize}`)
  
  // Add items in batches
  for (let i = 0; i < numItems; i += batchSize) {
    const batch = []
    for (let j = 0; j < batchSize && i + j < numItems; j++) {
      const vector = new Array(384).fill(0).map(() => Math.random())
      batch.push({
        key: `item-${i + j}`,
        data: { 
          content: `Test item ${i + j}`,
          timestamp: Date.now()
        },
        metadata: {
          batch: Math.floor(i / batchSize),
          index: i + j
        },
        vector
      })
    }
    
    // Add batch
    const startTime = Date.now()
    try {
      await brainy.addBatch(batch)
      const latency = Date.now() - startTime
      
      // Track performance
      monitor.trackOperation(true, latency, JSON.stringify(batch).length)
      
      if (i % 200 === 0) {
        const report = monitor.getReport()
        console.log(`Progress: ${i}/${numItems}`)
        console.log(`  Health Score: ${report.metrics.healthScore.toFixed(0)}`)
        console.log(`  Ops/sec: ${report.metrics.operationsPerSecond.toFixed(1)}`)
        console.log(`  Avg Latency: ${report.metrics.averageLatency.toFixed(0)}ms`)
        console.log(`  Socket Config:`, report.socketConfig)
        console.log(`  Backpressure:`, report.backpressureStatus)
        
        if (report.recommendations.length > 0) {
          console.log(`  Recommendations:`, report.recommendations)
        }
      }
    } catch (error) {
      const latency = Date.now() - startTime
      monitor.trackOperation(false, latency, 0)
      console.error(`Failed to add batch at ${i}:`, error)
    }
  }
  
  // Final report
  const finalReport = monitor.getReport()
  console.log('\n=== Final Performance Report ===')
  console.log('Metrics:', finalReport.metrics)
  console.log('Trends:', finalReport.trends)
  console.log('Socket Configuration:', finalReport.socketConfig)
  console.log('Backpressure Status:', finalReport.backpressureStatus)
  
  if (finalReport.recommendations.length > 0) {
    console.log('Recommendations:', finalReport.recommendations)
  }
  
  console.log('\nTest completed successfully!')
}

// Run the test
testHighVolume().catch(console.error)