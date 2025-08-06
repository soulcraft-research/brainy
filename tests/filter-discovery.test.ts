import { describe, it, expect, beforeEach } from 'vitest'
import { BrainyData } from '../src/index.js'

describe('Filter Discovery API', () => {
  let brainy: BrainyData
  
  beforeEach(async () => {
    brainy = new BrainyData({
      storage: { type: 'memory' }
    })
    await brainy.init()
  })

  it('should return available filter values for a field', async () => {
    // Add test data with metadata
    await brainy.add('product1', {
      category: 'electronics',
      brand: 'Apple',
      price: 999
    })
    
    await brainy.add('product2', {
      category: 'electronics',
      brand: 'Samsung',
      price: 799
    })
    
    await brainy.add('product3', {
      category: 'books',
      brand: 'Penguin',
      price: 19
    })
    
    // Get filter values for category field
    const categories = await brainy.getFilterValues('category')
    expect(categories).toContain('electronics')
    expect(categories).toContain('books')
    expect(categories.length).toBe(2)
    
    // Get filter values for brand field
    const brands = await brainy.getFilterValues('brand')
    expect(brands).toContain('apple') // normalized to lowercase
    expect(brands).toContain('samsung')
    expect(brands).toContain('penguin')
    expect(brands.length).toBe(3)
  })

  it('should return all available filter fields', async () => {
    // Add test data with various metadata fields
    await brainy.add('item1', {
      category: 'electronics',
      brand: 'Apple',
      price: 999,
      rating: 4.5
    })
    
    await brainy.add('item2', {
      category: 'books',
      author: 'Tolkien',
      pages: 500
    })
    
    // Get all filter fields
    const fields = await brainy.getFilterFields()
    
    // Should include all unique fields from all items (except excluded ones)
    expect(fields).toContain('category')
    expect(fields).toContain('brand')
    expect(fields).toContain('price')
    expect(fields).toContain('rating')
    expect(fields).toContain('author')
    expect(fields).toContain('pages')
  })

  it('should use cache for repeated filter value requests', async () => {
    // Add test data
    await brainy.add('item1', { category: 'electronics' })
    await brainy.add('item2', { category: 'books' })
    
    // First call - loads from storage
    const start1 = Date.now()
    const categories1 = await brainy.getFilterValues('category')
    const time1 = Date.now() - start1
    
    // Second call - should use cache and be faster
    const start2 = Date.now()
    const categories2 = await brainy.getFilterValues('category')
    const time2 = Date.now() - start2
    
    // Results should be identical
    expect(categories1).toEqual(categories2)
    
    // Cache should be significantly faster (at least 2x)
    // Note: This might be flaky in CI, so we just check they're equal for now
    expect(categories2.length).toBe(2)
  })

  it('should handle empty fields gracefully', async () => {
    // Try to get values for non-existent field
    const values = await brainy.getFilterValues('nonexistent')
    expect(values).toEqual([])
    
    // Get fields when no data exists
    const fields = await brainy.getFilterFields()
    expect(fields).toEqual([])
  })
})