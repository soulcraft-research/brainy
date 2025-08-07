import { BrainyData } from '@soulcraft/brainy'
import { logger } from './utils/logger.js'

// Brainy-native augmentations
import { WebSocketAugmentation } from './augmentations/websocketAugmentation.js'
import { WebRTCAugmentation } from './augmentations/webrtcAugmentation.js'
import { HttpAugmentation } from './augmentations/httpAugmentation.js'
import { AutoDiscoveryAugmentation } from './augmentations/autoDiscoveryAugmentation.js'
import { AdaptiveStorageAugmentation } from './augmentations/adaptiveStorageAugmentation.js'
import { EnvironmentAdapterAugmentation } from './augmentations/environmentAdapterAugmentation.js'

/**
 * Zero-configuration Brainy service template that adapts to any environment
 * Uses Brainy's native augmentation system for all functionality
 */
class BrainyServiceTemplate {
  constructor(options = {}) {
    this.options = {
      // Zero configuration by default - everything auto-detected
      autoDetectEverything: true,
      
      // Intelligent adaptation enabled
      intelligentAdaptation: true,
      
      // Communication preferences (auto-detected if not specified)
      preferredTransports: options.transports || 'auto', // 'auto', 'websocket', 'webrtc', 'http'
      
      // Storage preference (auto-detected if not specified)
      storagePreference: options.storage || 'auto', // 'auto', 'memory', 'filesystem', 's3', 'distributed'
      
      // Environment adaptation
      adaptToEnvironment: true,
      
      ...options
    }
    
    this.db = null
    this.isInitialized = false
    this.activeTransports = []
    this.capabilities = null
  }

  async initialize() {
    if (this.isInitialized) {
      return this.db
    }

    logger.info('🧠 Initializing Brainy Service Template with zero configuration...')

    try {
      // Step 1: Detect environment capabilities
      this.capabilities = await this.detectEnvironmentCapabilities()
      logger.info('Environment capabilities detected', this.capabilities)

      // Step 2: Build intelligent Brainy configuration
      const brainyConfig = await this.buildIntelligentBrainyConfig()
      
      // Step 3: Initialize Brainy with intelligent defaults
      this.db = new BrainyData(brainyConfig)
      await this.db.init()

      // Step 4: Add environment-specific augmentations
      await this.addIntelligentAugmentations()

      this.isInitialized = true
      
      logger.info('🚀 Brainy Service Template ready!', {
        storage: brainyConfig.storage?.type || 'auto-detected',
        transports: this.activeTransports,
        environment: this.capabilities.environment,
        augmentations: this.db.augmentations?.length || 0
      })

      return this.db
    } catch (error) {
      logger.error('Failed to initialize Brainy Service Template:', error)
      throw error
    }
  }

  async detectEnvironmentCapabilities() {
    const capabilities = {
      // Environment detection
      environment: this.detectEnvironmentType(),
      
      // Memory and performance
      memory: {
        available: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        isHighMemory: process.memoryUsage().heapTotal > 500 * 1024 * 1024
      },
      
      // Network capabilities
      network: await this.detectNetworkCapabilities(),
      
      // Storage capabilities
      storage: await this.detectStorageCapabilities(),
      
      // Runtime characteristics
      runtime: {
        isLongRunning: process.env.NODE_ENV === 'production' || !!process.env.KUBERNETES_SERVICE_HOST,
        isPersistent: !this.isServerlessEnvironment(),
        supportsWorkers: typeof Worker !== 'undefined' || typeof require !== 'undefined'
      },
      
      // Platform detection
      platform: {
        isNode: typeof process !== 'undefined',
        isBrowser: typeof window !== 'undefined',
        isEdge: this.isEdgeEnvironment(),
        isServerless: this.isServerlessEnvironment(),
        isContainer: this.isContainerEnvironment()
      }
    }

    return capabilities
  }

  detectEnvironmentType() {
    if (typeof window !== 'undefined') return 'browser'
    if (process.env.VERCEL || process.env.NETLIFY) return 'serverless'
    if (process.env.KUBERNETES_SERVICE_HOST) return 'kubernetes'
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'lambda'
    if (this.isContainerEnvironment()) return 'container'
    return 'node'
  }

