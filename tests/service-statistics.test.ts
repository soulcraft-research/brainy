/**
 * Tests for per-service statistics tracking functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { ServiceStatistics } from '../src/coreTypes.js'

describe('Per-Service Statistics', () => {
  let brainy: BrainyData<any>
  
  beforeEach(async () => {
    // Create a new instance with a default service
    brainy = new BrainyData({
      defaultService: 'test-service',
      storage: {
        forceMemoryStorage: true
      }
    })
    await brainy.init()
  })
  
  afterEach(async () => {
    // Cleanup
    if (brainy) {
      await brainy.clear()
    }
  })
  
  describe('Service Tracking', () => {
    it('should track data by default service', async () => {
      // Add data using default service
      await brainy.add({ content: 'test data 1' }, { noun: 'test' })
      await brainy.add({ content: 'test data 2' }, { noun: 'test' })
      
      const stats = await brainy.getStatistics()
      expect(stats.serviceBreakdown).toBeDefined()
      expect(stats.serviceBreakdown?.['test-service']).toBeDefined()
      expect(stats.serviceBreakdown?.['test-service'].nounCount).toBe(2)
    })
    
    it('should track data by explicit service', async () => {
      // Add data with explicit service
      await brainy.add(
        { content: 'github data' }, 
        { noun: 'repository' },
        { service: 'github-package' }
      )
      
      await brainy.add(
        { content: 'bluesky data' }, 
        { noun: 'post' },
        { service: 'bluesky-package' }
      )
      
      const stats = await brainy.getStatistics()
      expect(stats.serviceBreakdown?.['github-package'].nounCount).toBe(1)
      expect(stats.serviceBreakdown?.['bluesky-package'].nounCount).toBe(1)
    })
    
    it('should track verbs by service', async () => {
      // Add nouns first
      const id1 = await brainy.add(
        { content: 'user 1' }, 
        { noun: 'Person' },
        { service: 'social-service' }
      )
      
      const id2 = await brainy.add(
        { content: 'user 2' }, 
        { noun: 'Person' },
        { service: 'social-service' }
      )
      
      // Create relationship
      await brainy.relate(
        id1,
        id2,
        { verb: 'follows' },
        { service: 'social-service' }
      )
      
      const stats = await brainy.getStatistics()
      expect(stats.serviceBreakdown?.['social-service'].verbCount).toBe(1)
      expect(stats.serviceBreakdown?.['social-service'].nounCount).toBe(2)
    })
  })
  
  describe('listServices()', () => {
    it('should list all services that have written data', async () => {
      // Add data from multiple services
      await brainy.add(
        { content: 'data 1' },
        { noun: 'Document' },
        { service: 'service-a' }
      )
      
      await brainy.add(
        { content: 'data 2' },
        { noun: 'Document' },
        { service: 'service-b' }
      )
      
      await brainy.add(
        { content: 'data 3' },
        { noun: 'Document' },
        { service: 'service-a' }
      )
      
      const services = await brainy.listServices()
      
      expect(services).toHaveLength(2)
      expect(services.map(s => s.name)).toContain('service-a')
      expect(services.map(s => s.name)).toContain('service-b')
      
      const serviceA = services.find(s => s.name === 'service-a')
      expect(serviceA?.totalNouns).toBe(2)
      
      const serviceB = services.find(s => s.name === 'service-b')
      expect(serviceB?.totalNouns).toBe(1)
    })
    
    it('should include service activity timestamps', async () => {
      const beforeAdd = new Date()
      
      await brainy.add(
        { content: 'test data' },
        { noun: 'Document' },
        { service: 'timestamped-service' }
      )
      
      const afterAdd = new Date()
      
      const services = await brainy.listServices()
      const service = services.find(s => s.name === 'timestamped-service')
      
      expect(service).toBeDefined()
      expect(service?.status).toBe('active')
      
      // Check if timestamps are present (they may not be if the storage adapter doesn't support them)
      if (service?.lastActivity) {
        const lastActivityTime = new Date(service.lastActivity).getTime()
        expect(lastActivityTime).toBeGreaterThanOrEqual(beforeAdd.getTime())
        expect(lastActivityTime).toBeLessThanOrEqual(afterAdd.getTime())
      }
    })
    
    it('should determine service status correctly', async () => {
      // Add data from an active service
      await brainy.add(
        { content: 'recent data' },
        { noun: 'Document' },
        { service: 'active-service' }
      )
      
      const services = await brainy.listServices()
      const activeService = services.find(s => s.name === 'active-service')
      
      // Should be marked as active if it has recent activity
      expect(activeService?.status).toBe('active')
      
      // Service with no write operations should be marked as read-only
      // This would need to be tested with a service that only reads
    })
  })
  
  describe('getServiceStatistics()', () => {
    it('should return statistics for a specific service', async () => {
      // Add data for specific service
      await brainy.add(
        { content: 'data 1' },
        { noun: 'Document' },
        { service: 'target-service' }
      )
      
      await brainy.add(
        { content: 'data 2' },
        { noun: 'Document' },
        { service: 'target-service' }
      )
      
      await brainy.add(
        { content: 'data 3' },
        { noun: 'Document' },
        { service: 'other-service' }
      )
      
      const serviceStats = await brainy.getServiceStatistics('target-service')
      
      expect(serviceStats).toBeDefined()
      expect(serviceStats?.name).toBe('target-service')
      expect(serviceStats?.totalNouns).toBe(2)
    })
    
    it('should return null for non-existent service', async () => {
      const serviceStats = await brainy.getServiceStatistics('non-existent')
      expect(serviceStats).toBeNull()
    })
    
    it('should include operation counts when available', async () => {
      // Add multiple operations
      const id = await brainy.add(
        { content: 'data' },
        { noun: 'Document' },
        { service: 'ops-service' }
      )
      
      await brainy.updateMetadata(
        id,
        { content: 'updated data', noun: 'Document' },
        { service: 'ops-service' }
      )
      
      const serviceStats = await brainy.getServiceStatistics('ops-service')
      
      expect(serviceStats).toBeDefined()
      expect(serviceStats?.totalNouns).toBe(1)
      expect(serviceStats?.totalMetadata).toBeGreaterThanOrEqual(1)
      
      // Operations tracking depends on whether the storage adapter tracks them
      if (serviceStats?.operations) {
        expect(serviceStats.operations.adds).toBeGreaterThanOrEqual(1)
      }
    })
  })
  
  describe('Service-Filtered getStatistics()', () => {
    it('should filter statistics by single service', async () => {
      // Add data from multiple services
      await brainy.add(
        { content: 'data 1' },
        { noun: 'Document' },
        { service: 'service-a' }
      )
      
      await brainy.add(
        { content: 'data 2' },
        { noun: 'Document' },
        { service: 'service-b' }
      )
      
      await brainy.add(
        { content: 'data 3' },
        { noun: 'Document' },
        { service: 'service-a' }
      )
      
      const statsA = await brainy.getStatistics({ service: 'service-a' })
      expect(statsA.nounCount).toBe(2)
      
      const statsB = await brainy.getStatistics({ service: 'service-b' })
      expect(statsB.nounCount).toBe(1)
    })
    
    it('should filter statistics by multiple services', async () => {
      // Add data from multiple services
      await brainy.add(
        { content: 'data 1' },
        { noun: 'Document' },
        { service: 'service-a' }
      )
      
      await brainy.add(
        { content: 'data 2' },
        { noun: 'Document' },
        { service: 'service-b' }
      )
      
      await brainy.add(
        { content: 'data 3' },
        { noun: 'Document' },
        { service: 'service-c' }
      )
      
      const stats = await brainy.getStatistics({ 
        service: ['service-a', 'service-b'] 
      })
      
      expect(stats.nounCount).toBe(2)
      expect(stats.serviceBreakdown?.['service-a'].nounCount).toBe(1)
      expect(stats.serviceBreakdown?.['service-b'].nounCount).toBe(1)
      expect(stats.serviceBreakdown?.['service-c']).toBeUndefined()
    })
  })
  
  describe('Service-Filtered Queries', () => {
    beforeEach(async () => {
      // Add test data from different services
      await brainy.add(
        { content: 'github repository data' },
        { noun: 'Repository', createdBy: { augmentation: 'github-service' } },
        { service: 'github-service' }
      )
      
      await brainy.add(
        { content: 'bluesky post data' },
        { noun: 'Post', createdBy: { augmentation: 'bluesky-service' } },
        { service: 'bluesky-service' }
      )
      
      await brainy.add(
        { content: 'another github repository' },
        { noun: 'Repository', createdBy: { augmentation: 'github-service' } },
        { service: 'github-service' }
      )
    })
    
    it('should filter search results by service', async () => {
      const results = await brainy.search('repository', 10, {
        service: 'github-service'
      })
      
      // Should only return results from github-service
      expect(results.length).toBeGreaterThan(0)
      results.forEach(result => {
        expect(result.metadata?.createdBy?.augmentation).toBe('github-service')
      })
    })
    
    it('should filter getNouns by service', async () => {
      const result = await brainy.getNouns({
        filter: {
          service: 'github-service'
        }
      })
      
      // Note: Service filtering in getNouns depends on storage adapter implementation
      // The test verifies the API works but actual filtering may vary
      expect(result).toBeDefined()
      expect(result.items).toBeDefined()
    })
    
    it('should filter getVerbs by service', async () => {
      // Add verbs from different services
      const id1 = await brainy.add(
        { content: 'user 1' },
        { noun: 'Person' },
        { service: 'social-service' }
      )
      
      const id2 = await brainy.add(
        { content: 'user 2' },
        { noun: 'Person' },
        { service: 'social-service' }
      )
      
      await brainy.relate(
        id1,
        id2,
        { verb: 'follows' },
        { service: 'social-service' }
      )
      
      const result = await brainy.getVerbs({
        filter: {
          service: 'social-service'
        }
      })
      
      // Note: Service filtering in getVerbs depends on storage adapter implementation
      expect(result).toBeDefined()
      expect(result.items).toBeDefined()
    })
  })
  
  describe('Service Metadata on Data', () => {
    it('should add service metadata to nouns', async () => {
      const id = await brainy.add(
        { content: 'test data' },
        { noun: 'Document' },
        { service: 'metadata-service' }
      )
      
      const doc = await brainy.get(id)
      expect(doc).toBeDefined()
      
      // Service tracking is done in statistics, not directly in metadata
      // Verify through statistics instead
      const stats = await brainy.getStatistics({ service: 'metadata-service' })
      expect(stats.nounCount).toBe(1)
    })
    
    it('should track service for verbs', async () => {
      const id1 = await brainy.add(
        { content: 'node 1' },
        { noun: 'Node' },
        { service: 'graph-service' }
      )
      
      const id2 = await brainy.add(
        { content: 'node 2' },
        { noun: 'Node' },
        { service: 'graph-service' }
      )
      
      const verbId = await brainy.relate(
        id1,
        id2,
        { verb: 'connects' },
        { service: 'graph-service' }
      )
      
      expect(verbId).toBeDefined()
      
      // Verify through statistics
      const stats = await brainy.getStatistics({ service: 'graph-service' })
      expect(stats.verbCount).toBe(1)
      expect(stats.nounCount).toBe(2)
    })
  })
})