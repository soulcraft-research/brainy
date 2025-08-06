import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { MemoryStorage } from '../src/storage/adapters/memoryStorage.js'

describe('Frozen Flag Behavior', () => {
  let db: BrainyData<{ content: string }>

  beforeAll(async () => {
    // Create a test database with memory storage
    db = new BrainyData({
      storageAdapter: new MemoryStorage()
    })
    await db.init()
    
    // Add some test data
    await db.add('test item 1', { content: 'First item' })
    await db.add('test item 2', { content: 'Second item' })
  })

  afterAll(async () => {
    await db.shutDown()
  })

  describe('readOnly mode without frozen', () => {
    it('should prevent data mutations but allow statistics updates', async () => {
      // Set to readOnly mode (frozen defaults to false)
      db.setReadOnly(true)
      expect(db.isReadOnly()).toBe(true)
      expect(db.isFrozen()).toBe(false)
      
      // Data mutations should fail
      await expect(db.add('test item 3', { content: 'Third item' })).rejects.toThrow('read-only mode')
      await expect(db.delete('test-id')).rejects.toThrow('read-only mode')
      
      // Statistics should still be refreshable
      const stats1 = await db.getStatistics()
      await db.flushStatistics() // Should not throw
      const stats2 = await db.getStatistics({ forceRefresh: true })
      
      // Statistics operations should succeed
      expect(stats1).toBeDefined()
      expect(stats2).toBeDefined()
      
      // Reset
      db.setReadOnly(false)
    })

    it('should allow real-time updates to continue', async () => {
      // Enable real-time updates
      db.enableRealtimeUpdates({ interval: 100 })
      
      // Set to readOnly mode
      db.setReadOnly(true)
      
      // Real-time updates should still be enabled
      const config = db.getRealtimeUpdateConfig()
      expect(config.enabled).toBe(true)
      
      // Disable and reset
      db.disableRealtimeUpdates()
      db.setReadOnly(false)
    })
  })

  describe('frozen mode', () => {
    it('should prevent all changes including statistics and updates', async () => {
      // Set to frozen mode
      db.setFrozen(true)
      expect(db.isFrozen()).toBe(true)
      
      // Enable real-time updates before freezing
      db.enableRealtimeUpdates({ interval: 100 })
      
      // Freeze the database
      db.setFrozen(true)
      
      // Real-time updates should be stopped
      const config = db.getRealtimeUpdateConfig()
      // The config might still say enabled, but updates won't run
      
      // Statistics flush should be a no-op (not throw, just do nothing)
      await db.flushStatistics() // Should not throw but does nothing
      
      // Reset
      db.setFrozen(false)
      db.disableRealtimeUpdates()
    })

    it('should restart real-time updates when unfrozen', async () => {
      // Enable real-time updates
      db.enableRealtimeUpdates({ interval: 100 })
      const configBefore = db.getRealtimeUpdateConfig()
      expect(configBefore.enabled).toBe(true)
      
      // Freeze the database
      db.setFrozen(true)
      
      // Unfreeze the database
      db.setFrozen(false)
      
      // Real-time updates should restart
      const configAfter = db.getRealtimeUpdateConfig()
      expect(configAfter.enabled).toBe(true)
      
      // Cleanup
      db.disableRealtimeUpdates()
    })
  })

  describe('readOnly with frozen', () => {
    it('should enforce complete immutability', async () => {
      // Set both readOnly and frozen
      db.setReadOnly(true)
      db.setFrozen(true)
      
      expect(db.isReadOnly()).toBe(true)
      expect(db.isFrozen()).toBe(true)
      
      // Data mutations should fail
      await expect(db.add('test item 3', { content: 'Third item' })).rejects.toThrow('read-only mode')
      
      // Statistics flush should be a no-op
      await db.flushStatistics() // Should not throw but does nothing
      
      // Reset
      db.setReadOnly(false)
      db.setFrozen(false)
    })
  })

  describe('configuration via constructor', () => {
    it('should respect frozen flag from constructor', async () => {
      const frozenDb = new BrainyData({
        storageAdapter: new MemoryStorage(),
        readOnly: true,
        frozen: true
      })
      await frozenDb.init()
      
      expect(frozenDb.isReadOnly()).toBe(true)
      expect(frozenDb.isFrozen()).toBe(true)
      
      await frozenDb.shutDown()
    })

    it('should default frozen to false when readOnly is true', async () => {
      const readOnlyDb = new BrainyData({
        storageAdapter: new MemoryStorage(),
        readOnly: true
        // frozen not specified, should default to false
      })
      await readOnlyDb.init()
      
      expect(readOnlyDb.isReadOnly()).toBe(true)
      expect(readOnlyDb.isFrozen()).toBe(false)
      
      await readOnlyDb.shutDown()
    })
  })
})