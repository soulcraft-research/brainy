/**
 * Distributed Configuration Manager
 * Manages shared configuration in S3 for distributed Brainy instances
 */

import { v4 as uuidv4 } from '../universal/uuid.js'
import { 
  DistributedConfig, 
  SharedConfig, 
  InstanceInfo,
  InstanceRole 
} from '../types/distributedTypes.js'
import { StorageAdapter } from '../coreTypes.js'

// Constants for config storage locations
const DISTRIBUTED_CONFIG_KEY = 'distributed_config'
const LEGACY_CONFIG_KEY = '_distributed_config'

export class DistributedConfigManager {
  private config: SharedConfig | null = null
  private instanceId: string
  private role: InstanceRole | undefined
  private configPath: string
  private heartbeatInterval: number
  private configCheckInterval: number
  private instanceTimeout: number
  private storage: StorageAdapter
  private heartbeatTimer?: NodeJS.Timeout
  private configWatchTimer?: NodeJS.Timeout
  private lastConfigVersion: number = 0
  private onConfigUpdate?: (config: SharedConfig) => void
  private hasMigrated: boolean = false
  
  constructor(
    storage: StorageAdapter,
    distributedConfig?: DistributedConfig,
    brainyMode?: { readOnly?: boolean; writeOnly?: boolean }
  ) {
    this.storage = storage
    this.instanceId = distributedConfig?.instanceId || `instance-${uuidv4()}`
    // Updated default path to use _system instead of _brainy
    this.configPath = distributedConfig?.configPath || '_system/distributed_config.json'
    this.heartbeatInterval = distributedConfig?.heartbeatInterval || 30000
    this.configCheckInterval = distributedConfig?.configCheckInterval || 10000
    this.instanceTimeout = distributedConfig?.instanceTimeout || 60000
    
    // Set role from distributed config if provided
    if (distributedConfig?.role) {
      this.role = distributedConfig.role
    }
    // Infer role from Brainy's read/write mode if not explicitly set
    else if (brainyMode) {
      if (brainyMode.writeOnly) {
        this.role = 'writer'
      } else if (brainyMode.readOnly) {
        this.role = 'reader'
      }
      // If neither readOnly nor writeOnly, role must be explicitly set
    }
  }
  
  /**
   * Initialize the distributed configuration
   */
  async initialize(): Promise<SharedConfig> {
    // Load or create configuration
    this.config = await this.loadOrCreateConfig()
    
    // Determine role if not explicitly set
    if (!this.role) {
      this.role = await this.determineRole()
    }
    
    // Register this instance
    await this.registerInstance()
    
    // Start heartbeat and config watching
    this.startHeartbeat()
    this.startConfigWatch()
    
    return this.config
  }
  
