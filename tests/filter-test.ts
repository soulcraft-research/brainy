// Minimal test to debug metadata filtering
import { BrainyData } from '../dist/brainyData.js'

async function testDirectFiltering() {
  console.log('🧪 Testing direct filtering...')
  
  const brainy = new BrainyData({
    storage: { forceMemoryStorage: true },
    hnsw: { M: 4, efConstruction: 20, useOptimizedIndex: false }  // Force regular HNSW
  })
  
  await brainy.init()
  
  // Add two items
  const aliceId = await brainy.add('Senior developer Alice', { level: 'senior', name: 'Alice' })
  const bobId = await brainy.add('Junior developer Bob', { level: 'junior', name: 'Bob' })
  
  console.log('Alice ID:', aliceId)
  console.log('Bob ID:', bobId)
  
  // Test metadata index directly
  if (brainy.metadataIndex) {
    const seniorIds = await brainy.metadataIndex.getIds('level', 'senior')
    const juniorIds = await brainy.metadataIndex.getIds('level', 'junior')
    console.log('Senior IDs from index:', seniorIds)
    console.log('Junior IDs from index:', juniorIds)
  }
  
  // Test the HNSW search directly with a simple filter
  const queryVector = await brainy.embed('developer')
  console.log('Query vector dimensions:', queryVector.length)
  
  // Create a simple filter that only allows Alice
  const simpleFilter = async (id: string) => {
    console.log('🔍 Simple filter called for:', id, id === aliceId ? '✅ ALLOW' : '❌ BLOCK')
    return id === aliceId
  }
  
  console.log('Testing HNSW search with filter...')
  console.log('Index type:', brainy.index.constructor.name)
  console.log('Index has search method:', typeof brainy.index.search)
  console.log('Filter function:', typeof simpleFilter)
  console.log('About to call search with:', !!simpleFilter)
  const filteredResults = await brainy.index.search(queryVector, 10, simpleFilter)
  console.log('Filtered results:', filteredResults.length, 'items')
  
  for (const [id, score] of filteredResults) {
    console.log(`- ${id}: ${score.toFixed(3)} ${id === aliceId ? '(Alice)' : id === bobId ? '(Bob)' : '(Unknown)'}`)
  }
  
  const shouldWork = filteredResults.length === 1 && filteredResults[0][0] === aliceId
  console.log(shouldWork ? '✅ FILTERING WORKS!' : '❌ FILTERING FAILED!')
  
  return shouldWork
}

testDirectFiltering().catch(console.error)