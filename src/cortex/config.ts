/**
 * Cortex Configuration Management
 * 
 * Handles encrypted configuration storage, environment loading,
 * and distributed coordination through Brainy.
 */

import { BrainyData } from '../brainyData.js'
import { StorageConfig } from '../coreTypes.js'
import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface CortexConfigData {
  version: number
  storage: StorageConfig
  encryption?: {
    enabled: boolean
    keyDerivation: 'pbkdf2' | 'scrypt'
    iterations?: number
  }
  coordination?: {
    enabled: boolean
    realtime: boolean
    pollInterval: number
  }
  environments?: {
    current: string
    available: string[]
  }
}

export interface EncryptedValue {
  encrypted: true
  algorithm: string
  iv: string
  authTag: string
  data: string
}

export class CortexConfig {
  private static instance: CortexConfig
  private brainy?: BrainyData
  private config?: CortexConfigData
  private configPath: string
  private masterKey?: Buffer

  private constructor() {
    this.configPath = path.join(process.cwd(), '.brainy', 'cortex.json')
  }

  static getInstance(): CortexConfig {
    if (!CortexConfig.instance) {
      CortexConfig.instance = new CortexConfig()
    }
    return CortexConfig.instance
  }

  /**
   * Initialize Cortex configuration
   */
  async init(options: Partial<CortexConfigData> = {}): Promise<void> {
    // Create .brainy directory if it doesn't exist
    const brainyDir = path.dirname(this.configPath)
    await fs.mkdir(brainyDir, { recursive: true })

    // Default configuration
    const defaultConfig: CortexConfigData = {
      version: 1,
      storage: options.storage || { type: 'memory' },
      encryption: {
        enabled: true,
        keyDerivation: 'pbkdf2',
        iterations: 100000
      },
      coordination: {
        enabled: true,
        realtime: false,
        pollInterval: 30000 // 30 seconds
      },
      environments: {
        current: process.env.NODE_ENV || 'development',
        available: ['development', 'staging', 'production']
      }
    }

    this.config = { ...defaultConfig, ...options }

    // Save configuration
    await this.saveConfig()

    // Initialize Brainy with the configuration
    await this.initBrainy()

    // Generate or load master key
    await this.initMasterKey()
  }

