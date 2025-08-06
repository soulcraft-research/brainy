// Simple standalone test to check metadata filtering
import { BrainyData } from '../dist/brainyData.js'

async function testMetadataFiltering() {
  console.log('Creating BrainyData instance...')
  const brainy = new BrainyData({
    storage: { forceMemoryStorage: true },
    hnsw: { M: 4, efConstruction: 20 },
    logging: { verbose: true }
  })
  
  console.log('Initializing...')
  await brainy.init()
  
  console.log('Adding test data...')
  await brainy.add('Senior developer Alice', { level: 'senior', name: 'Alice' })
  await brainy.add('Junior developer Bob', { level: 'junior', name: 'Bob' })
  
  console.log('Searching without filter...')
  const allResults = await brainy.searchText('developer', 10)
  console.log('All results:', allResults.map(r => ({
    metadata: r.metadata,
    score: r.score.toFixed(3)
  })))
  
  // Check if metadata index is available
  console.log('Metadata index available?', !!brainy.metadataIndex)
  
  console.log('Searching with metadata filter...')
  const seniorResults = await brainy.searchText('developer', 10, {
    metadata: { level: 'senior' }
  })
  console.log('Senior results:', seniorResults.map(r => ({
    metadata: r.metadata,
    score: r.score.toFixed(3)
  })))
  
  if (brainy.metadataIndex) {
    console.log('Checking metadata index for level:senior...')
    const levelSeniorIds = await brainy.metadataIndex.getIds('level', 'senior')
    console.log('IDs with level=senior from index:', levelSeniorIds)
    
    const levelJuniorIds = await brainy.metadataIndex.getIds('level', 'junior')  
    console.log('IDs with level=junior from index:', levelJuniorIds)
  }
  
  console.log(`\nResults: All=${allResults.length}, Senior=${seniorResults.length}`)
  console.log('Filter working?', seniorResults.length < allResults.length)
}

testMetadataFiltering().catch(console.error)