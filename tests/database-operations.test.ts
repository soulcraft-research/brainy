import { describe, it, expect } from 'vitest'
import { BrainyData } from '../dist/unified.js'

describe('Database Operations', () => {
  let db: BrainyData
  
  beforeEach(async () => {
    db = new BrainyData()
    await db.init()
  })
  
  it('should initialize and return database status', async () => {
    const status = await db.status()
    expect(status).toBeDefined()
    // The structure of status might vary, just check it exists
  })
  
  it('should return statistics', async () => {
    const stats = await db.getStatistics()
    expect(stats).toBeDefined()
    // The structure of stats might vary, just check it exists
  })
  
  it('should retrieve all nouns', async () => {
    const nouns = await db.getAllNouns()
    expect(Array.isArray(nouns)).toBe(true)
  })
  
  it('should retrieve all verbs', async () => {
    const verbs = await db.getAllVerbs()
    expect(Array.isArray(verbs)).toBe(true)
  })
  
  it('should perform a search operation', async () => {
    const searchResults = await db.searchText('test', 10)
    expect(Array.isArray(searchResults)).toBe(true)
  })
  
  it('should add and retrieve an item', async () => {
    // Add a test item
    const testText = 'This is a test item for searching'
    const metadata = { noun: 'Thing', category: 'test' }
    const id = await db.add(testText, metadata)
    
    // Verify the item was added
    expect(id).toBeDefined()
    
    // Retrieve the item
    const noun = await db.get(id)
    expect(noun).toBeDefined()
    expect(noun.id).toBe(id)
    
    // Check that the metadata contains our properties
    // (The system might add additional properties)
    expect(noun.metadata.category).toBe('test')
    
    // Search for the item
    const searchResults = await db.searchText('test', 10)
    expect(searchResults.length).toBeGreaterThan(0)
    
    // Clean up
    await db.delete(id)
  })
})
