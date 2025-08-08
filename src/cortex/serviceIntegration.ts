/**
 * Service Integration Helpers - Seamless Cortex Integration for Existing Services
 * 
 * Atomic Age Service Management Protocol
 */

import { BrainyData } from '../brainyData.js'
import { Cortex } from './cortex.js'
import * as fs from '../universal/fs.js'
import * as path from '../universal/path.js'

export interface ServiceConfig {
  name: string
  version?: string
  environment?: 'development' | 'production' | 'staging' | 'test'
  storage?: {
    type: 'filesystem' | 's3' | 'gcs' | 'memory'
    bucket?: string
    path?: string
    credentials?: any
  }
  features?: {
    chat?: boolean
    augmentations?: string[]
    encryption?: boolean
  }
  migration?: {
    strategy: 'immediate' | 'gradual'
    rollback?: boolean
  }
}

export interface BrainyOptions {
  storage?: any
  augmentations?: any[]
  encryption?: boolean
  caching?: boolean
}

export interface MigrationPlan {
  fromStorage: string
  toStorage: string
  strategy: 'immediate' | 'gradual'
  rollback?: boolean
  validation?: boolean
  backup?: boolean
}

export interface ServiceInstance {
  id: string
  name: string
  version: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastSeen: Date
  config: ServiceConfig
}

export interface HealthReport {
  service: ServiceInstance
  checks: {
    storage: boolean
    search: boolean
    embedding: boolean
    config: boolean
  }
  performance: {
    responseTime: number
    memoryUsage: number
    storageSize: number
  }
  issues: string[]
}

export interface MigrationReport {
  plan: MigrationPlan
  estimated: {
    duration: number
    downtime: number
    dataSize: number
    complexity: 'low' | 'medium' | 'high'
  }
  risks: string[]
  prerequisites: string[]
  steps: string[]
}

/**
 * Service Integration Helper Class
 */
export class CortexServiceIntegration {
  
  /**
   * Initialize Cortex for a service with automatic configuration
   */
  static async initializeForService(serviceName: string, options?: Partial<ServiceConfig>): Promise<{ cortex: Cortex, config: ServiceConfig }> {
    const cortex = new Cortex()
    
    // Try to load existing configuration
    let config: ServiceConfig
    try {
      config = await this.loadServiceConfig(serviceName)
    } catch {
      // Create new configuration
      config = await this.createServiceConfig(serviceName, options)
    }

    await cortex.init({
      storage: config.storage?.type,
      encryption: config.features?.encryption
    })

    return { cortex, config }
  }

  /**
   * Create BrainyData instance from Cortex configuration
   */
  static async createBrainyFromCortex(cortex: Cortex, serviceName?: string): Promise<BrainyData> {
    // Get storage configuration from Cortex
    const storageType = await cortex.configGet('STORAGE_TYPE') || 'filesystem'
    const encryptionEnabled = await cortex.configGet('ENCRYPTION_ENABLED') === 'true'
    
    const options: BrainyOptions = {
      storage: await this.getBrainyStorageOptions(cortex, storageType),
      encryption: encryptionEnabled,
      caching: true
    }

    // Load augmentations if specified
    if (serviceName) {
      const serviceConfig = await this.loadServiceConfig(serviceName)
      if (serviceConfig.features?.augmentations) {
        options.augmentations = serviceConfig.features.augmentations
      }
    }

    const brainy = new BrainyData(options)
    await brainy.init()
    
    return brainy
  }

