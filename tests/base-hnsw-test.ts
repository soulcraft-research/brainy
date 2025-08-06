// Test using base HNSW directly
import { HNSWIndex } from '../dist/hnsw/hnswIndex.js'
import { euclideanDistance } from '../dist/utils/distance.js'

async function testBaseHNSW() {
  console.log('🧪 Testing base HNSW directly...')
  
  const index = new HNSWIndex(
    { M: 4, efConstruction: 20, efSearch: 50 },
    euclideanDistance
  )
  
  // Create test vectors
  const aliceVector = Array.from({length: 384}, () => Math.random())
  const bobVector = Array.from({length: 384}, () => Math.random())
  const queryVector = Array.from({length: 384}, () => Math.random())
  
  // Add items to index
  const aliceId = 'alice-123'
  const bobId = 'bob-456'
  
  await index.addItem({ id: aliceId, vector: aliceVector })
  await index.addItem({ id: bobId, vector: bobVector })
  
  console.log('Added items to index')
  
  // Test without filter
  const allResults = await index.search(queryVector, 10)
  console.log('All results:', allResults.length)
  
  // Test with filter - only allow Alice
  const aliceOnlyFilter = async (id: string) => {
    console.log('🔍 Filter called for:', id, id === aliceId ? '✅ ALLOW' : '❌ BLOCK')
    return id === aliceId
  }
  
  console.log('Testing with filter...')
  const filteredResults = await index.search(queryVector, 10, aliceOnlyFilter)
  console.log('Filtered results:', filteredResults.length)
  
  const shouldWork = filteredResults.length === 1 && filteredResults[0][0] === aliceId
  console.log(shouldWork ? '✅ FILTERING WORKS!' : '❌ FILTERING FAILED!')
  
  return shouldWork
}

testBaseHNSW().catch(console.error)