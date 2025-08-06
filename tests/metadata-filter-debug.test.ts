import { describe, it, expect } from 'vitest'
import { BrainyData } from '../src/brainyData.js'

describe('Metadata Filter Works', () => {
  it('should filter results by metadata during search', async () => {
    const brainy = new BrainyData({
      storage: { forceMemoryStorage: true },
      hnsw: { M: 4, efConstruction: 20 },
      logging: { verbose: false }
    })
    await brainy.init()
    
    // Add test data
    await brainy.add('Senior developer Alice works with React', { level: 'senior', skill: 'React' })
    await brainy.add('Junior developer Bob learns Vue', { level: 'junior', skill: 'Vue' })
    await brainy.add('Senior developer Charlie codes Python', { level: 'senior', skill: 'Python' })
    
    // Test 1: Search without filter (should return all 3)
    const allResults = await brainy.searchText('developer', 10)
    expect(allResults.length).toBe(3)
    
    // Test 2: Search with level filter (should return 2 senior developers)
    const seniorResults = await brainy.searchText('developer', 10, {
      metadata: { level: 'senior' }
    })
    expect(seniorResults.length).toBe(2)
    expect(seniorResults.every(r => r.metadata?.level === 'senior')).toBe(true)
    
    // Test 3: Search with skill filter (should return 1 React developer)
    const reactResults = await brainy.searchText('developer', 10, {
      metadata: { skill: 'React' }
    })
    expect(reactResults.length).toBe(1)
    expect(reactResults[0].metadata?.skill).toBe('React')
    
    // Test 4: Search with multiple filters (should return 1 senior React developer)
    const seniorReactResults = await brainy.searchText('developer', 10, {
      metadata: { 
        level: 'senior',
        skill: 'React'
      }
    })
    expect(seniorReactResults.length).toBe(1)
    expect(seniorReactResults[0].metadata?.level).toBe('senior')
    expect(seniorReactResults[0].metadata?.skill).toBe('React')
    
    // Test 5: Search with no matches (should return 0)
    const noResults = await brainy.searchText('developer', 10, {
      metadata: { level: 'expert' }
    })
    expect(noResults.length).toBe(0)
  })
  
  it('should work with searchWithinItems', async () => {
    const brainy = new BrainyData({
      storage: { forceMemoryStorage: true },
      hnsw: { M: 4, efConstruction: 20 },
      logging: { verbose: false }
    })
    await brainy.init()
    
    // Add test data
    const id1 = await brainy.add('Frontend React developer', { type: 'frontend', skill: 'React' })
    const id2 = await brainy.add('Backend Node developer', { type: 'backend', skill: 'Node' })
    const id3 = await brainy.add('Frontend Vue developer', { type: 'frontend', skill: 'Vue' })
    
    // Search within only frontend developers
    const frontendResults = await brainy.searchWithinItems('developer', [id1, id3], 10)
    
    expect(frontendResults.length).toBe(2)
    expect(frontendResults.every(r => [id1, id3].includes(r.id))).toBe(true)
  })
  
  it('should handle MongoDB-style operators', async () => {
    const brainy = new BrainyData({
      storage: { forceMemoryStorage: true },
      hnsw: { M: 4, efConstruction: 20 },
      logging: { verbose: false }
    })
    await brainy.init()
    
    // Add test data
    await brainy.add('Developer with 5 years experience', { experience: 5, skills: ['React', 'Node'] })
    await brainy.add('Developer with 2 years experience', { experience: 2, skills: ['Vue'] })
    await brainy.add('Developer with 8 years experience', { experience: 8, skills: ['React', 'Python'] })
    
    // Test $gt operator
    const experiencedResults = await brainy.searchText('developer', 10, {
      metadata: { experience: { $gt: 3 } }
    })
    expect(experiencedResults.length).toBe(2)
    expect(experiencedResults.every(r => (r.metadata?.experience as number) > 3)).toBe(true)
    
    // Test $in operator  
    const skillResults = await brainy.searchText('developer', 10, {
      metadata: { experience: { $in: [2, 8] } }
    })
    expect(skillResults.length).toBe(2)
    expect(skillResults.every(r => [2, 8].includes(r.metadata?.experience as number))).toBe(true)
  })
})