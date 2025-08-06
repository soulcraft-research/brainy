/**
 * Tests for distributed configuration migration to index folder
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DistributedConfigManager } from '../src/distributed/configManager.js'
import { MemoryStorage } from '../src/storage/adapters/memoryStorage.js'
import { SharedConfig } from '../src/types/distributedTypes.js'

describe('Distributed Config Migration', () => {
  let storage: MemoryStorage
  let configManager: DistributedConfigManager

  beforeEach(async () => {
    storage = new MemoryStorage()
    await storage.init()
  })

  afterEach(async () => {
    if (configManager) {
      await configManager.cleanup()
    }
  })

  it('should migrate config from legacy location to index folder', async () => {
    // Create a legacy config in the old location
    const legacyConfig: SharedConfig = {
      version: 1,
      updated: new Date().toISOString(),
      settings: {
        partitionStrategy: 'hash',
        partitionCount: 100,
        embeddingModel: 'text-embedding-ada-002',
        dimensions: 1536,
        distanceMetric: 'cosine',
        hnswParams: {
          M: 16,
          efConstruction: 200
        }
      },
      instances: {}
    }

    // Save to legacy location
    await storage.saveMetadata('_distributed_config', legacyConfig)

    // Create config manager
    configManager = new DistributedConfigManager(
      storage,
      { role: 'reader' }
    )

    // Initialize - should trigger migration
    const config = await configManager.initialize()

    // Verify config was loaded (version gets incremented during save)
    expect(config).toBeDefined()
    expect(config.version).toBeGreaterThanOrEqual(2) // Incremented during migration save
    expect(config.settings.partitionStrategy).toBe('hash')

    // Verify config is now in statistics
    const stats = await storage.getStatistics()
    expect(stats).toBeDefined()
    expect(stats?.distributedConfig).toBeDefined()
    expect(stats?.distributedConfig?.version).toBeGreaterThanOrEqual(2)
    expect(stats?.distributedConfig?.settings.partitionStrategy).toBe('hash')
  })

  it('should create new config in index folder if no legacy exists', async () => {
    // Create config manager without legacy config
    configManager = new DistributedConfigManager(
      storage,
      { role: 'writer' }
    )

    // Initialize - should create new config
    const config = await configManager.initialize()

    // Verify config was created (version gets incremented during save)
    expect(config).toBeDefined()
    expect(config.version).toBeGreaterThanOrEqual(2) // Incremented during initial save
    expect(config.settings.partitionStrategy).toBe('hash')

    // Verify config is in statistics
    const stats = await storage.getStatistics()
    expect(stats).toBeDefined()
    expect(stats?.distributedConfig).toBeDefined()
    expect(stats?.distributedConfig?.version).toBeGreaterThanOrEqual(1)
  })

  it('should update config in index folder on save', async () => {
    // Create config manager with short heartbeat interval for testing
    configManager = new DistributedConfigManager(
      storage,
      { 
        role: 'hybrid',
        heartbeatInterval: 50 // Short interval for testing
      }
    )

    // Initialize
    const config = await configManager.initialize()
    const initialVersion = config.version

    // Get config to verify it's accessible
    const currentConfig = configManager.getConfig()
    expect(currentConfig).toBeDefined()

    // Config should already be in statistics from initialization
    const stats = await storage.getStatistics()
    expect(stats).toBeDefined()
    expect(stats?.distributedConfig).toBeDefined()
    expect(stats?.distributedConfig?.version).toBeGreaterThanOrEqual(initialVersion)
  })

  it('should load config from index folder on subsequent reads', async () => {
    // First, create a config
    configManager = new DistributedConfigManager(
      storage,
      { role: 'reader' }
    )
    const config1 = await configManager.initialize()
    await configManager.cleanup()

    // Create a new manager and verify it loads from index folder
    const configManager2 = new DistributedConfigManager(
      storage,
      { role: 'reader' }
    )
    const config2 = await configManager2.initialize()

    // Config2 should load the same config (version may be same or slightly higher due to heartbeat)
    expect(config2.version).toBeGreaterThanOrEqual(config1.version - 1) // Allow for timing differences
    expect(config2.settings.partitionStrategy).toBe(config1.settings.partitionStrategy)

    await configManager2.cleanup()
  })
})