  /**
   * Auto-discover Brainy instances in the current environment
   */
  static async discoverBrainyInstances(): Promise<ServiceInstance[]> {
    const instances: ServiceInstance[] = []
    
    // Look for .cortex directories
    const searchPaths = [
      process.cwd(),
      path.join(process.cwd(), '..'),
      '/opt/services',
      '/var/lib/services'
    ]

    for (const searchPath of searchPaths) {
      try {
        const entries = await fs.readdir(searchPath, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const cortexPath = path.join(searchPath, entry.name, '.cortex')
            try {
              await fs.access(cortexPath)
              const instance = await this.loadServiceInstance(path.join(searchPath, entry.name))
              if (instance) instances.push(instance)
            } catch {
              // No Cortex in this directory
            }
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
    }

    return instances
  }

  /**
   * Perform health check on all discovered services
   */
  static async healthCheckAll(): Promise<HealthReport[]> {
    const instances = await this.discoverBrainyInstances()
    const reports: HealthReport[] = []

    for (const instance of instances) {
      try {
        const report = await this.performHealthCheck(instance)
        reports.push(report)
      } catch (error) {
        reports.push({
          service: instance,
          checks: { storage: false, search: false, embedding: false, config: false },
          performance: { responseTime: -1, memoryUsage: -1, storageSize: -1 },
          issues: [`Health check failed: ${error}`]
        })
      }
    }

    return reports
  }

  /**
   * Plan migration for a service
   */
  static async planMigration(serviceName: string, plan: Partial<MigrationPlan>): Promise<MigrationReport> {
    const config = await this.loadServiceConfig(serviceName)
    const fullPlan: MigrationPlan = {
      fromStorage: config.storage?.type || 'filesystem',
      toStorage: plan.toStorage || 's3',
      strategy: plan.strategy || 'immediate',
      rollback: plan.rollback ?? true,
      validation: plan.validation ?? true,
      backup: plan.backup ?? true
    }

    // Estimate migration complexity
    const dataSize = await this.estimateDataSize(serviceName)
    const complexity = this.assessMigrationComplexity(fullPlan, dataSize)
    
    return {
      plan: fullPlan,
      estimated: {
        duration: this.estimateDuration(complexity, dataSize),
        downtime: this.estimateDowntime(fullPlan.strategy),
        dataSize,
        complexity
      },
      risks: this.identifyRisks(fullPlan),
      prerequisites: this.getPrerequisites(fullPlan),
      steps: this.generateMigrationSteps(fullPlan)
    }
  }

  /**
   * Execute migration for all services
   */
  static async migrateAll(plan: MigrationPlan): Promise<void> {
    const instances = await this.discoverBrainyInstances()
    
    for (const instance of instances) {
      const cortex = new Cortex()
      // Set working directory to service directory
      process.chdir(path.dirname(instance.config.name))
      
      await cortex.migrate({
        to: plan.toStorage,
        strategy: plan.strategy,
        bucket: plan.toStorage === 's3' ? 'default-bucket' : undefined
      })
    }
  }

  /**
   * Generate Brainy storage options from Cortex config
   */
  private static async getBrainyStorageOptions(cortex: Cortex, storageType: string): Promise<any> {
    switch (storageType) {
      case 'filesystem':
        return { forceFileSystemStorage: true }
        
      case 's3':
        return {
          forceS3CompatibleStorage: true,
          s3Config: {
            bucket: await cortex.configGet('S3_BUCKET'),
            accessKeyId: await cortex.configGet('AWS_ACCESS_KEY_ID'),
            secretAccessKey: await cortex.configGet('AWS_SECRET_ACCESS_KEY'),
            region: await cortex.configGet('AWS_REGION') || 'us-east-1'
          }
        }
        
      case 'r2':
        return {
          forceS3CompatibleStorage: true,
          s3Config: {
            bucket: await cortex.configGet('CLOUDFLARE_R2_BUCKET'),
            accessKeyId: await cortex.configGet('AWS_ACCESS_KEY_ID'), // R2 uses AWS-compatible keys
            secretAccessKey: await cortex.configGet('AWS_SECRET_ACCESS_KEY'),
            endpoint: await cortex.configGet('CLOUDFLARE_R2_ENDPOINT') || 
                     `https://${await cortex.configGet('CLOUDFLARE_R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
            region: 'auto' // R2 uses 'auto' as region
          }
        }
        
      case 'gcs':
        return {
          forceS3CompatibleStorage: true,
          s3Config: {
            bucket: await cortex.configGet('GCS_BUCKET'),
            endpoint: 'https://storage.googleapis.com',
            // GCS credentials would be configured here
          }
        }
        
      default:
        return { forceMemoryStorage: true }
    }
  }

  /**
   * Load service configuration
   */
  private static async loadServiceConfig(serviceName: string): Promise<ServiceConfig> {
    const configPath = path.join(process.cwd(), '.cortex', 'service.json')
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  }

  /**
   * Create new service configuration
   */
  private static async createServiceConfig(serviceName: string, options?: Partial<ServiceConfig>): Promise<ServiceConfig> {
    const config: ServiceConfig = {
      name: serviceName,
      version: '1.0.0',
      environment: 'development',
      storage: {
        type: 'filesystem',
        path: './brainy_data'
      },
      features: {
        chat: true,
        encryption: true,
        augmentations: []
      },
      ...options
    }

    // Save configuration
    const configDir = path.join(process.cwd(), '.cortex')
    await fs.mkdir(configDir, { recursive: true })
    await fs.writeFile(
      path.join(configDir, 'service.json'),
      JSON.stringify(config, null, 2)
    )

    return config
  }

  /**
   * Load service instance information
   */
  private static async loadServiceInstance(servicePath: string): Promise<ServiceInstance | null> {
    try {
      const configPath = path.join(servicePath, '.cortex', 'service.json')
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
      
      return {
        id: path.basename(servicePath),
        name: config.name,
        version: config.version || '1.0.0',
        status: 'healthy', // Would be determined by actual health check
        lastSeen: new Date(),
        config
      }
    } catch {
      return null
    }
  }

  /**
   * Perform health check on a service instance
   */
  private static async performHealthCheck(instance: ServiceInstance): Promise<HealthReport> {
    // Simulate health check - in real implementation, this would:
    // 1. Connect to the service
    // 2. Test storage connectivity
    // 3. Verify search functionality
    // 4. Check embedding model availability
    // 5. Measure performance metrics

    return {
      service: instance,
      checks: {
        storage: true,
        search: true,
        embedding: true,
        config: true
      },
      performance: {
        responseTime: Math.random() * 100 + 50, // 50-150ms
        memoryUsage: Math.random() * 512 + 256, // 256-768MB
        storageSize: Math.random() * 1024 + 100  // 100-1124MB
      },
      issues: []
    }
  }

  /**
   * Estimate data size for migration planning
   */
  private static async estimateDataSize(serviceName: string): Promise<number> {
    // Simulate data size estimation
    return Math.floor(Math.random() * 1000 + 100) // 100-1100MB
  }

  /**
   * Assess migration complexity
   */
  private static assessMigrationComplexity(plan: MigrationPlan, dataSize: number): 'low' | 'medium' | 'high' {
    if (dataSize > 5000 || plan.fromStorage !== plan.toStorage) return 'high'
    if (dataSize > 1000) return 'medium'
    return 'low'
  }

  /**
   * Estimate migration duration
   */
  private static estimateDuration(complexity: string, dataSize: number): number {
    const baseTime = dataSize / 100 // 1 minute per 100MB
    const multiplier = complexity === 'high' ? 3 : complexity === 'medium' ? 2 : 1
    return Math.ceil(baseTime * multiplier)
  }

  /**
   * Estimate downtime for migration strategy
   */
  private static estimateDowntime(strategy: string): number {
    switch (strategy) {
      case 'immediate': return 60 // 1 minute
      case 'gradual': return 10   // 10 seconds
      default: return 30
    }
  }

  /**
   * Identify migration risks
   */
  private static identifyRisks(plan: MigrationPlan): string[] {
    const risks: string[] = []
    
    if (plan.fromStorage !== plan.toStorage) {
      risks.push('Cross-platform data compatibility')
    }
    
    if (plan.strategy === 'immediate') {
      risks.push('Service downtime during migration')
    }
    
    if (!plan.backup) {
      risks.push('Data loss if migration fails')
    }
    
    return risks
  }

  /**
   * Get migration prerequisites
   */
  private static getPrerequisites(plan: MigrationPlan): string[] {
    const prereqs: string[] = []
    
    if (plan.toStorage === 's3') {
      prereqs.push('AWS credentials configured')
      prereqs.push('S3 bucket created and accessible')
    }
    
    if (plan.toStorage === 'r2') {
      prereqs.push('Cloudflare R2 API token configured')
      prereqs.push('R2 bucket created and accessible')
      prereqs.push('CLOUDFLARE_R2_ACCOUNT_ID environment variable set')
    }
    
    if (plan.toStorage === 'gcs') {
      prereqs.push('GCP service account configured')
      prereqs.push('GCS bucket created and accessible')
    }
    
    if (plan.backup) {
      prereqs.push('Sufficient storage space for backup')
    }
    
    return prereqs
  }

  /**
   * Generate migration steps
   */
  private static generateMigrationSteps(plan: MigrationPlan): string[] {
    const steps: string[] = []
    
    if (plan.backup) {
      steps.push('Create backup of current data')
    }
    
    steps.push(`Initialize ${plan.toStorage} storage`)
    steps.push('Validate connectivity to target storage')
    
    if (plan.strategy === 'gradual') {
      steps.push('Begin gradual data migration')
      steps.push('Monitor migration progress')
      steps.push('Switch traffic to new storage')
    } else {
      steps.push('Stop service')
      steps.push('Migrate all data')
      steps.push('Update configuration')
      steps.push('Start service with new storage')
    }
    
    if (plan.validation) {
      steps.push('Validate data integrity')
      steps.push('Run health checks')
    }
    
    steps.push('Clean up old storage (if successful)')
    
    return steps
  }
}