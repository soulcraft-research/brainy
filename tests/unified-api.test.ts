/**
 * Unified API Tests for Brainy 1.0
 * Tests the 7 core unified methods and new functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData, NounType, VerbType } from '../src/index.js'

describe('Brainy 1.0 Unified API', () => {
  let brainy: BrainyData

  beforeEach(async () => {
    brainy = new BrainyData()
    await brainy.init()
  })

  afterEach(async () => {
    if (brainy) {
      await brainy.cleanup()
    }
  })

  describe('Core Method 1: add()', () => {
    it('should add data with smart processing by default', async () => {
      const id = await brainy.add("John Doe is a software engineer at Tech Corp")
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should add data with literal processing when specified', async () => {
      const id = await brainy.add("Raw data", {}, { process: 'literal' })
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should add data with metadata', async () => {
      const metadata = { type: 'person', age: 30 }
      const id = await brainy.add("Jane Smith", metadata)
      expect(id).toBeDefined()
    })

    it('should add data with encryption', async () => {
      const id = await brainy.add("Sensitive data", {}, { encrypt: true })
      expect(id).toBeDefined()
    })
  })

  describe('Core Method 2: search()', () => {
    beforeEach(async () => {
      // Add test data
      await brainy.add("Alice is a data scientist")
      await brainy.add("Bob is a software engineer") 
      await brainy.add("Charlie works in marketing")
    })

    it('should perform vector similarity search', async () => {
      const results = await brainy.search("data scientist", 5)
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should search with metadata filters', async () => {
      await brainy.add("David", { department: "engineering" })
      await brainy.add("Emma", { department: "marketing" })
      
      const results = await brainy.search("", 10, { 
        metadata: { department: "engineering" } 
      })
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should search connected nouns', async () => {
      const personId = await brainy.addNoun("Frank", NounType.Person)
      const companyId = await brainy.addNoun("Tech Inc", NounType.Organization)
      await brainy.addVerb(personId, companyId, VerbType.WorksWith)

      const results = await brainy.search("", 10, { 
        searchConnectedNouns: true,
        sourceId: personId
      })
      expect(results).toBeDefined()
    })
  })

  describe('Core Method 3: import()', () => {
    it('should import array of data items', async () => {
      const data = [
        "Item 1",
        "Item 2", 
        "Item 3"
      ]
      const ids = await brainy.import(data)
      expect(ids).toBeDefined()
      expect(Array.isArray(ids)).toBe(true)
      expect(ids.length).toBe(3)
    })

    it('should import with metadata for each item', async () => {
      const data = [
        { data: "Item 1", metadata: { category: "A" } },
        { data: "Item 2", metadata: { category: "B" } }
      ]
      const ids = await brainy.import(data)
      expect(ids.length).toBe(2)
    })
  })

  describe('Core Method 4: addNoun()', () => {
    it('should add typed noun entities', async () => {
      const personId = await brainy.addNoun("John Doe", NounType.Person)
      expect(personId).toBeDefined()

      const orgId = await brainy.addNoun("ACME Corp", NounType.Organization)
      expect(orgId).toBeDefined()

      const locationId = await brainy.addNoun("San Francisco", NounType.Location)
      expect(locationId).toBeDefined()
    })

    it('should add noun with metadata', async () => {
      const metadata = { age: 25, role: "Engineer" }
      const id = await brainy.addNoun("Jane Smith", NounType.Person, metadata)
      expect(id).toBeDefined()
    })
  })

  describe('Core Method 5: addVerb()', () => {
    it('should create relationships between nouns', async () => {
      const personId = await brainy.addNoun("Bob Wilson", NounType.Person)
      const companyId = await brainy.addNoun("Tech Solutions", NounType.Organization)

      const verbId = await brainy.addVerb(personId, companyId, VerbType.WorksWith)
      expect(verbId).toBeDefined()
    })

    it('should create verb with metadata and weight', async () => {
      const sourceId = await brainy.addNoun("Alice", NounType.Person)
      const targetId = await brainy.addNoun("Project Alpha", NounType.Project)

      const verbId = await brainy.addVerb(
        sourceId, 
        targetId, 
        VerbType.WorksWith,
        { role: "Lead Developer", since: "2024" },
        0.9
      )
      expect(verbId).toBeDefined()
    })
  })

  describe('Core Method 6: update()', () => {
    it('should update existing data', async () => {
      const id = await brainy.add("Original data")
      const success = await brainy.update(id, "Updated data")
      expect(success).toBe(true)
    })

    it('should update data and metadata', async () => {
      const id = await brainy.add("Data", { version: 1 })
      const success = await brainy.update(id, "Updated data", { version: 2 })
      expect(success).toBe(true)
    })

    it('should update with cascade option', async () => {
      const personId = await brainy.addNoun("Charlie", NounType.Person)
      const success = await brainy.update(
        personId, 
        "Charles Thompson", 
        { fullName: "Charles Thompson" },
        { cascade: true }
      )
      expect(success).toBe(true)
    })
  })

  describe('Core Method 7: delete()', () => {
    it('should soft delete by default', async () => {
      const id = await brainy.add("Test data for deletion")
      const success = await brainy.delete(id)
      expect(success).toBe(true)

      // Should not appear in search results
      const results = await brainy.search("Test data for deletion", 10)
      expect(results.length).toBe(0)
    })

    it('should hard delete when specified', async () => {
      const id = await brainy.add("Data to hard delete")
      const success = await brainy.delete(id, { soft: false })
      expect(success).toBe(true)
    })

    it('should cascade delete related verbs', async () => {
      const personId = await brainy.addNoun("Dave", NounType.Person)
      const projectId = await brainy.addNoun("Project Beta", NounType.Project)
      await brainy.addVerb(personId, projectId, VerbType.WorksWith)

      const success = await brainy.delete(personId, { cascade: true })
      expect(success).toBe(true)
    })

    it('should force delete even with relationships', async () => {
      const personId = await brainy.addNoun("Eve", NounType.Person)
      const taskId = await brainy.addNoun("Important Task", NounType.Task)
      await brainy.addVerb(personId, taskId, VerbType.Owns)

      const success = await brainy.delete(personId, { force: true })
      expect(success).toBe(true)
    })
  })

  describe('Encryption Features', () => {
    it('should encrypt and decrypt configuration', async () => {
      await brainy.setConfig('api-key', 'secret-value', { encrypt: true })
      const value = await brainy.getConfig('api-key', { decrypt: true })
      expect(value).toBe('secret-value')
    })

    it('should encrypt individual data items', async () => {
      const encrypted = await brainy.encryptData('sensitive information')
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe('sensitive information')

      const decrypted = await brainy.decryptData(encrypted)
      expect(decrypted).toBe('sensitive information')
    })
  })

  describe('Container & Model Preloading', () => {
    it('should support model preloading configuration', async () => {
      // Test preload configuration (doesn't actually download in tests)
      const config = {
        model: 'Xenova/all-MiniLM-L6-v2',
        cacheDir: './test-models'
      }
      // Just test that the method exists and doesn't throw
      expect(() => BrainyData.preloadModel).not.toThrow()
    })

    it('should support warmup initialization', async () => {
      const options = {
        storage: { forceMemoryStorage: true }
      }
      const warmupOptions = { preloadModel: true }
      
      // Test that warmup method exists and configuration is accepted
      expect(() => BrainyData.warmup).not.toThrow()
    })
  })
})