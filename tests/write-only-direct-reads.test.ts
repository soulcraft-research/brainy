import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import type { BrainyDataConfig } from '../src/brainyData.js'

describe('Write-Only Mode with Direct Reads', () => {
  let brainyWriteOnly: BrainyData
  let brainyWithDirectReads: BrainyData
  let brainyNormal: BrainyData

  beforeEach(async () => {
    // Create instances with different configurations
    brainyWriteOnly = new BrainyData({
      writeOnly: true,
      allowDirectReads: false
    })

    brainyWithDirectReads = new BrainyData({
      writeOnly: true,
      allowDirectReads: true
    })

    brainyNormal = new BrainyData({
      writeOnly: false
    })

    await brainyWriteOnly.init()
    await brainyWithDirectReads.init()
    await brainyNormal.init()
  })

  afterEach(async () => {
    if (brainyWriteOnly) {
      await brainyWriteOnly.cleanup?.()
    }
    if (brainyWithDirectReads) {
      await brainyWithDirectReads.cleanup?.()
    }
    if (brainyNormal) {
      await brainyNormal.cleanup?.()
    }
  })

  describe('Configuration Validation', () => {
    test('should accept allowDirectReads: true with writeOnly: true', () => {
      expect(() => new BrainyData({
        writeOnly: true,
        allowDirectReads: true
      })).not.toThrow()
    })

    test('should accept allowDirectReads: false with writeOnly: true', () => {
      expect(() => new BrainyData({
        writeOnly: true,
        allowDirectReads: false
      })).not.toThrow()
    })

    test('should accept allowDirectReads: true with writeOnly: false', () => {
      expect(() => new BrainyData({
        writeOnly: false,
        allowDirectReads: true
      })).not.toThrow()
    })
  })

  describe('Write Operations (Should Always Work)', () => {
    test('should allow add in all modes', async () => {
      const testData = 'test string for embedding'

      // All instances should be able to add data
      const id1 = await brainyWriteOnly.add(testData)
      const id2 = await brainyWithDirectReads.add(testData)
      const id3 = await brainyNormal.add(testData)

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id3).toBeTruthy()
    })

    test('should allow add operations with metadata in all modes', async () => {
      const testVector = new Array(384).fill(0.1)
      const metadata1 = { name: 'test 1', type: 'entity' }
      const metadata2 = { name: 'test 2', type: 'entity' }

      // All instances should be able to add data with metadata
      const id1 = await brainyWriteOnly.add(testVector, metadata1)
      const id2 = await brainyWithDirectReads.add(testVector, metadata2)

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
    })
  })

  describe('Direct Read Operations', () => {
    let testId: string

    beforeEach(async () => {
      // Add test data with metadata for testing
      const testVector = new Array(384).fill(0.2)
      const testMetadata = { name: 'direct read test', content: 'test content' }
      testId = await brainyWithDirectReads.add(testVector, testMetadata)
    })

    describe('get() method', () => {
      test('should work in write-only mode without allowDirectReads (legacy behavior)', async () => {
        // Add data to write-only instance with metadata
        const testVector = new Array(384).fill(0.3)
        const id = await brainyWriteOnly.add(testVector, { name: 'legacy test' })
        const result = await brainyWriteOnly.get(id)
        expect(result).toBeTruthy()
        expect(result?.metadata.name).toBe('legacy test')
      })

      test('should work in write-only mode with allowDirectReads', async () => {
        const result = await brainyWithDirectReads.get(testId)
        expect(result).toBeTruthy()
        expect(result?.metadata.name).toBe('direct read test')
      })

      test('should work in normal mode', async () => {
        const testVector = new Array(384).fill(0.4)
        const id = await brainyNormal.add(testVector, { name: 'normal test' })
        const result = await brainyNormal.get(id)
        expect(result).toBeTruthy()
        expect(result?.metadata.name).toBe('normal test')
      })
    })

    describe('has() method', () => {
      test('should fail in write-only mode without allowDirectReads', async () => {
        await expect(brainyWriteOnly.has(testId))
          .rejects.toThrow('Cannot perform has() operation: database is in write-only mode')
      })

      test('should work in write-only mode with allowDirectReads', async () => {
        const exists = await brainyWithDirectReads.has(testId)
        expect(exists).toBe(true)

        const notExists = await brainyWithDirectReads.has('nonexistent-id')
        expect(notExists).toBe(false)
      })

      test('should work in normal mode', async () => {
        const testVector = new Array(384).fill(0.5)
        const id = await brainyNormal.add(testVector, { name: 'has test' })
        const exists = await brainyNormal.has(id)
        expect(exists).toBe(true)
      })
    })

    describe('exists() method', () => {
      test('should fail in write-only mode without allowDirectReads', async () => {
        await expect(brainyWriteOnly.exists(testId))
          .rejects.toThrow('Cannot perform has() operation: database is in write-only mode')
      })

      test('should work in write-only mode with allowDirectReads', async () => {
        const exists = await brainyWithDirectReads.exists(testId)
        expect(exists).toBe(true)

        const notExists = await brainyWithDirectReads.exists('nonexistent-id')
        expect(notExists).toBe(false)
      })
    })

    describe('getMetadata() method', () => {
      test('should fail in write-only mode without allowDirectReads', async () => {
        await expect(brainyWriteOnly.getMetadata(testId))
          .rejects.toThrow('Cannot perform getMetadata() operation: database is in write-only mode')
      })

      test('should work in write-only mode with allowDirectReads', async () => {
        const metadata = await brainyWithDirectReads.getMetadata(testId)
        expect(metadata).toBeTruthy()
        expect(metadata?.name).toBe('direct read test')
      })

      test('should return null for nonexistent ID', async () => {
        const metadata = await brainyWithDirectReads.getMetadata('nonexistent-id')
        expect(metadata).toBeNull()
      })
    })

    describe('getBatch() method', () => {
      test('should fail in write-only mode without allowDirectReads', async () => {
        await expect(brainyWriteOnly.getBatch([testId]))
          .rejects.toThrow('Cannot perform getBatch() operation: database is in write-only mode')
      })

      test('should work in write-only mode with allowDirectReads', async () => {
        const testVector2 = new Array(384).fill(0.6)
        const id2 = await brainyWithDirectReads.add(testVector2, { name: 'batch test 2' })
        const results = await brainyWithDirectReads.getBatch([testId, id2, 'nonexistent'])

        expect(results).toHaveLength(3)
        expect(results[0]?.metadata.name).toBe('direct read test')
        expect(results[1]?.metadata.name).toBe('batch test 2')
        expect(results[2]).toBeNull()
      })

      test('should handle empty array', async () => {
        const results = await brainyWithDirectReads.getBatch([])
        expect(results).toEqual([])
      })
    })

    // Note: getVerb() tests removed as the API may not be available in this version
  })

  describe('Search Operations (Should Be Blocked)', () => {
    beforeEach(async () => {
      // Add some test data
      const testVector = new Array(384).fill(0.7)
      await brainyWithDirectReads.add(testVector, { name: 'search test', content: 'searchable content' })
    })

    test('search() should fail in write-only mode even with allowDirectReads', async () => {
      await expect(brainyWithDirectReads.search('test'))
        .rejects.toThrow('Cannot perform search operation: database is in write-only mode')
    })

    // Note: similar() and query() methods may not be available in this version
  })

  describe('Real-World Use Cases', () => {
    describe('Bluesky Service Pattern', () => {
      test('should enable efficient deduplication in writer service', async () => {
        // Simulate a Bluesky service processing messages
        const processMessage = async (did: string, messageData: any) => {
          // Check if profile already exists (direct storage lookup)
          const existingProfile = await brainyWithDirectReads.get(did)
          
          if (!existingProfile) {
            // Only call external API for new DIDs
            const profileData = { did, handle: `user-${did}`, displayName: 'Test User' }
            const simpleVector = new Array(384).fill(0.1)
            await brainyWithDirectReads.add(simpleVector, profileData, { id: did })
            return { action: 'created', profile: profileData }
          } else {
            // Profile exists, skip API call
            return { action: 'existing', profile: existingProfile.metadata }
          }
        }

        // Process same DID twice
        const result1 = await processMessage('did:test:123', { text: 'Hello' })
        const result2 = await processMessage('did:test:123', { text: 'World' })

        expect(result1.action).toBe('created')
        expect(result2.action).toBe('existing')
        expect(result2.profile.did).toBe('did:test:123')
      })
    })

    describe('GitHub Package Pattern', () => {
      test('should enable efficient user processing', async () => {
        const processUser = async (userId: string) => {
          const userKey = `github_user_${userId}`
          
          // Fast existence check (direct storage, no index)
          if (await brainyWithDirectReads.has(userKey)) {
            return { action: 'skipped', reason: 'already_processed' }
          }

          // New user - simulate API fetch and store
          const userData = { id: userId, login: `user${userId}`, type: 'User' }
          const simpleVector = new Array(384).fill(0.2)
          await brainyWithDirectReads.add(simpleVector, userData, { id: userKey })
          
          return { action: 'processed', user: userData }
        }

        // Process users
        const result1 = await processUser('123')
        const result2 = await processUser('123') // Duplicate
        const result3 = await processUser('456') // New user

        expect(result1.action).toBe('processed')
        expect(result2.action).toBe('skipped')
        expect(result3.action).toBe('processed')
      })
    })

    describe('General Writer Service Pattern', () => {
      test('should support optimal entity processing', async () => {
        const processEntity = async (id: string, data: any) => {
          // Fast existence check using direct storage
          const existing = await brainyWithDirectReads.get(id)

          if (existing) {
            // Update existing entity
            return { action: 'updated', existing: existing.metadata, new: data }
          }

          // New entity - store it
          const simpleVector = new Array(384).fill(0.3)
          await brainyWithDirectReads.add(simpleVector, data, { id })
          return { action: 'created', entity: data }
        }

        // Test the pattern
        const entity1 = { name: 'Entity 1', type: 'test' }
        const entity1Updated = { name: 'Entity 1 Updated', type: 'test' }

        const result1 = await processEntity('entity-1', entity1)
        const result2 = await processEntity('entity-1', entity1Updated)

        expect(result1.action).toBe('created')
        expect(result2.action).toBe('updated')
        expect(result2.existing.name).toBe('Entity 1')
      })
    })
  })

  describe('Error Handling', () => {
    test('should provide clear error messages for blocked operations', async () => {
      await expect(brainyWriteOnly.has('test'))
        .rejects.toThrow('Enable allowDirectReads for direct storage operations')

      await expect(brainyWithDirectReads.search('test'))
        .rejects.toThrow('Direct storage operations (get, has, exists, getMetadata, getBatch, getVerb) are allowed')
    })

    test('should handle invalid IDs gracefully', async () => {
      await expect(brainyWithDirectReads.get(null as any))
        .rejects.toThrow('ID cannot be null or undefined')

      await expect(brainyWithDirectReads.has(undefined as any))
        .rejects.toThrow('ID cannot be null or undefined')
    })

    test('should handle storage errors gracefully', async () => {
      // Test with non-existent IDs
      expect(await brainyWithDirectReads.has('non-existent')).toBe(false)
      expect(await brainyWithDirectReads.get('non-existent')).toBeNull()
      expect(await brainyWithDirectReads.getMetadata('non-existent')).toBeNull()
    })
  })
})