  async detectNetworkCapabilities() {
    return {
      supportsWebSocket: true, // Available in most environments
      supportsWebRTC: typeof RTCPeerConnection !== 'undefined' || this.capabilities?.platform?.isNode,
      supportsHTTP: true,
      supportsPeerToPeer: !this.isServerlessEnvironment(),
      hasPublicIP: !this.isPrivateNetwork(),
      preferredPort: this.detectPreferredPort()
    }
  }

  async detectStorageCapabilities() {
    const capabilities = {
      memory: true,
      filesystem: false,
      s3: false,
      distributed: false
    }

    // Test filesystem access
    try {
      if (typeof require !== 'undefined') {
        const fs = require('fs')
        fs.accessSync('.', fs.constants.W_OK)
        capabilities.filesystem = true
      }
    } catch {}

    // Detect S3 capability
    capabilities.s3 = !!(process.env.AWS_REGION || process.env.S3_BUCKET || process.env.BRAINY_S3_BUCKET)

    // Detect distributed storage capability
    capabilities.distributed = this.capabilities?.platform?.isContainer || this.capabilities?.environment === 'kubernetes'

    return capabilities
  }

  async buildIntelligentBrainyConfig() {
    const config = {}

    // Intelligent storage selection
    config.storage = await this.selectOptimalStorage()
    
    // Intelligent verb scoring - always enabled with adaptive parameters
    config.intelligentVerbScoring = {
      enabled: true,
      enableSemanticScoring: true,
      enableFrequencyAmplification: true,
      enableTemporalDecay: this.capabilities.runtime.isLongRunning,
      learningRate: this.capabilities.memory.isHighMemory ? 0.15 : 0.1,
      baseConfidence: 0.6,
      adaptiveParameters: true
    }

    // Adaptive caching based on environment
    config.cache = {
      autoTune: true,
      hotCacheMaxSize: this.calculateOptimalCacheSize(),
      adaptiveEviction: true,
      persistentCache: this.capabilities.storage.filesystem
    }

    // Real-time updates for persistent environments
    if (this.capabilities.runtime.isPersistent) {
      config.realtimeUpdates = {
        enabled: true,
        interval: this.capabilities.memory.isHighMemory ? 15000 : 30000,
        updateStatistics: true,
        updateIndex: true
      }
    }

    // Distributed mode for container/cloud environments
    if (this.capabilities.storage.distributed) {
      config.distributed = true
    }

    // Performance optimizations
    config.performance = {
      adaptiveBatching: true,
      intelligentIndexing: true,
      backgroundOptimization: this.capabilities.runtime.isLongRunning,
      workerThreads: this.capabilities.runtime.supportsWorkers
    }

    logger.debug('Built intelligent Brainy configuration', config)
    return config
  }

  async selectOptimalStorage() {
    // S3/Cloud storage for production cloud environments
    if (this.capabilities.storage.s3 && this.capabilities.environment !== 'development') {
      return {
        type: 's3',
        s3Storage: {
          bucketName: process.env.BRAINY_S3_BUCKET || process.env.S3_BUCKET || 'brainy-data',
          region: process.env.AWS_REGION || process.env.BRAINY_S3_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.BRAINY_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.BRAINY_S3_SECRET_ACCESS_KEY,
          endpoint: process.env.BRAINY_S3_ENDPOINT || process.env.S3_ENDPOINT
        }
      }
    }

    // Filesystem for persistent environments
    if (this.capabilities.storage.filesystem && this.capabilities.runtime.isPersistent) {
      const dataPath = process.env.BRAINY_DATA_PATH || './data'
      try {
        const fs = require('fs')
        if (!fs.existsSync(dataPath)) {
          fs.mkdirSync(dataPath, { recursive: true })
        }
        return { type: 'filesystem', path: dataPath }
      } catch {}
    }

    // Memory for serverless/temporary environments
    return { type: 'memory' }
  }

  calculateOptimalCacheSize() {
    const availableMemory = this.capabilities.memory.available
    
    if (availableMemory > 2000) return 100000  // High memory
    if (availableMemory > 1000) return 50000   // Medium memory
    if (availableMemory > 500) return 25000    // Low memory
    return 10000 // Very low memory
  }

  async addIntelligentAugmentations() {
    // Environment adapter - always first
    const envAdapter = new EnvironmentAdapterAugmentation(this.capabilities)
    await this.db.addAugmentation(envAdapter)
    logger.info('Added environment adapter augmentation')

    // Adaptive storage - optimizes storage usage
    const adaptiveStorage = new AdaptiveStorageAugmentation(this.capabilities)
    await this.db.addAugmentation(adaptiveStorage)
    logger.info('Added adaptive storage augmentation')

    // Auto-discovery - helps users understand their data
    const autoDiscovery = new AutoDiscoveryAugmentation()
    await this.db.addAugmentation(autoDiscovery)
    logger.info('Added auto-discovery augmentation')

    // Add transport augmentations based on capabilities and preferences
    await this.addTransportAugmentations()
  }

