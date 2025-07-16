import { describe, it, expect } from 'vitest'
import { euclideanDistance } from '../src/utils/distance.js'

describe('Vector Operations', () => {
  it('should load brainy library successfully', async () => {
    const brainy = await import('../dist/unified.js')

    expect(brainy).toBeDefined()
    expect(typeof brainy.BrainyData).toBe('function')
    expect(brainy.environment).toBeDefined()
  })

  it('should create and initialize BrainyData instance', async () => {
    const brainy = await import('../dist/unified.js')

    const db = new brainy.BrainyData({
      dimensions: 3,
      distanceFunction: euclideanDistance
    })

    expect(db).toBeDefined()
    expect(db.dimensions).toBe(3)

    await db.init()
    // If we get here without throwing, initialization was successful
    expect(true).toBe(true)
  })

  it('should handle simple 2D vector operations', async () => {
    const brainy = await import('../dist/unified.js')

    const db = new brainy.BrainyData({
      dimensions: 2,
      distanceFunction: euclideanDistance
    })

    await db.init()
    await db.clear() // Clear any existing data

    // Add a simple vector
    await db.add([1, 2], { id: 'test' })

    // Search for the same vector
    const results = await db.search([1, 2], 1)

    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].metadata.id).toBe('test')
  })

  it('should handle multiple vector searches correctly', async () => {
    const brainy = await import('../dist/unified.js')

    const db = new brainy.BrainyData({
      dimensions: 3,
      distanceFunction: euclideanDistance
    })

    await db.init()
    await db.clear() // Clear any existing data

    // Add multiple vectors
    await db.add([1, 0, 0], { id: 'vec1', type: 'unit' })
    await db.add([0, 1, 0], { id: 'vec2', type: 'unit' })
    await db.add([0, 0, 1], { id: 'vec3', type: 'unit' })
    await db.add([0.5, 0.5, 0], { id: 'vec4', type: 'mixed' })

    // Search for multiple results
    const results = await db.search([1, 0, 0], 3)

    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.length).toBeLessThanOrEqual(3)

    // The closest should be the exact match
    expect(results[0].metadata.id).toBe('vec1')
  })
})