  /**
   * Load existing config or create new one
   */
  private async loadOrCreateConfig(): Promise<SharedConfig> {
    // First, try to load from the new location in index folder
    try {
      const configData = await this.storage.getStatistics()
      if (configData && configData.distributedConfig) {
        this.lastConfigVersion = configData.distributedConfig.version
        return configData.distributedConfig as SharedConfig
      }
    } catch (error) {
      // Config doesn't exist in new location yet
    }
    
    // Check if we need to migrate from old location
    if (!this.hasMigrated) {
      const migrated = await this.migrateConfigFromLegacyLocation()
      if (migrated) {
        return migrated
      }
    }
    
    // Legacy fallback - try old location
    try {
      const configData = await this.storage.getMetadata(LEGACY_CONFIG_KEY)
      if (configData) {
        // Migrate to new location
        await this.migrateConfig(configData as SharedConfig)
        this.lastConfigVersion = configData.version
        return configData as SharedConfig
      }
    } catch (error) {
      // Config doesn't exist yet
    }
    
    // Create default config
    const newConfig: SharedConfig = {
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
    
    await this.saveConfig(newConfig)
    return newConfig
  }
  
  /**
   * Determine role based on configuration
   * IMPORTANT: Role must be explicitly set - no automatic assignment based on order
   */
  private async determineRole(): Promise<InstanceRole> {
    // Check environment variable first
    if (process.env.BRAINY_ROLE) {
      const role = process.env.BRAINY_ROLE.toLowerCase()
      if (role === 'writer' || role === 'reader' || role === 'hybrid') {
        return role as InstanceRole
      }
      throw new Error(`Invalid BRAINY_ROLE: ${process.env.BRAINY_ROLE}. Must be 'writer', 'reader', or 'hybrid'`)
    }
    
    // Check if explicitly passed in distributed config
    if (this.role) {
      return this.role
    }
    
    // DO NOT auto-assign roles based on deployment order or existing instances
    // This is dangerous and can lead to data corruption or loss
    throw new Error(
      'Distributed mode requires explicit role configuration. ' +
      'Set BRAINY_ROLE environment variable or pass role in distributed config. ' +
      'Valid roles: "writer", "reader", "hybrid"'
    )
  }
  
  /**
   * Check if an instance is still alive
   */
  private isInstanceAlive(instance: InstanceInfo): boolean {
    const lastSeen = new Date(instance.lastHeartbeat).getTime()
    const now = Date.now()
    return (now - lastSeen) < this.instanceTimeout
  }
  
  /**
   * Register this instance in the shared config
   */
  private async registerInstance(): Promise<void> {
    if (!this.config) return
    
    // Role must be set by this point
    if (!this.role) {
      throw new Error('Cannot register instance without a role')
    }
    
    const instanceInfo: InstanceInfo = {
      role: this.role,
      status: 'active',
      lastHeartbeat: new Date().toISOString(),
      metrics: {
        memoryUsage: process.memoryUsage().heapUsed
      }
    }
    
    // Add endpoint if available
    if (process.env.SERVICE_ENDPOINT) {
      instanceInfo.endpoint = process.env.SERVICE_ENDPOINT
    }
    
    this.config.instances[this.instanceId] = instanceInfo
    await this.saveConfig(this.config)
  }
  
  /**
   * Migrate config from legacy location to new location
   */
  private async migrateConfigFromLegacyLocation(): Promise<SharedConfig | null> {
    try {
      // Try to load from old location
      const legacyConfig = await this.storage.getMetadata(LEGACY_CONFIG_KEY)
      if (legacyConfig) {
        console.log('Migrating distributed config from legacy location to index folder...')
        
        // Save to new location
        await this.migrateConfig(legacyConfig as SharedConfig)
        
        // Delete from old location (optional - we can keep it for rollback)
        // await this.storage.deleteMetadata(LEGACY_CONFIG_KEY)
        
        this.hasMigrated = true
        this.lastConfigVersion = legacyConfig.version
        return legacyConfig as SharedConfig
      }
    } catch (error) {
      console.error('Error during config migration:', error)
    }
    
    this.hasMigrated = true
    return null
  }
  
  /**
   * Migrate config to new location in index folder
   */
  private async migrateConfig(config: SharedConfig): Promise<void> {
    // Get existing statistics or create new
    let stats = await this.storage.getStatistics()
    if (!stats) {
      stats = {
        nounCount: {},
        verbCount: {},
        metadataCount: {},
        hnswIndexSize: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // Add distributed config to statistics
    stats.distributedConfig = config
    
    // Save updated statistics
    await this.storage.saveStatistics(stats)
  }
  
  /**
   * Save configuration with version increment
   */
  private async saveConfig(config: SharedConfig): Promise<void> {
    config.version++
    config.updated = new Date().toISOString()
    this.lastConfigVersion = config.version
    
    // Save to new location in index folder along with statistics
    let stats = await this.storage.getStatistics()
    if (!stats) {
      stats = {
        nounCount: {},
        verbCount: {},
        metadataCount: {},
        hnswIndexSize: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // Update distributed config in statistics
    stats.distributedConfig = config
    
    // Save updated statistics
    await this.storage.saveStatistics(stats)
    
    this.config = config
  }
  
  /**
   * Start heartbeat to keep instance alive in config
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      await this.updateHeartbeat()
    }, this.heartbeatInterval)
  }
  
  /**
   * Update heartbeat and clean stale instances
   */
  private async updateHeartbeat(): Promise<void> {
    if (!this.config) return
    
    // Reload config to get latest state
    try {
      const latestConfig = await this.loadConfig()
      if (latestConfig) {
        this.config = latestConfig
      }
    } catch (error) {
      console.error('Failed to reload config:', error)
    }
    
    // Update our heartbeat
    if (this.config.instances[this.instanceId]) {
      this.config.instances[this.instanceId].lastHeartbeat = new Date().toISOString()
      this.config.instances[this.instanceId].status = 'active'
      
      // Update metrics if available
      this.config.instances[this.instanceId].metrics = {
        memoryUsage: process.memoryUsage().heapUsed
      }
    } else {
      // Re-register if we were removed
      await this.registerInstance()
      return
    }
    
    // Clean up stale instances
    const now = Date.now()
    let hasChanges = false
    
    for (const [id, instance] of Object.entries(this.config.instances)) {
      if (id === this.instanceId) continue
      
      const lastSeen = new Date(instance.lastHeartbeat).getTime()
      if (now - lastSeen > this.instanceTimeout) {
        delete this.config.instances[id]
        hasChanges = true
      }
    }
    
    // Save if there were changes
    if (hasChanges) {
      await this.saveConfig(this.config)
    } else {
      // Just update our heartbeat without version increment
      // Get existing statistics
      let stats = await this.storage.getStatistics()
      if (!stats) {
        stats = {
          nounCount: {},
          verbCount: {},
          metadataCount: {},
          hnswIndexSize: 0,
          lastUpdated: new Date().toISOString()
        }
      }
      
      // Update distributed config in statistics without version increment
      stats.distributedConfig = this.config
      
      // Save updated statistics
      await this.storage.saveStatistics(stats)
    }
  }
  
  /**
   * Start watching for config changes
   */
  private startConfigWatch(): void {
    this.configWatchTimer = setInterval(async () => {
      await this.checkForConfigUpdates()
    }, this.configCheckInterval)
  }
  
  /**
   * Check for configuration updates
   */
  private async checkForConfigUpdates(): Promise<void> {
    try {
      const latestConfig = await this.loadConfig()
      if (!latestConfig) return
      
      if (latestConfig.version > this.lastConfigVersion) {
        this.config = latestConfig
        this.lastConfigVersion = latestConfig.version
        
        // Notify listeners of config update
        if (this.onConfigUpdate) {
          this.onConfigUpdate(latestConfig)
        }
      }
    } catch (error) {
      console.error('Failed to check config updates:', error)
    }
  }
  
  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<SharedConfig | null> {
    try {
      // Try new location first
      const stats = await this.storage.getStatistics()
      if (stats && stats.distributedConfig) {
        return stats.distributedConfig as SharedConfig
      }
      
      // Fallback to legacy location if not migrated yet
      if (!this.hasMigrated) {
        const configData = await this.storage.getMetadata(LEGACY_CONFIG_KEY)
        if (configData) {
          // Trigger migration on next save
          return configData as SharedConfig
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return null
  }
  
  /**
   * Get current configuration
   */
  getConfig(): SharedConfig | null {
    return this.config
  }
  
  /**
   * Get instance role
   */
  getRole(): InstanceRole {
    if (!this.role) {
      throw new Error('Role not initialized')
    }
    return this.role
  }
  
  /**
   * Get instance ID
   */
  getInstanceId(): string {
    return this.instanceId
  }
  
  /**
   * Set config update callback
   */
  setOnConfigUpdate(callback: (config: SharedConfig) => void): void {
    this.onConfigUpdate = callback
  }
  
  /**
   * Get all active instances of a specific role
   */
  getInstancesByRole(role: InstanceRole): InstanceInfo[] {
    if (!this.config) return []
    
    return Object.entries(this.config.instances)
      .filter(([_, instance]) => 
        instance.role === role && 
        this.isInstanceAlive(instance)
      )
      .map(([_, instance]) => instance)
  }
  
  /**
   * Update instance metrics
   */
  async updateMetrics(metrics: Partial<InstanceInfo['metrics']>): Promise<void> {
    if (!this.config || !this.config.instances[this.instanceId]) return
    
    this.config.instances[this.instanceId].metrics = {
      ...this.config.instances[this.instanceId].metrics,
      ...metrics
    }
    
    // Don't increment version for metric updates
    // Get existing statistics
    let stats = await this.storage.getStatistics()
    if (!stats) {
      stats = {
        nounCount: {},
        verbCount: {},
        metadataCount: {},
        hnswIndexSize: 0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // Update distributed config in statistics without version increment
    stats.distributedConfig = this.config
    
    // Save updated statistics
    await this.storage.saveStatistics(stats)
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    if (this.configWatchTimer) {
      clearInterval(this.configWatchTimer)
    }
    
    // Mark instance as inactive
    if (this.config && this.config.instances[this.instanceId]) {
      this.config.instances[this.instanceId].status = 'inactive'
      await this.saveConfig(this.config)
    }
  }
}