  async addTransportAugmentations() {
    const transports = this.determineOptimalTransports()
    
    for (const transport of transports) {
      try {
        switch (transport.type) {
          case 'webrtc':
            if (this.capabilities.network.supportsWebRTC && this.capabilities.network.supportsPeerToPeer) {
              const webrtc = new WebRTCAugmentation({ 
                port: transport.port,
                enableDataChannels: true,
                enablePeerDiscovery: true
              })
              await this.db.addAugmentation(webrtc)
              this.activeTransports.push('webrtc')
              logger.info(`WebRTC augmentation active on port ${transport.port}`)
            }
            break
            
          case 'websocket':
            if (this.capabilities.network.supportsWebSocket) {
              const websocket = new WebSocketAugmentation({ 
                port: transport.port,
                enableRealtime: true,
                enableBroadcast: true
              })
              await this.db.addAugmentation(websocket)
              this.activeTransports.push('websocket')
              logger.info(`WebSocket augmentation active on port ${transport.port}`)
            }
            break
            
          case 'http':
            const http = new HttpAugmentation({ 
              port: transport.port,
              enableCORS: true,
              enableCompression: true,
              minimal: true // Keep it lightweight
            })
            await this.db.addAugmentation(http)
            this.activeTransports.push('http')
            logger.info(`HTTP augmentation active on port ${transport.port}`)
            break
        }
      } catch (error) {
        logger.warn(`Failed to add ${transport.type} transport:`, error.message)
      }
    }
  }

  determineOptimalTransports() {
    const transports = []
    const basePort = this.capabilities.network.preferredPort
    
    // WebRTC for peer-to-peer capable environments (best performance)
    if (this.capabilities.network.supportsWebRTC && 
        this.capabilities.network.supportsPeerToPeer &&
        this.options.preferredTransports !== 'http') {
      transports.push({ type: 'webrtc', port: basePort + 2, priority: 1 })
    }
    
    // WebSocket for real-time environments (good performance)
    if (this.capabilities.network.supportsWebSocket &&
        this.capabilities.runtime.isPersistent &&
        this.options.preferredTransports !== 'http') {
      transports.push({ type: 'websocket', port: basePort + 1, priority: 2 })
    }
    
    // HTTP as fallback (universal compatibility)
    transports.push({ type: 'http', port: basePort, priority: 3 })
    
    return transports.sort((a, b) => a.priority - b.priority)
  }

  detectPreferredPort() {
    return parseInt(process.env.PORT || process.env.BRAINY_PORT || 3000)
  }

  isServerlessEnvironment() {
    return !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
  }

  isEdgeEnvironment() {
    return !!(process.env.VERCEL_REGION || process.env.CF_PAGES)
  }

  isContainerEnvironment() {
    try {
      const fs = require('fs')
      return fs.existsSync('/.dockerenv') || !!process.env.KUBERNETES_SERVICE_HOST
    } catch {
      return false
    }
  }

  isPrivateNetwork() {
    // Simple heuristic for private network detection
    return !!(process.env.KUBERNETES_SERVICE_HOST || process.env.DOCKER_CONTAINER)
  }

  // Public API
  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }
    return this.db
  }

  getCapabilities() {
    return this.capabilities
  }

  getActiveTransports() {
    return this.activeTransports
  }

  async shutdown() {
    if (this.db && this.db.cleanup) {
      await this.db.cleanup()
    }
    this.isInitialized = false
    logger.info('🔄 Brainy Service Template shutdown complete')
  }
}

// Factory function for easy usage
export const createBrainyService = async (options = {}) => {
  const service = new BrainyServiceTemplate(options)
  await service.initialize()
  return service
}

// Default export
export default BrainyServiceTemplate

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new BrainyServiceTemplate()
  
  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`)
    await service.shutdown()
    process.exit(0)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  
  try {
    await service.initialize()
    logger.info('🎉 Brainy Service Template is running! Use Ctrl+C to stop.')
  } catch (error) {
    logger.error('Failed to start:', error)
    process.exit(1)
  }
}