  /**
   * Load existing configuration
   */
  async load(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(configData)
      await this.initBrainy()
      await this.initMasterKey()
    } catch (error) {
      throw new Error(`No Cortex configuration found. Run 'cortex init' first.`)
    }
  }

  /**
   * Save configuration to disk
   */
  private async saveConfig(): Promise<void> {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      'utf-8'
    )
  }

  /**
   * Initialize Brainy instance
   */
  private async initBrainy(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not loaded')
    }

    this.brainy = new BrainyData({
      storage: this.config.storage,
      writeOnlyMode: false,
      enableMetadataIndexing: true
    })

    await this.brainy.init()
  }

  /**
   * Initialize or load master encryption key
   */
  private async initMasterKey(): Promise<void> {
    const keyPath = path.join(process.cwd(), '.brainy', 'cortex.key')

    // Try to load from environment first
    if (process.env.CORTEX_MASTER_KEY) {
      this.masterKey = Buffer.from(process.env.CORTEX_MASTER_KEY, 'base64')
      return
    }

    // Try to load from file
    try {
      const keyData = await fs.readFile(keyPath, 'utf-8')
      this.masterKey = Buffer.from(keyData, 'base64')
    } catch (error) {
      // Generate new key
      this.masterKey = crypto.randomBytes(32)
      await fs.writeFile(keyPath, this.masterKey.toString('base64'), 'utf-8')
      
      // Set restrictive permissions (Unix-like systems)
      try {
        await fs.chmod(keyPath, 0o600)
      } catch (e) {
        // Windows doesn't support chmod, ignore
      }

      console.log('🔐 Generated new master key at .brainy/cortex.key')
      console.log('⚠️  Keep this key safe! You\'ll need it to decrypt your configs.')
    }
  }

  /**
   * Get Brainy instance
   */
  getBrainy(): BrainyData {
    if (!this.brainy) {
      throw new Error('Brainy not initialized. Run load() first.')
    }
    return this.brainy
  }

  /**
   * Encrypt a value
   */
  encrypt(value: string): EncryptedValue {
    if (!this.masterKey) {
      throw new Error('Master key not initialized')
    }

    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, this.masterKey, iv)

    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted: true,
      algorithm,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    }
  }

  /**
   * Decrypt a value
   */
  decrypt(encryptedValue: EncryptedValue): string {
    if (!this.masterKey) {
      throw new Error('Master key not initialized')
    }

    const decipher = crypto.createDecipheriv(
      encryptedValue.algorithm,
      this.masterKey,
      Buffer.from(encryptedValue.iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(encryptedValue.authTag, 'hex'))

    let decrypted = decipher.update(encryptedValue.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Set a configuration value in Brainy
   */
  async set(key: string, value: any, options: { encrypt?: boolean } = {}): Promise<void> {
    if (!this.brainy) {
      await this.load()
    }

    const configKey = `_cortex/config/${key}`
    const configValue = options.encrypt && typeof value === 'string'
      ? this.encrypt(value)
      : value

    await this.brainy!.addNoun({
      id: configKey,
      type: 'cortex_config',
      metadata: {
        key,
        value: configValue,
        encrypted: options.encrypt || false,
        environment: this.config?.environments?.current,
        updatedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get a configuration value from Brainy
   */
  async get(key: string): Promise<any> {
    if (!this.brainy) {
      await this.load()
    }

    const configKey = `_cortex/config/${key}`
    
    try {
      const noun = await this.brainy!.getNoun(configKey)
      if (!noun?.metadata?.value) {
        return undefined
      }

      const value = noun.metadata.value
      
      // Decrypt if needed
      if (value.encrypted === true) {
        return this.decrypt(value as EncryptedValue)
      }

      return value
    } catch (error) {
      return undefined
    }
  }

  /**
   * List all configuration keys
   */
  async list(): Promise<Array<{ key: string, encrypted: boolean, environment: string }>> {
    if (!this.brainy) {
      await this.load()
    }

    const result = await this.brainy!.getNouns({
      filter: { type: 'cortex_config' },
      pagination: { limit: 1000 }
    })

    return result.items.map(noun => ({
      key: noun.metadata?.key || noun.id.replace('_cortex/config/', ''),
      encrypted: noun.metadata?.encrypted || false,
      environment: noun.metadata?.environment || 'default'
    }))
  }

  /**
   * Load all configurations as environment variables
   */
  async loadEnvironment(): Promise<Record<string, string>> {
    if (!this.brainy) {
      await this.load()
    }

    const configs = await this.brainy!.getNouns({
      filter: { 
        type: 'cortex_config',
        'metadata.environment': this.config?.environments?.current
      },
      pagination: { limit: 1000 }
    })

    const env: Record<string, string> = {}

    for (const config of configs.items) {
      const key = config.metadata?.key || config.id.replace('_cortex/config/', '')
      let value = config.metadata?.value

      // Decrypt if needed
      if (value?.encrypted === true) {
        value = this.decrypt(value as EncryptedValue)
      }

      // Convert to string if needed
      if (typeof value !== 'string') {
        value = JSON.stringify(value)
      }

      // Use the key as-is (could be nested like 'database.url')
      // Or convert to UPPER_SNAKE_CASE
      const envKey = key.toUpperCase().replace(/\./g, '_').replace(/-/g, '_')
      env[envKey] = value
    }

    return env
  }

  /**
   * Import configuration from .env file
   */
  async importEnv(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      // Skip comments and empty lines
      if (!line.trim() || line.startsWith('#')) {
        continue
      }

      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=').trim()

      if (key && value) {
        // Detect if it looks like a secret
        const isSecret = key.includes('KEY') || 
                        key.includes('SECRET') || 
                        key.includes('PASSWORD') ||
                        key.includes('TOKEN')

        await this.set(key.trim(), value, { encrypt: isSecret })
      }
    }
  }

  /**
   * Get storage configuration
   */
  getStorageConfig(): StorageConfig | undefined {
    return this.config?.storage
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): string {
    return this.config?.environments?.current || 'development'
  }

  /**
   * Switch environment
   */
  async switchEnvironment(environment: string): Promise<void> {
    if (!this.config) {
      await this.load()
    }

    if (!this.config!.environments?.available.includes(environment)) {
      throw new Error(`Unknown environment: ${environment}`)
    }

    this.config!.environments!.current = environment
    await this.saveConfig()
  }
}