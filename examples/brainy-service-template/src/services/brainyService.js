import { BrainyData } from '@soulcraft/brainy'
import config from 'config'
import { logger } from '../utils/logger.js'

export class BrainyService {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      return
    }

    try {
      // Build Brainy configuration from app config
      const brainyConfig = this.buildBrainyConfig()
      
      // Initialize Brainy database
      this.db = new BrainyData(brainyConfig)
      await this.db.init()

      this.isInitialized = true
      logger.info('Brainy database initialized successfully', {
        storage: config.get('brainy.storage.type'),
        features: config.get('brainy.features')
      })
    } catch (error) {
      logger.error('Failed to initialize Brainy database:', error)
      throw error
    }
  }

  buildBrainyConfig() {
    const brainyConfig = {}

    // Storage configuration
    const storageConfig = config.get('brainy.storage')
    if (storageConfig.type === 's3' && storageConfig.s3) {
      brainyConfig.storage = {
        s3Storage: {
          bucketName: storageConfig.s3.bucketName,
          region: storageConfig.s3.region,
          accessKeyId: storageConfig.s3.accessKeyId,
          secretAccessKey: storageConfig.s3.secretAccessKey
        }
      }
    } else if (storageConfig.type === 'filesystem') {
      brainyConfig.storage = {
        forceFileSystemStorage: true
      }
    } else {
      brainyConfig.storage = {
        forceMemoryStorage: true
      }
    }

    // Cache configuration
    if (config.has('brainy.cache')) {
      brainyConfig.cache = config.get('brainy.cache')
    }

    // Logging configuration
    if (config.has('brainy.logging')) {
      brainyConfig.logging = config.get('brainy.logging')
    }

    // Intelligent verb scoring configuration
    if (config.get('brainy.features.intelligentVerbScoring')) {
      brainyConfig.intelligentVerbScoring = config.get('brainy.intelligentVerbScoring')
    }

    // Real-time updates
    if (config.get('brainy.features.realTimeUpdates')) {
      brainyConfig.realtimeUpdates = {
        enabled: true,
        interval: 30000,
        updateStatistics: true,
        updateIndex: true
      }
    }

    // Distributed mode
    if (config.get('brainy.features.distributedMode')) {
      brainyConfig.distributed = true
    }

    return brainyConfig
  }

  // Entity operations
  async addEntity(data, metadata = {}, options = {}) {
    this.ensureInitialized()
    
    try {
      const id = await this.db.add(data, metadata, options)
      logger.debug('Entity added', { id, metadata: metadata.type || 'unknown' })
      return id
    } catch (error) {
      logger.error('Failed to add entity:', error)
      throw error
    }
  }

  async getEntity(id) {
    this.ensureInitialized()
    
    try {
      const entity = await this.db.get(id)
      return entity
    } catch (error) {
      logger.error(`Failed to get entity ${id}:`, error)
      throw error
    }
  }

  async updateEntity(id, data, metadata = {}) {
    this.ensureInitialized()
    
    try {
      await this.db.update(id, data, metadata)
      logger.debug('Entity updated', { id })
      return true
    } catch (error) {
      logger.error(`Failed to update entity ${id}:`, error)
      throw error
    }
  }

  async deleteEntity(id) {
    this.ensureInitialized()
    
    try {
      await this.db.delete(id)
      logger.debug('Entity deleted', { id })
      return true
    } catch (error) {
      logger.error(`Failed to delete entity ${id}:`, error)
      throw error
    }
  }

  async searchEntities(query, options = {}) {
    this.ensureInitialized()
    
    try {
      const results = await this.db.search(query, options.limit || 10, {
        threshold: options.threshold || 0.7,
        includeMetadata: true,
        ...options
      })
      
      logger.debug('Entity search completed', { 
        query: query.substring(0, 50), 
        resultCount: results.length 
      })
      
      return results
    } catch (error) {
      logger.error('Entity search failed:', error)
      throw error
    }
  }

  async listEntities(options = {}) {
    this.ensureInitialized()
    
    try {
      // Get all entities with pagination if supported
      const entities = await this.db.getAllNouns(options)
      return entities
    } catch (error) {
      logger.error('Failed to list entities:', error)
      throw error
    }
  }

  // Relationship operations
  async addRelationship(sourceId, targetId, type, options = {}) {
    this.ensureInitialized()
    
    try {
      const relationshipId = await this.db.addVerb(sourceId, targetId, undefined, {
        type,
        weight: options.weight,
        metadata: options.metadata,
        autoCreateMissingNouns: options.autoCreateMissingNouns || false
      })
      
      logger.debug('Relationship added', { 
        relationshipId, 
        sourceId, 
        targetId, 
        type 
      })
      
      return relationshipId
    } catch (error) {
      logger.error('Failed to add relationship:', error)
      throw error
    }
  }

  async getRelationship(id) {
    this.ensureInitialized()
    
    try {
      const relationship = await this.db.getVerb(id)
      return relationship
    } catch (error) {
      logger.error(`Failed to get relationship ${id}:`, error)
      throw error
    }
  }

  async updateRelationship(id, updates) {
    this.ensureInitialized()
    
    try {
      await this.db.updateVerb(id, updates)
      logger.debug('Relationship updated', { id })
      return true
    } catch (error) {
      logger.error(`Failed to update relationship ${id}:`, error)
      throw error
    }
  }

  async deleteRelationship(id) {
    this.ensureInitialized()
    
    try {
      await this.db.deleteVerb(id)
      logger.debug('Relationship deleted', { id })
      return true
    } catch (error) {
      logger.error(`Failed to delete relationship ${id}:`, error)
      throw error
    }
  }

  async listRelationships(options = {}) {
    this.ensureInitialized()
    
    try {
      const relationships = await this.db.getVerbs(options)
      return relationships
    } catch (error) {
      logger.error('Failed to list relationships:', error)
      throw error
    }
  }

  // Health and metrics
  async getHealth() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' }
    }

    try {
      const stats = await this.db.getStatistics()
      return {
        status: 'healthy',
        database: {
          entities: stats.nounCount || 0,
          relationships: stats.verbCount || 0,
          indexSize: stats.hnswIndexSize || 0
        },
        features: {
          intelligentVerbScoring: config.get('brainy.features.intelligentVerbScoring'),
          realTimeUpdates: config.get('brainy.features.realTimeUpdates'),
          distributedMode: config.get('brainy.features.distributedMode')
        }
      }
    } catch (error) {
      logger.error('Health check failed:', error)
      return { 
        status: 'unhealthy', 
        error: error.message 
      }
    }
  }

  async getMetrics() {
    this.ensureInitialized()
    
    try {
      const stats = await this.db.getStatistics()
      return {
        database: stats,
        performance: {
          // Add performance metrics here
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      }
    } catch (error) {
      logger.error('Failed to get metrics:', error)
      throw error
    }
  }

  // Utility methods
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('BrainyService not initialized')
    }
  }

  async shutdown() {
    if (this.db && this.db.cleanup) {
      await this.db.cleanup()
    }
    this.isInitialized = false
    logger.info('BrainyService shutdown complete')
  }

  // Expose the underlying db for advanced operations
  getDatabase() {
    this.ensureInitialized()
    return this.db
  }
}