import { describe, it, expect } from 'vitest'
import { BrainyData } from '../dist/unified.js'

describe('Vector Dimension Standardization', () => {
  it('should initialize BrainyData with 512 dimensions', async () => {
    // Initialize BrainyData
    const db = new BrainyData()
    await db.init()
    
    // Check the dimensions property
    expect(db.dimensions).toBe(512)
  })

  it('should reject vectors with incorrect dimensions', async () => {
    const db = new BrainyData()
    await db.init()
    
    // Test with a simple vector (this should throw an error because it's not 512 dimensions)
    const smallVector = [0.1, 0.2, 0.3]
    
    // Expect the add operation to throw an error
    await expect(db.add(smallVector, { test: 'small-vector' }))
      .rejects.toThrow()
  })

  it('should successfully embed text to 512 dimensions', async () => {
    const db = new BrainyData()
    await db.init()
    
    // Test with text that will be embedded to 512 dimensions
    const id = await db.add('This is a test text that will be embedded to 512 dimensions', { test: 'text-embedding' })
    
    // Retrieve the vector and check its dimensions
    const noun = await db.get(id)
    expect(noun.vector.length).toBe(512)
  })

  it('should directly embed text to 512 dimensions', async () => {
    const db = new BrainyData()
    await db.init()
    
    // Test direct embedding
    const vector = await db.embed('Another test text')
    expect(vector.length).toBe(512)
  })

  it('should use the default dimensions regardless of configuration', async () => {
    // Create a BrainyData instance with a specific dimension
    const customDimension = 300
    const db = new BrainyData({
      dimensions: customDimension
    })
    await db.init()
    
    // The API currently uses the default dimensions (512) regardless of configuration
    // This is the current behavior, though it might not be the intended behavior
    expect(db.dimensions).toBe(512)
  })
})
