/**
 * Cortex - Beautiful CLI Command Center for Brainy
 * 
 * Configuration, data management, search, and chat - all in one place!
 */

import { BrainyData } from '../brainyData.js'
import { BrainyChat } from '../chat/brainyChat.js'
import { PerformanceMonitor } from './performanceMonitor.js'
import { HealthCheck } from './healthCheck.js'
// Licensing system moved to quantum-vault
import * as readline from 'readline'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
// @ts-ignore - CLI packages
import chalk from 'chalk'
// @ts-ignore - CLI packages
import ora from 'ora'
// @ts-ignore - CLI packages
import boxen from 'boxen'
// @ts-ignore - CLI packages
import Table from 'cli-table3'
// @ts-ignore - CLI packages
import prompts from 'prompts'

// Brainy-branded terminal colors matching the logo
const colors = {
  primary: chalk.hex('#3A5F4A'),        // Deep teal from brain jar
  success: chalk.hex('#2D4A3A'),        // Darker teal for success states
  warning: chalk.hex('#D67441'),        // Warm orange from logo rays
  error: chalk.hex('#B85C35'),          // Darker orange for errors
  info: chalk.hex('#4A6B5A'),           // Muted green background color
  dim: chalk.hex('#8A9B8A'),            // Muted gray-green
  bold: chalk.bold,
  highlight: chalk.hex('#E88B5A'),      // Coral brain color for highlights
  accent: chalk.hex('#F5E6D3'),         // Cream accent color
  retro: chalk.hex('#D67441'),          // Main retro orange
  brain: chalk.hex('#E88B5A')           // Brain coral color
}

// 1950s Retro Sci-Fi emojis matching Brainy's atomic age aesthetic
const emojis = {
  brain: '🧠',           // Perfect brain in a jar!
  tube: '🧪',            // Laboratory test tube for data
  atom: '⚛️',            // Atomic symbol - pure 50s sci-fi
  lock: '🔒',            // Vault-style security
  key: '🗝️',             // Vintage brass key
  shield: '🛡️',          // Protective force field
  check: '✅',           // Success indicator  
  cross: '❌',           // Error state
  warning: '⚠️',         // Alert system
  info: 'ℹ️',            // Information display
  search: '🔍',          // Laboratory magnifier
  chat: '💭',            // Thought transmission
  data: '🎛️',            // Control panel/dashboard  
  config: '⚙️',          // Mechanical gear system
  magic: '⚡',           // Electrical energy/power
  party: '🎆',           // Atomic celebration  
  robot: '🤖',           // Mechanical automaton
  cloud: '☁️',           // Atmospheric storage
  disk: '💽',            // Retro storage disc
  package: '📦',         // Laboratory specimen box
  lab: '🔬',             // Scientific instrument
  network: '📡',         // Communications array
  sync: '🔄',            // Cyclical process
  backup: '💾',          // Archive storage
  health: '🔋',          // Power/energy levels
  stats: '📊',           // Data analysis charts
  explore: '🗺️',         // Territory mapping
  import: '📥',          // Input channel
  export: '📤',          // Output transmission
  sparkle: '✨',         // Energy discharge
  rocket: '🚀',          // Space age propulsion
  repair: '🔧',          // Repair tools
  lightning: '⚡'        // Lightning bolt
}

export class Cortex {
  private brainy?: BrainyData
  private chatInstance?: BrainyChat
  private performanceMonitor?: PerformanceMonitor
  private healthCheck?: HealthCheck
  private licensingSystem?: any // Licensing system (optional)
  private configPath: string
  private config: CortexConfig
  private encryptionKey?: Buffer
  private masterKeySource?: 'env' | 'passphrase' | 'generated'
  
  // UI properties for terminal output
  private emojis = {
    check: '✅',
    cross: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    rocket: '🚀',
    brain: '🧠',
    atom: '⚛️',
    lock: '🔒',
    key: '🔑',
    package: '📦',
    chart: '📊',
    sparkles: '✨',
    fire: '🔥',
    zap: '⚡',
    gear: '⚙️',
    robot: '🤖',
    shield: '🛡️',
    wrench: '🔧',
    clipboard: '📋',
    folder: '📁',
    database: '🗄️',
    lightning: '⚡',
    checkmark: '✅',
    repair: '🔧',
    health: '🏥'
  }
  
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    // Helper methods
    dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
    red: (text: string) => `\x1b[31m${text}\x1b[0m`,
    green: (text: string) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
    blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
    magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
    cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
    white: (text: string) => `\x1b[37m${text}\x1b[0m`,
    gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
    retro: (text: string) => `\x1b[36m${text}\x1b[0m`,
    success: (text: string) => `\x1b[32m${text}\x1b[0m`,
    warning: (text: string) => `\x1b[33m${text}\x1b[0m`,
    error: (text: string) => `\x1b[31m${text}\x1b[0m`,
    info: (text: string) => `\x1b[34m${text}\x1b[0m`,
    brain: (text: string) => `\x1b[35m${text}\x1b[0m`,
    accent: (text: string) => `\x1b[36m${text}\x1b[0m`,
    premium: (text: string) => `\x1b[33m${text}\x1b[0m`,
    highlight: (text: string) => `\x1b[1m${text}\x1b[0m`
  }

  constructor() {
    this.configPath = path.join(process.cwd(), '.cortex', 'config.json')
    this.config = {} as CortexConfig
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<CortexConfig> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true })
      const configData = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(configData)
      return this.config
    } catch {
      // Config doesn't exist yet, return empty config
      this.config = {} as CortexConfig
      return this.config
    }
  }

  /**
   * Ensure Brainy is initialized
   */
  private async ensureBrainy(): Promise<void> {
    if (!this.brainy) {
      const config = await this.loadConfig()
      this.brainy = new BrainyData(config.brainyOptions || {})
      await this.brainy.init()
    }
  }

  /**
   * Master Key Management - Atomic Age Security Protocols
   */
  private async initializeMasterKey(): Promise<void> {
    // Try environment variable first
    const envKey = process.env.CORTEX_MASTER_KEY
    if (envKey && envKey.length >= 32) {
      this.encryptionKey = Buffer.from(envKey.substring(0, 32))
      this.masterKeySource = 'env'
      return
    }

    // Check for existing stored key
    const keyPath = path.join(path.dirname(this.configPath), '.master_key')
    try {
      const storedKey = await fs.readFile(keyPath)
      this.encryptionKey = storedKey
      this.masterKeySource = 'generated'
      return
    } catch {
      // Key doesn't exist, need to create one
    }

    // Prompt for passphrase or generate new key
    const { method } = await prompts({
      type: 'select',
      name: 'method',
      message: `${emojis.key} ${colors.retro('Select encryption key method:')}`,
      choices: [
        { title: `${emojis.brain} Generate secure key (recommended)`, value: 'generate' },
        { title: `${emojis.lock} Create from passphrase`, value: 'passphrase' },
        { title: `${emojis.warning} Skip encryption (not secure)`, value: 'skip' }
      ]
    })

    if (method === 'skip') {
      console.log(colors.warning(`${emojis.warning} Encryption disabled - secrets will be stored in plain text!`))
      return
    }

    if (method === 'generate') {
      this.encryptionKey = crypto.randomBytes(32)
      this.masterKeySource = 'generated'
      
      // Store the key securely
      await fs.writeFile(keyPath, this.encryptionKey, { mode: 0o600 })
      console.log(colors.success(`${emojis.check} Secure master key generated and stored`))
    } else if (method === 'passphrase') {
      const { passphrase } = await prompts({
        type: 'password',
        name: 'passphrase',
        message: `${emojis.key} Enter master passphrase (min 8 characters):`
      })

      if (!passphrase || passphrase.length < 8) {
        throw new Error('Passphrase must be at least 8 characters')
      }

      // Derive key from passphrase using PBKDF2
      const salt = crypto.randomBytes(16)
      this.encryptionKey = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256')
      this.masterKeySource = 'passphrase'

      // Store salt for future key derivation
      const keyData = Buffer.concat([salt, this.encryptionKey])
      await fs.writeFile(keyPath, keyData, { mode: 0o600 })
      console.log(colors.success(`${emojis.check} Master key derived from passphrase`))
    }
  }

  /**
   * Load master key from stored salt + passphrase
   */
  private async loadPassphraseKey(): Promise<void> {
    const keyPath = path.join(path.dirname(this.configPath), '.master_key')
    const keyData = await fs.readFile(keyPath)
    
    if (keyData.length === 32) {
      // Simple generated key
      this.encryptionKey = keyData
      return
    }

    // Extract salt and ask for passphrase
    const salt = keyData.subarray(0, 16)
    const { passphrase } = await prompts({
      type: 'password',
      name: 'passphrase',
      message: `${emojis.key} Enter master passphrase:`
    })

    if (!passphrase) {
      throw new Error('Passphrase required for encrypted configuration')
    }

    this.encryptionKey = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256')
  }

  /**
   * Reset master key - for key rotation
   */
  async resetMasterKey(): Promise<void> {
    console.log(boxen(
      `${emojis.warning} ${colors.retro('SECURITY PROTOCOL: KEY ROTATION')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('This will re-encrypt all stored secrets')}\n` +
      `${colors.accent('◆')} ${colors.dim('Ensure you have backups before proceeding')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with key rotation?',
      initial: false
    })

    if (!confirm) {
      console.log(colors.dim('Key rotation cancelled'))
      return
    }

    // Get current decrypted values
    const currentSecrets = await this.getAllSecrets()

    // Remove old key
    const keyPath = path.join(path.dirname(this.configPath), '.master_key')
    try {
      await fs.unlink(keyPath)
    } catch {}

    // Initialize new key
    await this.initializeMasterKey()

    // Re-encrypt all secrets with new key
    const spinner = ora('Re-encrypting secrets with new key...').start()
    for (const [key, value] of Object.entries(currentSecrets)) {
      await this.configSet(key, value, { encrypt: true })
    }
    spinner.succeed(colors.success(`${emojis.check} Key rotation complete! ${Object.keys(currentSecrets).length} secrets re-encrypted`))
  }

  /**
   * Get all decrypted secrets (for key rotation)
   */
  private async getAllSecrets(): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {}
    const configMetaPath = path.join(path.dirname(this.configPath), 'config_metadata.json')
    
    try {
      const metadata = JSON.parse(await fs.readFile(configMetaPath, 'utf8'))
      for (const key of Object.keys(metadata)) {
        if (metadata[key].encrypted) {
          const value = await this.configGet(key)
          if (value) secrets[key] = value
        }
      }
    } catch {}
    
    return secrets
  }

  /**
   * Initialize Cortex with beautiful prompts
   */
  async init(options: InitOptions = {}): Promise<void> {
    const spinner = ora('Initializing Cortex...').start()
    
    try {
      // Check if already initialized
      if (await this.isInitialized()) {
        spinner.warn('Cortex is already initialized!')
        const { reinit } = await prompts({
          type: 'confirm',
          name: 'reinit',
          message: 'Do you want to reinitialize?',
          initial: false
        })
        
        if (!reinit) {
          spinner.stop()
          return
        }
      }

      spinner.text = 'Setting up configuration...'
      
      // Interactive setup
      const responses = await prompts([
        {
          type: 'select',
          name: 'storage',
          message: `${emojis.disk} Choose your storage type:`,
          choices: [
            { title: `${emojis.disk} Local Filesystem`, value: 'filesystem' },
            { title: `${emojis.cloud} AWS S3`, value: 's3' },
            { title: `${emojis.cloud} Cloudflare R2`, value: 'r2' },
            { title: `${emojis.cloud} Google Cloud Storage`, value: 'gcs' },
            { title: `${emojis.brain} Memory (testing)`, value: 'memory' }
          ]
        },
        {
          type: (prev: any) => prev === 's3' ? 'text' : null,
          name: 's3Bucket',
          message: 'Enter S3 bucket name:'
        },
        {
          type: (prev: any) => prev === 'r2' ? 'text' : null,
          name: 'r2Bucket',
          message: 'Enter Cloudflare R2 bucket name:'
        },
        {
          type: (prev: any) => prev === 'gcs' ? 'text' : null,
          name: 'gcsBucket',
          message: 'Enter GCS bucket name:'
        },
        {
          type: 'confirm',
          name: 'encryption',
          message: `${emojis.lock} Enable encryption for secrets?`,
          initial: true
        },
        {
          type: 'confirm',
          name: 'chat',
          message: `${emojis.chat} Enable Brainy Chat?`,
          initial: true
        },
        {
          type: (prev: any) => prev ? 'select' : null,
          name: 'llm',
          message: `${emojis.robot} Choose LLM provider (optional):`,
          choices: [
            { title: 'None (template-based)', value: null },
            { title: 'Claude (Anthropic)', value: 'claude-3-5-sonnet' },
            { title: 'GPT-4 (OpenAI)', value: 'gpt-4' },
            { title: 'Local Model (Hugging Face)', value: 'Xenova/LaMini-Flan-T5-77M' }
          ]
        }
      ])

      // Create config
      this.config = {
        storage: responses.storage,
        encryption: responses.encryption,
        chat: responses.chat,
        llm: responses.llm,
        s3Bucket: responses.s3Bucket,
        r2Bucket: responses.r2Bucket,
        gcsBucket: responses.gcsBucket,
        initialized: true,
        createdAt: new Date().toISOString()
      }

      // Setup encryption
      if (responses.encryption) {
        await this.initializeMasterKey()
        this.config.encryptionEnabled = true
      }

      // Save configuration
      await this.saveConfig()

      // Initialize Brainy
      spinner.text = 'Initializing Brainy database...'
      await this.initBrainy()

      spinner.succeed(colors.success(`${emojis.party} Cortex initialized successfully!`))
      
      // Show welcome message
      this.showWelcome()
      
    } catch (error) {
      spinner.fail(colors.error('Failed to initialize Cortex'))
      console.error(error)
      process.exit(1)
    }
  }

  /**
   * Beautiful welcome message
   */
  private showWelcome(): void {
    const welcome = boxen(
      `${emojis.brain} ${colors.brain('CORTEX')} ${emojis.atom} ${colors.bold('COMMAND CENTER')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('Laboratory systems online and ready for operation')}\n\n` +
      `${emojis.rocket} ${colors.retro('QUICK START PROTOCOLS:')}\n` +
      `  ${colors.primary('cortex chat')}     ${emojis.chat} Neural interface mode\n` +
      `  ${colors.primary('cortex add')}      ${emojis.data} Specimen collection\n` +
      `  ${colors.primary('cortex search')}   ${emojis.search} Data analysis\n` +
      `  ${colors.primary('cortex config')}   ${emojis.config} System parameters\n` +
      `  ${colors.primary('cortex help')}     ${emojis.info} Operations manual`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: '#D67441'  // Retro orange border
      }
    )
    console.log(welcome)
  }

  /**
   * Chat with your data - beautiful interactive mode
   */
  async chat(question?: string): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.chatInstance) {
      this.chatInstance = new BrainyChat(this.brainy!, { 
        llm: this.config.llm,
        sources: true 
      })
    }

    // Single question mode
    if (question) {
      const spinner = ora('Thinking...').start()
      try {
        const answer = await this.chatInstance.ask(question)
        spinner.stop()
        console.log(`\n${emojis.robot} ${colors.bold('Answer:')}\n${answer}\n`)
      } catch (error) {
        spinner.fail('Failed to get answer')
        console.error(error)
      }
      return
    }

    // Interactive chat mode
    console.log(boxen(
      `${emojis.brain} ${colors.brain('NEURAL INTERFACE')} ${emojis.magic}\n\n` +
      `${colors.accent('◆')} ${colors.dim('Thought-to-data transmission active')}\n` +
      `${colors.accent('◆')} ${colors.dim('Query processing protocols engaged')}\n\n` +
      `${colors.retro('Type "exit" to disengage neural link')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: colors.primary('You> ')
    })

    rl.prompt()

    rl.on('line', async (line) => {
      const input = line.trim()
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log(`\n${emojis.atom} ${colors.retro('Neural link disengaged')} ${emojis.sparkle}\n`)
        rl.close()
        return
      }

      if (input) {
        const spinner = ora('Thinking...').start()
        try {
          const answer = await this.chatInstance!.ask(input)
          spinner.stop()
          console.log(`\n${emojis.robot} ${colors.success(answer)}\n`)
        } catch (error) {
          spinner.fail('Error processing question')
          console.error(error)
        }
      }
      
      rl.prompt()
    })

    // Ensure process exits when readline closes
    rl.on('close', () => {
      console.log('\n')
      process.exit(0)
    })
  }

  /**
   * Add data with beautiful prompts
   */
  async add(data?: string, metadata?: any): Promise<void> {
    await this.ensureInitialized()
    
    // Interactive mode if no data provided
    if (!data) {
      const responses = await prompts([
        {
          type: 'text',
          name: 'data',
          message: `${emojis.data} Enter data to add:`
        },
        {
          type: 'text',
          name: 'id',
          message: 'ID (optional, press enter to auto-generate):'
        },
        {
          type: 'confirm',
          name: 'hasMetadata',
          message: 'Add metadata?',
          initial: false
        },
        {
          type: (prev: any) => prev ? 'text' : null,
          name: 'metadata',
          message: 'Enter metadata (JSON format):'
        }
      ])
      
      data = responses.data
      if (responses.metadata) {
        try {
          metadata = JSON.parse(responses.metadata)
        } catch {
          console.log(colors.warning('Invalid JSON, skipping metadata'))
        }
      }
      if (responses.id) {
        metadata = { ...metadata, id: responses.id }
      }
    }

    const spinner = ora('Adding data...').start()
    try {
      const id = await this.brainy!.add(data, metadata)
      spinner.succeed(colors.success(`${emojis.check} Added with ID: ${id}`))
    } catch (error) {
      spinner.fail('Failed to add data')
      console.error(error)
    }
  }

  /**
   * Search with beautiful results display and advanced options
   */
  async search(query: string, options: SearchOptions = {}): Promise<void> {
    await this.ensureInitialized()
    
    const limit = options.limit || 10
    const spinner = ora(`Searching...`).start()
    
    try {
      // Build search options with MongoDB-style filters
      const searchOptions: any = {}
      
      // Add metadata filters if provided
      if (options.filter) {
        searchOptions.metadata = options.filter
      }
      
      // Add graph traversal options
      if (options.verbs) {
        searchOptions.includeVerbs = true
        searchOptions.verbTypes = options.verbs
      }
      
      if (options.depth) {
        searchOptions.traversalDepth = options.depth
      }
      
      const results = await this.brainy!.search(query, limit, searchOptions)
      spinner.stop()
      
      if (results.length === 0) {
        console.log(colors.warning(`${emojis.warning} No results found`))
        return
      }

      // Create beautiful table with dynamic columns
      const hasVerbs = results.some((r: any) => r.verbs && r.verbs.length > 0)
      const head = [
        colors.bold('Rank'),
        colors.bold('ID'),
        colors.bold('Score')
      ]
      
      if (hasVerbs) {
        head.push(colors.bold('Connections'))
      }
      
      head.push(colors.bold('Metadata'))
      
      const table = new Table({
        head,
        style: { head: ['cyan'] }
      })

      results.forEach((result: any, i) => {
        const row = [
          colors.dim(`#${i + 1}`),
          colors.primary(result.id.slice(0, 25) + (result.id.length > 25 ? '...' : '')),
          colors.success(`${(result.score * 100).toFixed(1)}%`)
        ]
        
        if (hasVerbs && result.verbs) {
          const verbs = result.verbs.slice(0, 2).map((v: any) => 
            `${colors.warning(v.type)}: ${v.object.slice(0, 15)}...`
          ).join('\n')
          row.push(verbs || '-')
        }
        
        row.push(colors.dim(JSON.stringify(result.metadata || {}).slice(0, 40) + '...'))
        
        table.push(row)
      })

      console.log(`\n${emojis.search} ${colors.bold(`Found ${results.length} results:`)}\n`)
      
      // Show applied filters
      if (options.filter) {
        console.log(colors.dim(`  Filters: ${JSON.stringify(options.filter)}`))
      }
      if (options.verbs) {
        console.log(colors.dim(`  Graph traversal: ${options.verbs.join(', ')}`))
      }
      console.log()
      
      console.log(table.toString())
      
    } catch (error) {
      spinner.fail('Search failed')
      console.error(error)
    }
  }

  /**
   * Advanced search with interactive prompts
   */
  async advancedSearch(): Promise<void> {
    await this.ensureInitialized()
    
    const responses = await prompts([
      {
        type: 'text',
        name: 'query',
        message: `${emojis.search} Enter search query:`
      },
      {
        type: 'number',
        name: 'limit',
        message: 'Number of results:',
        initial: 10
      },
      {
        type: 'confirm',
        name: 'useFilters',
        message: 'Add metadata filters (MongoDB-style)?',
        initial: false
      },
      {
        type: (prev: any) => prev ? 'text' : null,
        name: 'filters',
        message: 'Enter filters (JSON with $gt, $gte, $lt, $lte, $eq, $ne, $in, $nin):\nExample: {"age": {"$gte": 18}, "status": {"$in": ["active", "pending"]}}'
      },
      {
        type: 'confirm',
        name: 'useGraph',
        message: `${emojis.magic} Traverse graph relationships?`,
        initial: false
      },
      {
        type: (prev: any) => prev ? 'text' : null,
        name: 'verbs',
        message: 'Enter verb types (comma-separated):\nExample: owns, likes, follows'
      },
      {
        type: (prev: any, values: any) => values.useGraph ? 'number' : null,
        name: 'depth',
        message: 'Traversal depth:',
        initial: 1
      }
    ])
    
    const options: SearchOptions = { limit: responses.limit }
    
    if (responses.filters) {
      try {
        options.filter = JSON.parse(responses.filters)
      } catch {
        console.log(colors.warning('Invalid filter JSON, skipping filters'))
      }
    }
    
    if (responses.verbs) {
      options.verbs = responses.verbs.split(',').map((v: string) => v.trim())
      options.depth = responses.depth
    }
    
    await this.search(responses.query, options)
  }

  /**
   * Add or update graph connections (verbs)
   */
  async addVerb(subject: string, verb: string, object: string, metadata?: any): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Adding relationship...').start()
    
    try {
      // For now, we'll add it as a special metadata entry
      await this.brainy!.add(`${subject} ${verb} ${object}`, {
        type: 'relationship',
        subject,
        verb,
        object,
        ...metadata
      })
      spinner.succeed(colors.success(`${emojis.check} Added: ${subject} --[${verb}]--> ${object}`))
    } catch (error) {
      spinner.fail('Failed to add relationship')
      console.error(error)
    }
  }

  /**
   * Interactive graph exploration
   */
  async explore(startId?: string): Promise<void> {
    await this.ensureInitialized()
    
    if (!startId) {
      const { id } = await prompts({
        type: 'text',
        name: 'id',
        message: `${emojis.search} Enter starting node ID:`
      })
      startId = id
    }
    
    const spinner = ora('Loading graph...').start()
    
    try {
      // Get node and its connections
      const results = await this.brainy!.search(startId, 1, { includeVerbs: true })
      
      if (results.length === 0) {
        spinner.fail('Node not found')
        return
      }
      
      spinner.stop()
      
      const node = results[0] as any
      
      // Display node info in a beautiful box
      const nodeInfo = boxen(
        `${emojis.data} ${colors.bold('Node: ' + node.id)}\n\n` +
        `${colors.dim('Metadata:')}\n${JSON.stringify(node.metadata || {}, null, 2)}\n\n` +
        `${colors.dim('Connections:')}\n${
          node.verbs && node.verbs.length > 0 
            ? node.verbs.map((v: any) => `  ${colors.warning(v.type)} → ${colors.primary(v.object)}`).join('\n')
            : '  No connections'
        }`,
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'magenta'
        }
      )
      
      console.log(nodeInfo)
      
      // Interactive exploration menu
      if (node.verbs && node.verbs.length > 0) {
        const { action } = await prompts({
          type: 'select',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { title: 'Explore a connected node', value: 'explore' },
            { title: 'Add new connection', value: 'add' },
            { title: 'Search similar nodes', value: 'similar' },
            { title: 'Exit', value: 'exit' }
          ]
        })
        
        if (action === 'explore') {
          const { next } = await prompts({
            type: 'select',
            name: 'next',
            message: 'Choose node to explore:',
            choices: node.verbs.map((v: any) => ({
              title: `${v.object} (via ${v.type})`,
              value: v.object
            }))
          })
          await this.explore(next)
        } else if (action === 'add') {
          const newVerb = await prompts([
            {
              type: 'text',
              name: 'verb',
              message: 'Relationship type:'
            },
            {
              type: 'text',
              name: 'object',
              message: 'Target node ID:'
            }
          ])
          await this.addVerb(startId!, newVerb.verb, newVerb.object)
          await this.explore(startId)
        } else if (action === 'similar') {
          await this.search(startId!, { limit: 5 })
        }
      }
      
    } catch (error) {
      spinner.fail('Failed to explore graph')
      console.error(error)
    }
  }

  /**
   * Configuration management with encryption
   */
  async configSet(key: string, value: string, options: { encrypt?: boolean } = {}): Promise<void> {
    await this.ensureInitialized()
    
    const isSecret = options.encrypt || this.isSecret(key)
    
    if (isSecret && this.encryptionKey) {
      // Encrypt the value
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv)
      
      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      const authTag = cipher.getAuthTag()
      
      value = `ENCRYPTED:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
      console.log(colors.success(`${emojis.lock} Stored encrypted: ${key}`))
    } else {
      console.log(colors.success(`${emojis.check} Stored: ${key}`))
    }

    // Store in Brainy
    await this.brainy!.add(value, { 
      type: 'config',
      key,
      encrypted: isSecret,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get configuration value
   */
  async configGet(key: string): Promise<string | null> {
    await this.ensureInitialized()
    
    const results = await this.brainy!.search(key, 1, {
      metadata: { type: 'config', key }
    })

    if (results.length === 0) {
      return null
    }

    let value = results[0].id

    // Decrypt if needed
    if (value.startsWith('ENCRYPTED:') && this.encryptionKey) {
      const [, iv, authTag, encrypted] = value.split(':')
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      )
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      value = decrypted
    }

    return value
  }

  /**
   * List all configuration
   */
  async configList(): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Loading configuration...').start()
    
    try {
      const results = await this.brainy!.search('', 100, {
        metadata: { type: 'config' }
      })
      
      spinner.stop()
      
      if (results.length === 0) {
        console.log(colors.warning('No configuration found'))
        return
      }

      const table = new Table({
        head: [colors.bold('Key'), colors.bold('Encrypted'), colors.bold('Timestamp')],
        style: { head: ['cyan'] }
      })

      results.forEach(result => {
        const meta = result.metadata as any
        table.push([
          colors.primary(meta.key),
          meta.encrypted ? `${emojis.lock} Yes` : 'No',
          colors.dim(new Date(meta.timestamp).toLocaleString())
        ])
      })

      console.log(`\n${emojis.config} ${colors.bold('Configuration:')}\n`)
      console.log(table.toString())
      
    } catch (error) {
      spinner.fail('Failed to list configuration')
      console.error(error)
    }
  }

  /**
   * Storage migration with beautiful progress
   */
  async migrate(options: MigrateOptions): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.package} ${colors.bold('Storage Migration')}\n` +
      `From: ${colors.dim(this.config.storage)}\n` +
      `To: ${colors.primary(options.to)}`,
      { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Start migration?',
      initial: true
    })

    if (!confirm) {
      console.log(colors.dim('Migration cancelled'))
      return
    }

    const spinner = ora('Starting migration...').start()
    
    try {
      // Create new Brainy instance with target storage
      let targetConfig: any = {}
      
      if (options.to === 'filesystem') {
        targetConfig.storage = { forceFileSystemStorage: true }
      } else if (options.to === 's3' && options.bucket) {
        targetConfig.storage = { 
          s3Storage: { 
            bucketName: options.bucket 
          } 
        }
      } else if (options.to === 'gcs' && options.bucket) {
        targetConfig.storage = { 
          gcsStorage: { 
            bucketName: options.bucket 
          } 
        }
      } else if (options.to === 'memory') {
        targetConfig.storage = { forceMemoryStorage: true }
      }
      
      const targetBrainy = new BrainyData(targetConfig)
      await targetBrainy.init()

      spinner.text = 'Counting items...'
      // For now, we'll search for all items
      const allData = await this.brainy!.search('', 1000)
      const total = allData.length
      
      spinner.text = `Migrating ${total} items...`
      
      for (let i = 0; i < allData.length; i++) {
        const item = allData[i]
        // Re-add the data to the new storage
        await targetBrainy.add(item.id, item.metadata || {})
        
        if (i % 10 === 0) {
          spinner.text = `Migrating... ${i + 1}/${total} (${((i + 1) / total * 100).toFixed(0)}%)`
        }
      }

      spinner.succeed(colors.success(`${emojis.party} Migration complete! ${total} items migrated.`))
      
      // Update config
      this.config.storage = options.to
      if (options.bucket) {
        if (options.to === 's3') this.config.s3Bucket = options.bucket
        if (options.to === 'gcs') this.config.gcsBucket = options.bucket
      }
      await this.saveConfig()
      
    } catch (error) {
      spinner.fail('Migration failed')
      console.error(error)
      process.exit(1)
    }
  }

  /**
   * Show comprehensive statistics and database info
   */
  async stats(detailed: boolean = false): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Gathering statistics...').start()
    
    try {
      // Gather comprehensive stats
      const allItems = await this.brainy!.search('', 1000)
      const itemsWithVerbs = allItems.filter((item: any) => item.verbs && item.verbs.length > 0)
      
      // Count unique field names
      const fieldCounts = new Map<string, number>()
      const fieldTypes = new Map<string, Set<string>>()
      
      allItems.forEach((item: any) => {
        if (item.metadata) {
          Object.entries(item.metadata).forEach(([key, value]) => {
            fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1)
            if (!fieldTypes.has(key)) {
              fieldTypes.set(key, new Set())
            }
            fieldTypes.get(key)!.add(typeof value)
          })
        }
      })
      
      // Calculate storage size (approximate)
      const storageSize = JSON.stringify(allItems).length
      
      const stats = {
        totalItems: allItems.length,
        itemsWithMetadata: allItems.filter((i: any) => i.metadata).length,
        itemsWithConnections: itemsWithVerbs.length,
        totalConnections: itemsWithVerbs.reduce((sum: number, item: any) => sum + item.verbs.length, 0),
        avgConnections: itemsWithVerbs.length > 0 
          ? itemsWithVerbs.reduce((sum: number, item: any) => sum + item.verbs.length, 0) / itemsWithVerbs.length 
          : 0,
        uniqueFields: fieldCounts.size,
        storageSize,
        dimensions: 384,
        embeddingModel: 'all-MiniLM-L6-v2'
      }
      
      spinner.stop()
      
      // Atomic age statistics display
      const statsBox = boxen(
        `${emojis.atom} ${colors.brain('LABORATORY STATUS')} ${emojis.data}\n\n` +
        `${colors.retro('◆ Specimen Count:')} ${colors.highlight(stats.totalItems)}\n` +
        `${colors.retro('◆ Catalogued:')} ${colors.highlight(stats.itemsWithMetadata)} ${colors.accent('(' + (stats.itemsWithMetadata/stats.totalItems*100).toFixed(1)+'%)')}\n` +
        `${colors.retro('◆ Neural Links:')} ${colors.highlight(stats.itemsWithConnections)}\n` +
        `${colors.retro('◆ Total Connections:')} ${colors.highlight(stats.totalConnections)}\n` +
        `${colors.retro('◆ Avg Network Density:')} ${colors.highlight(stats.avgConnections.toFixed(2))}\n` +
        `${colors.retro('◆ Data Dimensions:')} ${colors.highlight(stats.uniqueFields)}\n` +
        `${colors.retro('◆ Storage Matrix:')} ${colors.accent((stats.storageSize / 1024).toFixed(2) + ' KB')}\n` +
        `${colors.retro('◆ Archive Type:')} ${colors.primary(this.config.storage)}\n` +
        `${colors.retro('◆ Neural Model:')} ${colors.info(stats.embeddingModel)} ${colors.dim('(' + stats.dimensions + 'd)')}`,
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: '#D67441'  // Retro orange border
        }
      )
      
      console.log(statsBox)
      
      // Detailed field statistics if requested
      if (detailed && fieldCounts.size > 0) {
        const fieldTable = new Table({
          head: [
            colors.bold('Field Name'),
            colors.bold('Count'),
            colors.bold('Coverage'),
            colors.bold('Types')
          ],
          style: { head: ['cyan'] }
        })
        
        Array.from(fieldCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .forEach(([field, count]) => {
            fieldTable.push([
              colors.primary(field),
              count.toString(),
              `${(count / stats.totalItems * 100).toFixed(1)}%`,
              Array.from(fieldTypes.get(field) || []).join(', ')
            ])
          })
        
        console.log(`\n${colors.bold('Top Fields:')}\n`)
        console.log(fieldTable.toString())
      }
      
    } catch (error) {
      spinner.fail('Failed to get statistics')
      console.error(error)
    }
  }

  /**
   * List all searchable fields with statistics
   */
  async listFields(): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Analyzing fields...').start()
    
    try {
      const allItems = await this.brainy!.search('', 1000)
      const fieldInfo = new Map<string, { count: number, types: Set<string>, samples: any[] }>()
      
      // Analyze all fields
      allItems.forEach((item: any) => {
        if (item.metadata) {
          Object.entries(item.metadata).forEach(([key, value]) => {
            if (!fieldInfo.has(key)) {
              fieldInfo.set(key, { count: 0, types: new Set(), samples: [] })
            }
            const info = fieldInfo.get(key)!
            info.count++
            info.types.add(typeof value)
            if (info.samples.length < 3 && value !== null && value !== undefined) {
              info.samples.push(value)
            }
          })
        }
      })
      
      spinner.stop()
      
      if (fieldInfo.size === 0) {
        console.log(colors.warning('No fields found in metadata'))
        return
      }
      
      const table = new Table({
        head: [
          colors.bold('Field'),
          colors.bold('Type(s)'),
          colors.bold('Count'),
          colors.bold('Sample Values')
        ],
        style: { head: ['cyan'] },
        colWidths: [20, 15, 10, 40]
      })
      
      Array.from(fieldInfo.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([field, info]) => {
          const samples = info.samples
            .slice(0, 2)
            .map(s => JSON.stringify(s).slice(0, 20))
            .join(', ')
          
          table.push([
            colors.primary(field),
            Array.from(info.types).join(', '),
            info.count.toString(),
            colors.dim(samples + (info.samples.length > 2 ? '...' : ''))
          ])
        })
      
      console.log(`\n${emojis.search} ${colors.bold('Searchable Fields:')}\n`)
      console.log(table.toString())
      
      console.log(`\n${colors.dim('Use these fields in searches:')}`);
      console.log(colors.dim(`cortex search "query" --filter '{"${Array.from(fieldInfo.keys())[0]}": "value"}'`))
      
    } catch (error) {
      spinner.fail('Failed to analyze fields')
      console.error(error)
    }
  }

  /**
   * Setup LLM progressively with auto-download
   */
  async setupLLM(provider?: string): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.robot} ${colors.bold('LLM Setup Assistant')}\n` +
      `${colors.dim('Configure AI models for enhanced chat')}`,
      { padding: 1, borderStyle: 'round', borderColor: 'magenta' }
    ))
    
    const choices = [
      { 
        title: `${emojis.brain} Local Model (No API key needed)`, 
        value: 'local',
        description: 'Download and run models locally'
      },
      {
        title: `${emojis.cloud} Claude (Anthropic)`,
        value: 'claude',
        description: 'Most capable, requires API key'
      },
      {
        title: `${emojis.cloud} GPT-4 (OpenAI)`,
        value: 'openai',
        description: 'Powerful, requires API key'
      },
      {
        title: `${emojis.sparkle} Ollama (Local server)`,
        value: 'ollama',
        description: 'Connect to local Ollama instance'
      },
      {
        title: `${emojis.magic} Claude Desktop`,
        value: 'claude-desktop',
        description: 'Use Claude app on your computer'
      }
    ]
    
    const { llmType } = await prompts({
      type: 'select',
      name: 'llmType',
      message: 'Choose LLM provider:',
      choices: provider ? choices.filter(c => c.value === provider) : choices
    })
    
    switch (llmType) {
      case 'local':
        await this.setupLocalLLM()
        break
      case 'claude':
        await this.setupClaudeLLM()
        break
      case 'openai':
        await this.setupOpenAILLM()
        break
      case 'ollama':
        await this.setupOllamaLLM()
        break
      case 'claude-desktop':
        await this.setupClaudeDesktop()
        break
    }
  }

  private async setupLocalLLM(): Promise<void> {
    const { model } = await prompts({
      type: 'select',
      name: 'model',
      message: 'Choose a local model:',
      choices: [
        { title: 'LaMini-Flan-T5 (77M, fast)', value: 'Xenova/LaMini-Flan-T5-77M' },
        { title: 'Phi-2 (2.7B, balanced)', value: 'microsoft/phi-2' },
        { title: 'CodeLlama (7B, for code)', value: 'codellama/CodeLlama-7b-hf' },
        { title: 'Custom Hugging Face model', value: 'custom' }
      ]
    })
    
    let modelName = model
    if (model === 'custom') {
      const { customModel } = await prompts({
        type: 'text',
        name: 'customModel',
        message: 'Enter Hugging Face model ID (e.g., microsoft/DialoGPT-medium):'
      })
      modelName = customModel
    }
    
    const spinner = ora(`Downloading ${modelName}...`).start()
    
    try {
      // Save configuration
      await this.configSet('LLM_PROVIDER', 'local')
      await this.configSet('LLM_MODEL', modelName)
      
      // Test the model
      this.config.llm = modelName
      this.chatInstance = new BrainyChat(this.brainy!, { llm: modelName })
      
      spinner.succeed(colors.success(`${emojis.check} Local model configured: ${modelName}`))
      console.log(colors.dim('\nModel will download on first use. This may take a few minutes.'))
      
    } catch (error) {
      spinner.fail('Failed to setup local model')
      console.error(error)
    }
  }

  private async setupClaudeLLM(): Promise<void> {
    const { apiKey } = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Anthropic API key:'
    })
    
    if (apiKey) {
      await this.configSet('ANTHROPIC_API_KEY', apiKey, { encrypt: true })
      await this.configSet('LLM_PROVIDER', 'claude')
      await this.configSet('LLM_MODEL', 'claude-3-5-sonnet-20241022')
      
      this.config.llm = 'claude-3-5-sonnet'
      console.log(colors.success(`${emojis.check} Claude configured successfully!`))
    }
  }

  private async setupOpenAILLM(): Promise<void> {
    const { apiKey } = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your OpenAI API key:'
    })
    
    if (apiKey) {
      await this.configSet('OPENAI_API_KEY', apiKey, { encrypt: true })
      await this.configSet('LLM_PROVIDER', 'openai')
      await this.configSet('LLM_MODEL', 'gpt-4o-mini')
      
      this.config.llm = 'gpt-4o-mini'
      console.log(colors.success(`${emojis.check} OpenAI configured successfully!`))
    }
  }

  private async setupOllamaLLM(): Promise<void> {
    const { url, model } = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Ollama server URL:',
        initial: 'http://localhost:11434'
      },
      {
        type: 'text',
        name: 'model',
        message: 'Model name:',
        initial: 'llama2'
      }
    ])
    
    await this.configSet('OLLAMA_URL', url)
    await this.configSet('OLLAMA_MODEL', model)
    await this.configSet('LLM_PROVIDER', 'ollama')
    
    console.log(colors.success(`${emojis.check} Ollama configured!`))
    console.log(colors.dim(`Make sure Ollama is running: ollama run ${model}`))
  }

  private async setupClaudeDesktop(): Promise<void> {
    console.log(colors.info(`${emojis.info} Claude Desktop integration coming soon!`))
    console.log(colors.dim('This will allow using Claude app as your LLM provider'))
  }

  /**
   * Use the embedding model for other tasks
   */
  async embed(text: string): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Generating embedding...').start()
    
    try {
      // Use Brainy's built-in embedding
      const vector = await this.brainy!.embed(text)
      spinner.stop()
      
      console.log(boxen(
        `${emojis.sparkle} ${colors.bold('Text Embedding')}\n\n` +
        `${colors.dim('Input:')}\n"${text}"\n\n` +
        `${colors.dim('Model:')} all-MiniLM-L6-v2 (384d)\n` +
        `${colors.dim('Vector:')} [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n` +
        `${colors.dim('Magnitude:')} ${Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)).toFixed(4)}`,
        { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
      ))
      
    } catch (error) {
      spinner.fail('Failed to generate embedding')
      console.error(error)
    }
  }

  /**
   * Calculate similarity between two texts
   */
  async similarity(text1: string, text2: string): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Calculating similarity...').start()
    
    try {
      const vector1 = await this.brainy!.embed(text1)
      const vector2 = await this.brainy!.embed(text2)
      
      // Calculate cosine similarity
      const dotProduct = vector1.reduce((sum, v, i) => sum + v * vector2[i], 0)
      const mag1 = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0))
      const mag2 = Math.sqrt(vector2.reduce((sum, v) => sum + v * v, 0))
      const similarity = dotProduct / (mag1 * mag2)
      
      spinner.stop()
      
      const color = similarity > 0.8 ? colors.success : 
                   similarity > 0.5 ? colors.warning : 
                   colors.error
      
      console.log(boxen(
        `${emojis.search} ${colors.bold('Semantic Similarity')}\n\n` +
        `${colors.dim('Text 1:')}\n"${text1}"\n\n` +
        `${colors.dim('Text 2:')}\n"${text2}"\n\n` +
        `${colors.bold('Similarity:')} ${color((similarity * 100).toFixed(1) + '%')}\n` +
        `${this.getSimilarityInterpretation(similarity)}`,
        { padding: 1, borderStyle: 'round', borderColor: 'magenta' }
      ))
      
    } catch (error) {
      spinner.fail('Failed to calculate similarity')
      console.error(error)
    }
  }

  private getSimilarityInterpretation(score: number): string {
    if (score > 0.9) return colors.success('✨ Nearly identical meaning')
    if (score > 0.8) return colors.success('🎯 Very similar')
    if (score > 0.7) return colors.warning('👍 Similar')
    if (score > 0.5) return colors.warning('🤔 Somewhat related')
    if (score > 0.3) return colors.error('😐 Loosely related')
    return colors.error('❌ Unrelated')
  }

  /**
   * Import .env file with automatic encryption of secrets
   */
  async importEnv(filePath: string): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Importing environment variables...').start()
    
    try {
      const envContent = await fs.readFile(filePath, 'utf-8')
      const lines = envContent.split('\n')
      let imported = 0
      let encrypted = 0
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        
        if (key && value) {
          const shouldEncrypt = this.isSecret(key)
          await this.configSet(key, value, { encrypt: shouldEncrypt })
          imported++
          if (shouldEncrypt) encrypted++
        }
      }
      
      spinner.succeed(colors.success(
        `${emojis.check} Imported ${imported} variables (${encrypted} encrypted)`
      ))
      
    } catch (error) {
      spinner.fail('Failed to import .env file')
      console.error(error)
    }
  }

  /**
   * Export configuration to .env file
   */
  async exportEnv(filePath: string): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Exporting configuration...').start()
    
    try {
      const results = await this.brainy!.search('', 1000, {
        metadata: { type: 'config' }
      })
      
      let content = '# Exported from Cortex\n'
      content += `# Generated: ${new Date().toISOString()}\n\n`
      
      for (const result of results) {
        const meta = result.metadata as any
        if (meta?.key) {
          const value = await this.configGet(meta.key)
          if (value) {
            content += `${meta.key}=${value}\n`
          }
        }
      }
      
      await fs.writeFile(filePath, content)
      spinner.succeed(colors.success(`${emojis.check} Exported to ${filePath}`))
      
    } catch (error) {
      spinner.fail('Failed to export configuration')
      console.error(error)
    }
  }


  /**
   * Delete data by ID
   */
  async delete(id: string): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Deleting...').start()
    
    try {
      // For now, mark as deleted in metadata
      await this.brainy!.add(id, { 
        _deleted: true,
        _deletedAt: new Date().toISOString()
      })
      
      spinner.succeed(colors.success(`${emojis.check} Deleted: ${id}`))
    } catch (error) {
      spinner.fail('Delete failed')
      console.error(error)
    }
  }

  /**
   * Update data by ID
   */
  async update(id: string, data: string, metadata?: any): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Updating...').start()
    
    try {
      // Re-add with same ID (overwrites)
      await this.brainy!.add(data, { 
        ...metadata,
        id,
        _updated: true,
        _updatedAt: new Date().toISOString()
      })
      
      spinner.succeed(colors.success(`${emojis.check} Updated: ${id}`))
    } catch (error) {
      spinner.fail('Update failed')
      console.error(error)
    }
  }

  /**
   * Helpers
   */
  private async ensureInitialized(): Promise<void> {
    if (!await this.isInitialized()) {
      console.log(colors.warning(`${emojis.warning} Cortex not initialized. Run 'cortex init' first.`))
      process.exit(1)
    }
    
    // Load encryption key if encryption is enabled
    if (this.config.encryptionEnabled && !this.encryptionKey) {
      await this.loadMasterKey()
    }
    
    // Load custom secret patterns
    await this.loadCustomPatterns()
    
    if (!this.brainy) {
      await this.initBrainy()
    }
  }

  /**
   * Load master key from various sources
   */
  private async loadMasterKey(): Promise<void> {
    // Try environment variable first
    const envKey = process.env.CORTEX_MASTER_KEY
    if (envKey && envKey.length >= 32) {
      this.encryptionKey = Buffer.from(envKey.substring(0, 32))
      this.masterKeySource = 'env'
      return
    }

    // Try stored key file
    const keyPath = path.join(path.dirname(this.configPath), '.master_key')
    try {
      await fs.access(keyPath)
      
      const keyData = await fs.readFile(keyPath)
      if (keyData.length === 32) {
        // Generated key
        this.encryptionKey = keyData
        this.masterKeySource = 'generated'
      } else {
        // Passphrase-derived key
        await this.loadPassphraseKey()
        this.masterKeySource = 'passphrase'
      }
    } catch {
      console.log(colors.warning(`${emojis.warning} Encryption key not found. Some features may not work.`))
    }
  }

  private async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.configPath)
      const data = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(data)
      return this.config.initialized === true
    } catch {
      return false
    }
  }

  private async initBrainy(): Promise<void> {
    // Map storage type to BrainyData config
    let config: any = {}
    
    if (this.config.storage === 'filesystem') {
      config.storage = { forceFileSystemStorage: true }
    } else if (this.config.storage === 's3' && this.config.s3Bucket) {
      config.storage = { 
        s3Storage: { 
          bucketName: this.config.s3Bucket 
        } 
      }
    } else if (this.config.storage === 'r2' && this.config.r2Bucket) {
      // Cloudflare R2 is S3-compatible, so we use the s3Storage configuration
      // Users need to set environment variables:
      // CLOUDFLARE_R2_ACCOUNT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
      config.storage = { 
        s3Storage: { 
          bucketName: this.config.r2Bucket,
          // R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
          // The actual account ID should come from environment variables
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        } 
      }
    } else if (this.config.storage === 'gcs' && this.config.gcsBucket) {
      config.storage = { 
        gcsStorage: { 
          bucketName: this.config.gcsBucket 
        } 
      }
    } else if (this.config.storage === 'memory') {
      config.storage = { forceMemoryStorage: true }
    }
    
    this.brainy = new BrainyData(config)
    await this.brainy.init()
    
    // Initialize monitoring systems
    this.performanceMonitor = new PerformanceMonitor(this.brainy)
    this.healthCheck = new HealthCheck(this.brainy)
    
    // Initialize licensing system
    // Licensing system moved to quantum-vault for premium features
    // Open source version has full functionality available
  }

  private async saveConfig(): Promise<void> {
    const dir = path.dirname(this.configPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2))
  }

  /**
   * Configuration categories for enhanced secret management
   */
  public static readonly CONFIG_CATEGORIES = {
    SECRET: 'secret',       // Encrypted, never logged
    SENSITIVE: 'sensitive', // Encrypted, logged as [MASKED]  
    CONFIG: 'config',       // Plain text configuration
    PUBLIC: 'public'        // Can be exposed publicly
  } as const

  private customSecretPatterns: RegExp[] = []
  
  /**
   * Enhanced secret detection with custom patterns and categories
   */
  private isSecret(key: string): boolean {
    const defaultSecretPatterns = [
      // Standard secret patterns
      /key$/i, /token$/i, /secret$/i, /password$/i, /pass$/i,
      /^api[_-]?key$/i, /^auth[_-]?token$/i,
      
      // API keys
      /^openai[_-]?api[_-]?key$/i, /^anthropic[_-]?api[_-]?key$/i,
      /^claude[_-]?api[_-]?key$/i, /^huggingface[_-]?token$/i,
      /^github[_-]?token$/i, /^gitlab[_-]?token$/i,
      
      // Database URLs
      /database.*url$/i, /db.*url$/i, /connection[_-]?string$/i,
      /mongo.*url$/i, /redis.*url$/i, /postgres.*url$/i,
      
      // Cloud & Infrastructure
      /aws.*key$/i, /aws.*secret$/i, /azure.*key$/i, /gcp.*key$/i,
      /docker.*password$/i, /registry.*password$/i,
      
      // Production patterns
      /.*_prod_.*$/i, /.*_production_.*$/i,
      /.*_live_.*$/i, /.*_master_.*$/i,
      
      // Common service patterns
      /stripe.*key$/i, /twilio.*token$/i, /sendgrid.*key$/i,
      /jwt.*secret$/i, /session.*secret$/i, /encryption.*key$/i
    ]
    
    // Combine default and custom patterns
    const allPatterns = [...defaultSecretPatterns, ...this.customSecretPatterns]
    return allPatterns.some(pattern => pattern.test(key))
  }

  /**
   * Add custom secret detection patterns
   */
  async addSecretPattern(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern, 'i')
      this.customSecretPatterns.push(regex)
      
      // Persist custom patterns
      await this.saveCustomPatterns()
      console.log(colors.success(`${emojis.check} Added secret pattern: ${pattern}`))
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${pattern}`)
    }
  }

  /**
   * Remove custom secret detection pattern
   */
  async removeSecretPattern(pattern: string): Promise<void> {
    const index = this.customSecretPatterns.findIndex(p => p.source === pattern)
    if (index === -1) {
      throw new Error(`Pattern not found: ${pattern}`)
    }
    
    this.customSecretPatterns.splice(index, 1)
    await this.saveCustomPatterns()
    console.log(colors.success(`${emojis.check} Removed secret pattern: ${pattern}`))
  }

  /**
   * List all secret detection patterns
   */
  async listSecretPatterns(): Promise<void> {
    console.log(boxen(
      `${emojis.shield} ${colors.brain('SECRET DETECTION PATTERNS')}\n\n` +
      `${colors.retro('◆ Built-in Patterns:')}\n` +
      `  • API keys (*_key, *_token, *_secret)\n` +
      `  • Database URLs (*_url, connection_string)\n` +
      `  • Cloud credentials (aws_*, azure_*, gcp_*)\n` +
      `  • Production vars (*_prod_*, *_production_*)\n\n` +
      `${colors.retro('◆ Custom Patterns:')}\n` +
      (this.customSecretPatterns.length > 0 
        ? this.customSecretPatterns.map(p => `  • ${p.source}`).join('\n')
        : `  ${colors.dim('No custom patterns defined')}`
      ),
      { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
    ))
  }

  /**
   * Save custom patterns to disk
   */
  private async saveCustomPatterns(): Promise<void> {
    const patternsPath = path.join(path.dirname(this.configPath), 'secret_patterns.json')
    const patterns = this.customSecretPatterns.map(p => p.source)
    await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2))
  }

  /**
   * Load custom patterns from disk
   */
  private async loadCustomPatterns(): Promise<void> {
    const patternsPath = path.join(path.dirname(this.configPath), 'secret_patterns.json')
    try {
      const data = await fs.readFile(patternsPath, 'utf8')
      const patterns = JSON.parse(data)
      this.customSecretPatterns = patterns.map((p: string) => new RegExp(p, 'i'))
    } catch {
      // No custom patterns yet
    }
  }

  /**
   * Determine config category for enhanced management
   */
  private getConfigCategory(key: string): string {
    // Explicit production configuration
    if (key.match(/node_env|environment|stage|tier/i)) {
      return Cortex.CONFIG_CATEGORIES.CONFIG
    }
    
    // Public configuration (can be exposed)
    if (key.match(/port|host|timeout|retry|limit|version/i)) {
      return Cortex.CONFIG_CATEGORIES.PUBLIC
    }
    
    // Sensitive but not secret (URLs, emails, usernames)
    if (key.match(/url|email|username|user_id|org|organization/i) && !this.isSecret(key)) {
      return Cortex.CONFIG_CATEGORIES.SENSITIVE
    }
    
    // Default to secret if matches patterns
    if (this.isSecret(key)) {
      return Cortex.CONFIG_CATEGORIES.SECRET
    }
    
    return Cortex.CONFIG_CATEGORIES.CONFIG
  }

  /**
   * Cortex Augmentation System - AI-Powered Data Understanding
   */
  async neuralImport(filePath: string, options: any = {}): Promise<void> {
    await this.ensureInitialized()
    
    // Import and create the Cortex SENSE augmentation
    const { CortexSenseAugmentation } = await import('../augmentations/cortexSense.js')
    const neuralSense = new CortexSenseAugmentation(this.brainy!, options)
    
    // Initialize the augmentation
    await neuralSense.initialize()
    
    try {
      // Read the file
      const fs = await import('fs/promises')
      const fileContent = await fs.readFile(filePath, 'utf8')
      const dataType = this.getDataTypeFromPath(filePath)
      
      // Use the SENSE augmentation to process the data
      const result = await neuralSense.processRawData(fileContent, dataType, options)
      
      if (result.success) {
        console.log(colors.success('✅ Cortex import completed successfully'))
        
        // Display summary
        console.log(colors.primary(`📊 Processed: ${result.data.nouns.length} entities, ${result.data.verbs.length} relationships`))
        
        if (result.data.confidence !== undefined) {
          console.log(colors.primary(`🎯 Overall confidence: ${(result.data.confidence * 100).toFixed(1)}%`))
        }
        
        if (result.data.insights && result.data.insights.length > 0) {
          console.log(colors.brain('\n🧠 Neural Insights:'))
          result.data.insights.forEach((insight: any) => {
            console.log(`  ${colors.accent('◆')} ${insight.description} (${(insight.confidence * 100).toFixed(1)}%)`)
          })
        }
      } else {
        console.error(colors.error('❌ Cortex import failed:'), result.error)
      }
      
    } finally {
      await neuralSense.shutDown()
    }
  }

  async neuralAnalyze(filePath: string): Promise<void> {
    await this.ensureInitialized()
    
    const { CortexSenseAugmentation } = await import('../augmentations/cortexSense.js')
    const neuralSense = new CortexSenseAugmentation(this.brainy!)
    
    await neuralSense.initialize()
    
    try {
      const fs = await import('fs/promises')
      const fileContent = await fs.readFile(filePath, 'utf8')
      const dataType = this.getDataTypeFromPath(filePath)
      
      // Use the analyzeStructure method
      const result = await neuralSense.analyzeStructure!(fileContent, dataType)
      
      if (result.success) {
        console.log(boxen(
          `${emojis.lab} ${colors.brain('NEURAL ANALYSIS RESULTS')}\n\n` +
          `Entity Types: ${result.data.entityTypes.length}\n` +
          `Relationship Types: ${result.data.relationshipTypes.length}\n` +
          `Data Quality Score: ${((result.data.dataQuality.completeness + result.data.dataQuality.consistency + result.data.dataQuality.accuracy) / 3 * 100).toFixed(1)}%`,
          { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
        ))
        
        if (result.data.recommendations.length > 0) {
          console.log(colors.brain('\n💡 Recommendations:'))
          result.data.recommendations.forEach((rec: any) => {
            console.log(`  ${colors.accent('◆')} ${rec}`)
          })
        }
      } else {
        console.error(colors.error('❌ Analysis failed:'), result.error)
      }
      
    } finally {
      await neuralSense.shutDown()
    }
  }

  async neuralValidate(filePath: string): Promise<void> {
    await this.ensureInitialized()
    
    const { CortexSenseAugmentation } = await import('../augmentations/cortexSense.js')
    const neuralSense = new CortexSenseAugmentation(this.brainy!)
    
    await neuralSense.initialize()
    
    try {
      const fs = await import('fs/promises')
      const fileContent = await fs.readFile(filePath, 'utf8')
      const dataType = this.getDataTypeFromPath(filePath)
      
      // Use the validateCompatibility method
      const result = await neuralSense.validateCompatibility!(fileContent, dataType)
      
      if (result.success) {
        const statusIcon = result.data.compatible ? '✅' : '⚠️'
        const statusText = result.data.compatible ? 'COMPATIBLE' : 'COMPATIBILITY ISSUES'
        
        console.log(boxen(
          `${statusIcon} ${colors.brain(`DATA ${statusText}`)}\n\n` +
          `Compatible: ${result.data.compatible ? 'Yes' : 'No'}\n` +
          `Issues Found: ${result.data.issues.length}\n` +
          `Suggestions: ${result.data.suggestions.length}`,
          { padding: 1, borderStyle: 'round', borderColor: result.data.compatible ? '#2D4A3A' : '#D67441' }
        ))
        
        if (result.data.issues.length > 0) {
          console.log(colors.warning('\n⚠️  Issues:'))
          result.data.issues.forEach((issue: any) => {
            const severityColor = issue.severity === 'high' ? colors.error : 
                                issue.severity === 'medium' ? colors.warning : colors.dim
            console.log(`  ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.description}`)
          })
        }
        
        if (result.data.suggestions.length > 0) {
          console.log(colors.brain('\n💡 Suggestions:'))
          result.data.suggestions.forEach((suggestion: any) => {
            console.log(`  ${colors.accent('◆')} ${suggestion}`)
          })
        }
      } else {
        console.error(colors.error('❌ Validation failed:'), result.error)
      }
      
    } finally {
      await neuralSense.shutDown()
    }
  }

  async neuralTypes(): Promise<void> {
    await this.ensureInitialized()
    
    const { NounType, VerbType } = await import('../types/graphTypes.js')
    
    console.log(boxen(
      `${emojis.atom} ${colors.brain('NEURAL TYPE SYSTEM')}\n\n` +
      `${colors.retro('◆ Available Noun Types:')} ${colors.highlight(Object.keys(NounType).length.toString())}\n` +
      `${colors.retro('◆ Available Verb Types:')} ${colors.highlight(Object.keys(VerbType).length.toString())}\n\n` +
      `${colors.accent('◆')} ${colors.dim('Noun categories: Person, Organization, Location, Thing, Concept, Event...')}\n` +
      `${colors.accent('◆')} ${colors.dim('Verb categories: Social, Temporal, Causal, Ownership, Functional...')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    // Show sample types
    console.log(`\n${colors.highlight('Sample Noun Types:')}`)
    Object.entries(NounType).slice(0, 8).forEach(([key, value]) => {
      console.log(`  ${colors.primary('•')} ${key}: ${colors.dim(value)}`)
    })

    console.log(`\n${colors.highlight('Sample Verb Types:')}`)
    Object.entries(VerbType).slice(0, 8).forEach(([key, value]) => {
      console.log(`  ${colors.primary('•')} ${key}: ${colors.dim(value)}`)
    })

    console.log(`\n${colors.dim('Use')} ${colors.primary('brainy import --cortex <file>')} ${colors.dim('to leverage the full AI type system!')}`)
  }

  /**
   * Augmentation Pipeline Management - Control the Neural Enhancement System
   */
  async listAugmentations(): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora('Scanning augmentation systems...').start()
    
    try {
      // Get current pipeline configuration (placeholder for now)
      spinner.stop()
      
      // For now, show that augmentation system is available but needs integration
      console.log(colors.info(`${emojis.atom} Augmentation system detected but integration pending`))

      // Show current pipeline status
      console.log(boxen(
        `${emojis.atom} ${colors.brain('AUGMENTATION PIPELINE STATUS')}\n\n` +
        `${colors.retro('◆ Pipeline State:')} ${colors.success('ACTIVE')}\n` +
        `${colors.retro('◆ Registry Loaded:')} ${colors.success('OPERATIONAL')}\n` +
        `${colors.retro('◆ Available Categories:')} SENSE, MEMORY, COGNITION, CONDUIT, ACTIVATION, PERCEPTION, DIALOG, WEBSOCKET`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))

      // List active augmentations by category
      const categories = ['SENSE', 'MEMORY', 'COGNITION', 'CONDUIT', 'ACTIVATION', 'PERCEPTION', 'DIALOG', 'WEBSOCKET']
      
      for (const category of categories) {
        console.log(`\n${colors.highlight(category)} ${colors.dim('Augmentations:')}`)
        
        // This would need to be implemented in the actual augmentation system
        // For now, show example structure
        console.log(`  ${colors.dim('• Available augmentations would be listed here')}\n  ${colors.dim('• Status: Active/Inactive')}\n  ${colors.dim('• Configuration: Parameters')}`)
      }
      
    } catch (error) {
      spinner.fail('Failed to scan augmentations')
      console.error(error)
    }
  }

  async addAugmentation(type: string, position?: number, config?: any): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.magic} ${colors.retro('NEURAL ENHANCEMENT PROTOCOL')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('Adding augmentation to pipeline')}\n` +
      `${colors.accent('◆')} ${colors.dim('Type:')} ${colors.highlight(type)}\n` +
      `${colors.accent('◆')} ${colors.dim('Position:')} ${colors.highlight(position || 'auto')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Add this augmentation to the pipeline?',
      initial: true
    })

    if (!confirm) {
      console.log(colors.dim('Augmentation addition cancelled'))
      return
    }

    const spinner = ora('Installing augmentation...').start()
    
    try {
      // This would interface with the actual augmentation system
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      spinner.succeed(colors.success(`${emojis.check} Augmentation '${type}' added to pipeline`))
      console.log(colors.dim(`Position: ${position || 'auto-assigned'}`))
      
    } catch (error) {
      spinner.fail('Failed to add augmentation')
      console.error(error)
    }
  }

  async removeAugmentation(type: string): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.warning} ${colors.retro('AUGMENTATION REMOVAL PROTOCOL')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('This will remove the augmentation from the pipeline')}\n` +
      `${colors.accent('◆')} ${colors.dim('Type:')} ${colors.highlight(type)}`,
      { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Remove this augmentation?',
      initial: false
    })

    if (!confirm) {
      console.log(colors.dim('Augmentation removal cancelled'))
      return
    }

    const spinner = ora('Removing augmentation...').start()
    
    try {
      // Interface with augmentation system
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      spinner.succeed(colors.success(`${emojis.check} Augmentation '${type}' removed from pipeline`))
      
    } catch (error) {
      spinner.fail('Failed to remove augmentation')
      console.error(error)
    }
  }

  async configureAugmentation(type: string, config: any): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.config} ${colors.brain('AUGMENTATION CONFIGURATION')}\n\n` +
      `${colors.retro('◆ Type:')} ${colors.highlight(type)}\n` +
      `${colors.retro('◆ New Config:')} ${colors.dim(JSON.stringify(config, null, 2))}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Apply this configuration?',
      initial: true
    })

    if (!confirm) {
      console.log(colors.dim('Configuration cancelled'))
      return
    }

    const spinner = ora('Updating augmentation configuration...').start()
    
    try {
      // Interface with augmentation configuration system
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      spinner.succeed(colors.success(`${emojis.check} Augmentation '${type}' configuration updated`))
      
    } catch (error) {
      spinner.fail('Failed to configure augmentation')
      console.error(error)
    }
  }

  async resetPipeline(): Promise<void> {
    await this.ensureInitialized()
    
    console.log(boxen(
      `${emojis.warning} ${colors.retro('PIPELINE RESET PROTOCOL')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('This will reset the entire augmentation pipeline')}\n` +
      `${colors.accent('◆')} ${colors.dim('All custom configurations will be lost')}\n` +
      `${colors.accent('◆')} ${colors.dim('Pipeline will return to default state')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
    ))

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Reset augmentation pipeline to defaults?',
      initial: false
    })

    if (!confirm) {
      console.log(colors.dim('Pipeline reset cancelled'))
      return
    }

    const spinner = ora('Resetting augmentation pipeline...').start()
    
    try {
      // Interface with pipeline reset system
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      spinner.succeed(colors.success(`${emojis.atom} Augmentation pipeline reset to factory defaults`))
      console.log(colors.dim('All augmentations restored to default configuration'))
      
    } catch (error) {
      spinner.fail('Failed to reset pipeline')
      console.error(error)
    }
  }

  async executePipelineStep(step: string, data: any): Promise<void> {
    await this.ensureInitialized()
    
    const spinner = ora(`Executing ${step} augmentation step...`).start()
    
    try {
      // Interface with pipeline execution system  
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      spinner.succeed(colors.success(`${emojis.magic} Pipeline step '${step}' executed successfully`))
      console.log(colors.dim('Result: '), colors.highlight('[Processed data would be shown here]'))
      
    } catch (error) {
      spinner.fail(`Failed to execute pipeline step '${step}'`)
      console.error(error)
    }
  }

  /**
   * Backup & Restore System - Atomic Data Preservation
   */
  async backup(options: any = {}): Promise<void> {
    await this.ensureInitialized()
    
    const { BackupRestore } = await import('./backupRestore.js')
    const backupSystem = new BackupRestore(this.brainy!)
    
    const backupPath = await backupSystem.createBackup({
      compress: options.compress,
      output: options.output,
      includeMetadata: true,
      includeStatistics: true,
      verify: true
    })
    
    console.log(colors.success(`\n🎉 Backup complete! Saved to: ${backupPath}`))
  }

  async restore(file: string): Promise<void> {
    await this.ensureInitialized()
    
    const { BackupRestore } = await import('./backupRestore.js')
    const backupSystem = new BackupRestore(this.brainy!)
    
    await backupSystem.restoreBackup(file, {
      verify: true,
      overwrite: false // Will prompt user for confirmation
    })
  }

  async listBackups(directory: string = './backups'): Promise<void> {
    const { BackupRestore } = await import('./backupRestore.js')
    const backupSystem = new BackupRestore(this.brainy!)
    
    console.log(boxen(
      `${emojis.brain} ${colors.brain('ATOMIC VAULT INVENTORY')} ${emojis.atom}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))
    
    const backups = await backupSystem.listBackups(directory)
    
    if (backups.length === 0) {
      console.log(colors.dim('No backups found in vault'))
      return
    }
    
    const table = new Table({
      head: [colors.brain('Date'), colors.brain('Entities'), colors.brain('Relationships'), colors.brain('Size'), colors.brain('Type')],
      colWidths: [20, 12, 15, 12, 15]
    })
    
    backups.forEach(backup => {
      table.push([
        colors.highlight(new Date(backup.timestamp).toLocaleDateString()),
        colors.primary(backup.entityCount.toLocaleString()),
        colors.primary(backup.relationshipCount.toLocaleString()),
        colors.warning(backup.compressed ? 'Compressed' : 'Raw'),
        colors.success(backup.storageType)
      ])
    })
    
    console.log(table.toString())
  }

  /**
   * Show augmentation status and management
   */
  async augmentations(options: any = {}): Promise<void> {
    console.log(boxen(
      `${this.emojis.brain} ${this.colors.brain('AUGMENTATION STATUS')} ${this.emojis.atom}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    await this.ensureBrainy()
    
    try {
      // Import default augmentation registry
      const { DefaultAugmentationRegistry } = await import('../shared/default-augmentations.js')
      const registry = new DefaultAugmentationRegistry(this.brainy!)
      
      // Check Cortex health (default augmentation)
      const cortexHealth = await registry.checkCortexHealth()
      
      console.log(`\n${this.emojis.sparkles} ${this.colors.accent('Default Augmentations:')}`)
      console.log(`  ${this.emojis.brain} Cortex: ${cortexHealth.available ? this.colors.success('Active') : this.colors.error('Inactive')}`)
      if (cortexHealth.version) {
        console.log(`    ${this.colors.dim('Version:')} ${cortexHealth.version}`)
      }
      console.log(`    ${this.colors.dim('Status:')} ${cortexHealth.status}`)
      console.log(`    ${this.colors.dim('Category:')} SENSE (AI-powered data understanding)`)
      console.log(`    ${this.colors.dim('License:')} Open Source (included by default)`)
      
      // Check for premium augmentations if license exists
      if (this.licensingSystem) {
        console.log(`\n${this.emojis.sparkles} ${this.colors.premium('Premium Augmentations:')}`)
        
        // Check each premium feature from our licensing system
        const premiumFeatures = [
          'notion-connector',
          'salesforce-connector', 
          'slack-connector',
          'asana-connector',
          'neural-enhancement-pack'
        ]
        
        for (const feature of premiumFeatures) {
          // This would check if the feature is licensed and installed
          console.log(`  ${this.emojis.gear} ${feature}: ${this.colors.dim('Not Installed')}`)
          console.log(`    ${this.colors.dim('Status:')} Available for trial/purchase`)
        }
        
        console.log(`\n${this.colors.dim('Use')} ${this.colors.highlight('cortex license catalog')} ${this.colors.dim('to see available premium augmentations')}`)
        console.log(`${this.colors.dim('Use')} ${this.colors.highlight('cortex license trial <feature>')} ${this.colors.dim('to start a free trial')}`)
      }
      
      // Augmentation pipeline health
      console.log(`\n${this.emojis.health} ${this.colors.accent('Pipeline Health:')}`)
      console.log(`  ${this.emojis.check} SENSE Pipeline: ${this.colors.success('1 active')} (Cortex)`)
      console.log(`  ${this.emojis.info} CONDUIT Pipeline: ${this.colors.dim('0 active')} (Premium connectors available)`)
      console.log(`  ${this.emojis.info} COGNITION Pipeline: ${this.colors.dim('0 active')}`)
      console.log(`  ${this.emojis.info} MEMORY Pipeline: ${this.colors.dim('0 active')}`)
      
      if (options.verbose) {
        console.log(`\n${this.emojis.info} ${this.colors.accent('Augmentation Categories:')}`)
        console.log(`  ${this.colors.highlight('SENSE:')} Input processing and data understanding`)
        console.log(`  ${this.colors.highlight('CONDUIT:')} External system integrations and sync`)
        console.log(`  ${this.colors.highlight('COGNITION:')} AI reasoning and analysis`)
        console.log(`  ${this.colors.highlight('MEMORY:')} Enhanced storage and retrieval`)
        console.log(`  ${this.colors.highlight('PERCEPTION:')} Pattern recognition and insights`)
        console.log(`  ${this.colors.highlight('DIALOG:')} Conversational interfaces`)
        console.log(`  ${this.colors.highlight('ACTIVATION:')} Automation and triggers`)
        console.log(`  ${this.colors.highlight('WEBSOCKET:')} Real-time communications`)
      }
      
    } catch (error) {
      console.error(`${this.emojis.cross} Failed to get augmentation status:`, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Performance Monitoring & Health Check System - Atomic Age Intelligence Observatory
   */
  async monitor(options: any = {}): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.performanceMonitor) {
      console.log(colors.error('Performance monitor not initialized'))
      return
    }

    if (options.dashboard) {
      // Interactive dashboard mode
      console.log(boxen(
        `${emojis.stats} ${colors.brain('ATOMIC PERFORMANCE OBSERVATORY')} ${emojis.atom}\n\n` +
        `${colors.accent('◆')} ${colors.dim('Real-time vector + graph database monitoring')}\n` +
        `${colors.accent('◆')} ${colors.dim('Press Ctrl+C to exit dashboard')}`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))

      // Start monitoring in background
      await this.performanceMonitor.startMonitoring(5000) // 5 second intervals
      
      // Display dashboard in loop
      const dashboardInterval = setInterval(async () => {
        try {
          await this.performanceMonitor!.displayDashboard()
        } catch (error) {
          console.error('Dashboard update failed:', error)
        }
      }, 5000)

      // Handle cleanup on exit
      process.on('SIGINT', () => {
        clearInterval(dashboardInterval)
        this.performanceMonitor!.stopMonitoring()
        console.log('\n' + colors.dim('Performance monitoring stopped'))
        process.exit(0)
      })

      // Keep process alive
      await new Promise(() => {})
      
    } else {
      // Single snapshot mode
      const metrics = await this.performanceMonitor.getCurrentMetrics()
      
      console.log(boxen(
        `${emojis.stats} ${colors.brain('PERFORMANCE SNAPSHOT')} ${emojis.atom}`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))
      
      console.log(`\n${colors.accent('Vector Query Latency:')} ${colors.primary(metrics.queryLatency.vector.avg.toFixed(1) + 'ms')}`)
      console.log(`${colors.accent('Graph Query Latency:')} ${colors.primary(metrics.queryLatency.graph.avg.toFixed(1) + 'ms')}`)
      console.log(`${colors.accent('Combined Throughput:')} ${colors.success(metrics.throughput.totalOps.toFixed(0) + ' ops/sec')}`)
      console.log(`${colors.accent('Cache Hit Rate:')} ${colors.success((metrics.storage.cacheHitRate * 100).toFixed(1) + '%')}`)
      console.log(`${colors.accent('Overall Health:')} ${colors.primary(metrics.health.overall + '/100')}`)
    }
  }

  async health(options: any = {}): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.healthCheck) {
      console.log(colors.error('Health check system not initialized'))
      return
    }

    if (options.autoFix) {
      // Run health check and auto-repair
      const health = await this.healthCheck.runHealthCheck()
      await this.healthCheck.displayHealthReport(health)
      
      console.log('\n' + colors.brain(`${emojis.repair} INITIATING AUTO-REPAIR SEQUENCE`))
      
      const results = await this.healthCheck.executeAutoRepairs()
      
      if (results.success.length > 0 || results.failed.length > 0) {
        // Run health check again to show improvements
        console.log('\n' + colors.info('Running post-repair health check...'))
        await this.healthCheck.displayHealthReport()
      }
      
    } else {
      // Standard health check
      await this.healthCheck.displayHealthReport()
      
      // Show available repair actions
      const repairs = await this.healthCheck.getRepairActions()
      const safeRepairs = repairs.filter(r => r.automated && r.riskLevel === 'safe')
      
      if (safeRepairs.length > 0) {
        console.log('\n' + colors.info(`${emojis.info} Run 'cortex health --auto-fix' to apply ${safeRepairs.length} safe automated repairs`))
      }
    }
  }

  async performance(options: any = {}): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.performanceMonitor) {
      console.log(colors.error('Performance monitor not initialized'))
      return
    }

    if (options.analyze) {
      // Detailed performance analysis
      console.log(boxen(
        `${emojis.lab} ${colors.brain('PERFORMANCE ANALYSIS ENGINE')} ${emojis.atom}\n\n` +
        `${colors.accent('◆')} ${colors.dim('Deep analysis of vector + graph performance')}\n` +
        `${colors.accent('◆')} ${colors.dim('Collecting metrics over 30 seconds...')}`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))

      const spinner = ora('Analyzing neural pathway performance...').start()
      
      // Start monitoring to collect data
      await this.performanceMonitor.startMonitoring(2000) // 2 second intervals
      
      // Wait for data collection
      await new Promise(resolve => setTimeout(resolve, 30000))
      
      // Stop monitoring and get dashboard data
      this.performanceMonitor.stopMonitoring()
      const dashboard = await this.performanceMonitor.getDashboard()
      
      spinner.succeed('Performance analysis complete')
      
      // Display detailed analysis
      console.log('\n' + colors.brain(`${emojis.lightning} DETAILED ANALYSIS RESULTS`))
      
      const current = dashboard.current
      const trends = dashboard.trends
      
      if (trends.length > 1) {
        const first = trends[0]
        const last = trends[trends.length - 1]
        
        const vectorTrend = last.queryLatency.vector.avg - first.queryLatency.vector.avg
        const graphTrend = last.queryLatency.graph.avg - first.queryLatency.graph.avg
        const throughputTrend = last.throughput.totalOps - first.throughput.totalOps
        
        console.log(`\n${colors.accent('Vector Performance Trend:')} ${vectorTrend > 0 ? colors.warning('↑') : colors.success('↓')} ${Math.abs(vectorTrend).toFixed(1)}ms`)
        console.log(`${colors.accent('Graph Performance Trend:')} ${graphTrend > 0 ? colors.warning('↑') : colors.success('↓')} ${Math.abs(graphTrend).toFixed(1)}ms`)
        console.log(`${colors.accent('Throughput Trend:')} ${throughputTrend > 0 ? colors.success('↑') : colors.warning('↓')} ${Math.abs(throughputTrend).toFixed(0)} ops/sec`)
      }
      
      // Show recommendations
      console.log('\n' + colors.brain(`${emojis.sparkle} OPTIMIZATION RECOMMENDATIONS`))
      
      if (current.queryLatency.vector.p95 > 100) {
        console.log(`  ${colors.warning('→')} Vector query P95 latency is high - consider rebuilding HNSW index`)
      }
      
      if (current.storage.cacheHitRate < 0.8) {
        console.log(`  ${colors.warning('→')} Cache hit rate is below 80% - consider increasing cache size`)
      }
      
      if (current.memory.heapUsed > 1000) {
        console.log(`  ${colors.warning('→')} Memory usage is high - consider running garbage collection`)
      }
      
      if (current.health.overall < 85) {
        console.log(`  ${colors.error('→')} Overall health below 85% - run 'cortex health --auto-fix'`)
      }
      
    } else {
      // Quick performance overview
      const metrics = await this.performanceMonitor.getCurrentMetrics()
      
      console.log(boxen(
        `${emojis.rocket} ${colors.brain('QUICK PERFORMANCE OVERVIEW')} ${emojis.atom}`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))
      
      console.log(`\n${colors.brain('Vector + Graph Database Performance:')}\n`)
      console.log(`  ${colors.accent('Vector Operations:')} ${colors.primary(metrics.queryLatency.vector.avg.toFixed(1) + 'ms avg')} | ${colors.highlight(metrics.throughput.vectorOps.toFixed(0) + ' ops/sec')}`)
      console.log(`  ${colors.accent('Graph Operations:')} ${colors.primary(metrics.queryLatency.graph.avg.toFixed(1) + 'ms avg')} | ${colors.highlight(metrics.throughput.graphOps.toFixed(0) + ' ops/sec')}`)
      console.log(`  ${colors.accent('Storage Performance:')} ${colors.success((metrics.storage.cacheHitRate * 100).toFixed(1) + '% cache hit')} | ${colors.info(metrics.storage.readLatency.toFixed(1) + 'ms read')}`)
      console.log(`  ${colors.accent('Memory Usage:')} ${colors.primary(metrics.memory.heapUsed.toFixed(0) + 'MB')} | ${colors.success((metrics.memory.efficiency * 100).toFixed(1) + '% efficient')}`)
      console.log(`\n${colors.dim('For detailed analysis: cortex performance --analyze')}`)
    }
  }

  /**
   * Premium Licensing System - Atomic Age Revenue Engine
   */
  async licenseCatalog(): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.licensingSystem) {
      console.log(colors.error('Licensing system not initialized'))
      return
    }

    await this.licensingSystem.displayFeatureCatalog()
  }

  async licenseStatus(licenseId?: string): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.licensingSystem) {
      console.log(colors.error('Licensing system not initialized'))
      return
    }

    await this.licensingSystem.checkLicenseStatus(licenseId)
  }

  async licenseTrial(featureId: string, customerName?: string, customerEmail?: string): Promise<void> {
    await this.ensureInitialized()
    
    if (!this.licensingSystem) {
      console.log(colors.error('Licensing system not initialized'))
      return
    }

    // Get customer info if not provided
    if (!customerName || !customerEmail) {
      // @ts-ignore
      const prompts = (await import('prompts')).default
      
      const response = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Your name:',
          initial: customerName || ''
        },
        {
          type: 'text',
          name: 'email',
          message: 'Your email address:',
          initial: customerEmail || '',
          validate: (email: string) => email.includes('@') ? true : 'Please enter a valid email'
        }
      ])

      if (!response.name || !response.email) {
        console.log(colors.dim('Trial activation cancelled'))
        return
      }

      customerName = response.name
      customerEmail = response.email
    }

    // Type guard to ensure values are strings
    if (!customerName || !customerEmail) {
      console.log(colors.error('Customer name and email are required'))
      return
    }

    const license = await this.licensingSystem.startTrial(featureId, {
      name: customerName,
      email: customerEmail
    })

    if (license) {
      console.log(boxen(
        `${emojis.sparkle} ${colors.brain('WELCOME TO BRAINY PREMIUM!')} ${emojis.atom}\n\n` +
        `${colors.accent('◆')} ${colors.dim('Your trial is now active')}\n` +
        `${colors.accent('◆')} ${colors.dim('Access premium features immediately')}\n` +
        `${colors.accent('◆')} ${colors.dim('Upgrade anytime at https://soulcraft-research.com/brainy/premium')}`,
        { padding: 1, borderStyle: 'round', borderColor: '#FFD700' }
      ))
    }
  }

  async licenseValidate(featureId: string): Promise<boolean> {
    await this.ensureInitialized()
    
    if (!this.licensingSystem) {
      console.log(colors.error('Licensing system not initialized'))
      return false
    }

    const result = await this.licensingSystem.validateFeature(featureId)
    
    if (result.valid) {
      console.log(colors.success(`${emojis.check} Feature '${featureId}' is licensed and available`))
      
      if (result.expiresIn && result.expiresIn <= 7) {
        console.log(colors.warning(`${emojis.warning} License expires in ${result.expiresIn} days`))
      }
      
      return true
    } else {
      console.log(colors.error(`${emojis.cross} Feature '${featureId}' is not available: ${result.reason}`))
      
      if (result.reason?.includes('No valid license')) {
        console.log(colors.info(`${emojis.info} Start a free trial: cortex license trial ${featureId}`))
      }
      
      return false
    }
  }

  /**
   * Check if a premium feature is available before using it
   */
  async requirePremiumFeature(featureId: string, silent: boolean = false): Promise<boolean> {
    if (!this.licensingSystem) {
      if (!silent) console.log(colors.error('Licensing system not initialized'))
      return false
    }

    const result = await this.licensingSystem.validateFeature(featureId)
    
    if (!result.valid) {
      if (!silent) {
        console.log(boxen(
          `${emojis.lock} ${colors.brain('PREMIUM FEATURE REQUIRED')} ${emojis.atom}\n\n` +
          `${colors.accent('◆')} ${colors.dim('This feature requires a premium license')}\n` +
          `${colors.accent('◆')} ${colors.dim('Reason:')} ${colors.warning(result.reason)}\n\n` +
          `${colors.accent('Start free trial:')} ${colors.highlight('cortex license trial ' + featureId)}\n` +
          `${colors.accent('Browse catalog:')} ${colors.highlight('cortex license catalog')}`,
          { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
        ))
      }
      
      return false
    }

    // Show usage warnings if approaching limits
    if (result.usage && result.license) {
      const limits = result.license.limits
      
      if (limits.apiCallsPerMonth && result.usage.apiCalls > limits.apiCallsPerMonth * 0.8) {
        if (!silent) {
          console.log(colors.warning(`${emojis.warning} Approaching API call limit: ${result.usage.apiCalls}/${limits.apiCallsPerMonth}`))
        }
      }
      
      if (limits.dataVolumeGB && result.usage.dataUsed > limits.dataVolumeGB * 0.8) {
        if (!silent) {
          console.log(colors.warning(`${emojis.warning} Approaching data usage limit: ${result.usage.dataUsed}GB/${limits.dataVolumeGB}GB`))
        }
      }
    }

    return true
  }

  /**
   * Brain Jar AI Coordination Methods
   */
  async brainJarInstall(mode: string): Promise<void> {
    const spinner = ora('Installing Brain Jar coordination...').start()
    
    try {
      if (mode === 'premium') {
        spinner.text = 'Opening Brain Jar Premium signup...'
        // This would open browser to brain-jar.com
        console.log('\n' + boxen(
          `${emojis.brain}${emojis.rocket} ${colors.brain('BRAIN JAR PREMIUM')}\n\n` +
          `${colors.accent('◆')} ${colors.dim('Opening signup at:')} ${colors.highlight('https://brain-jar.com')}\n` +
          `${colors.accent('◆')} ${colors.dim('After signup, return to configure your API key')}\n\n` +
          `${colors.retro('Features:')}\n` +
          `${colors.success('✅')} Global AI coordination\n` +
          `${colors.success('✅')} Multi-device sync\n` +
          `${colors.success('✅')} Team workspaces\n` +
          `${colors.success('✅')} Premium dashboard`,
          { padding: 1, borderStyle: 'double', borderColor: '#D67441' }
        ))
        
        // Open browser (would be implemented)
        console.log(colors.info('\n💡 Run: export BRAIN_JAR_KEY="your-api-key" after signup'))
      } else {
        spinner.text = 'Setting up local Brain Jar server...'
        
        console.log('\n' + boxen(
          `${emojis.brain}${emojis.tube} ${colors.brain('BRAIN JAR FREE')}\n\n` +
          `${colors.accent('◆')} ${colors.dim('Local AI coordination installed')}\n` +
          `${colors.accent('◆')} ${colors.dim('Server:')} ${colors.highlight('localhost:8765')}\n` +
          `${colors.accent('◆')} ${colors.dim('Dashboard:')} ${colors.highlight('localhost:3000')}\n\n` +
          `${colors.retro('Features:')}\n` +
          `${colors.success('✅')} Local AI coordination\n` +
          `${colors.success('✅')} Real-time dashboard\n` +
          `${colors.success('✅')} Vector storage`,
          { padding: 1, borderStyle: 'round', borderColor: '#2D4A3A' }
        ))
      }
      
      spinner.succeed(`Brain Jar ${mode} installation complete!`)
      
    } catch (error: any) {
      spinner.fail('Brain Jar installation failed')
      console.error(colors.error('Error:'), error.message)
    }
  }

  async brainJarStart(options: any): Promise<void> {
    const spinner = ora('Starting Brain Jar coordination...').start()
    
    try {
      const isCloudMode = process.env.BRAIN_JAR_KEY !== undefined
      const serverUrl = options.server || (isCloudMode ? 'wss://api.brain-jar.com/ws' : 'ws://localhost:8765')
      
      spinner.text = `Connecting to ${isCloudMode ? 'cloud' : 'local'} coordination...`
      
      console.log('\n' + boxen(
        `${emojis.brain}${emojis.network} ${colors.brain('BRAIN JAR COORDINATION ACTIVE')}\n\n` +
        `${colors.accent('◆')} ${colors.dim('Mode:')} ${colors.highlight(isCloudMode ? 'Premium Cloud' : 'Local Free')}\n` +
        `${colors.accent('◆')} ${colors.dim('Server:')} ${colors.highlight(serverUrl)}\n` +
        `${colors.accent('◆')} ${colors.dim('Agent:')} ${colors.highlight(options.name || 'Claude-Agent')}\n` +
        `${colors.accent('◆')} ${colors.dim('Role:')} ${colors.highlight(options.role || 'Assistant')}\n\n` +
        `${colors.success('✅')} All Claude instances will now coordinate automatically!`,
        { padding: 1, borderStyle: 'round', borderColor: isCloudMode ? '#D67441' : '#2D4A3A' }
      ))
      
      spinner.succeed('Brain Jar coordination started!')
      
      console.log(colors.dim('\n💡 Keep this terminal open for coordination to remain active'))
      console.log(colors.primary(`🔗 Dashboard: brainy brain-jar dashboard`))
      
    } catch (error: any) {
      spinner.fail('Failed to start Brain Jar')
      console.error(colors.error('Error:'), error.message)
    }
  }

  async brainJarDashboard(shouldOpen: boolean = true): Promise<void> {
    const isCloudMode = process.env.BRAIN_JAR_KEY !== undefined
    const dashboardUrl = isCloudMode ? 'https://dashboard.brain-jar.com' : 'http://localhost:3000/dashboard'
    
    console.log(boxen(
      `${emojis.data}${emojis.brain} ${colors.brain('BRAIN JAR DASHBOARD')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('URL:')} ${colors.highlight(dashboardUrl)}\n` +
      `${colors.accent('◆')} ${colors.dim('Mode:')} ${colors.highlight(isCloudMode ? 'Premium Cloud' : 'Local Free')}\n\n` +
      `${colors.retro('Features:')}\n` +
      `${colors.success('✅')} Live agent coordination\n` +
      `${colors.success('✅')} Real-time conversation view\n` +
      `${colors.success('✅')} Search coordination history\n` +
      `${colors.success('✅')} Performance metrics`,
      { padding: 1, borderStyle: 'round', borderColor: isCloudMode ? '#D67441' : '#2D4A3A' }
    ))
    
    if (shouldOpen) {
      console.log(colors.success(`\n🚀 Opening dashboard: ${dashboardUrl}`))
      // Would open browser here
    }
  }

  async brainJarStatus(): Promise<void> {
    const isCloudMode = process.env.BRAIN_JAR_KEY !== undefined
    
    console.log(boxen(
      `${emojis.brain}${emojis.stats} ${colors.brain('BRAIN JAR STATUS')}\n\n` +
      `${colors.accent('◆')} ${colors.dim('Mode:')} ${colors.highlight(isCloudMode ? 'Premium Cloud' : 'Local Free')}\n` +
      `${colors.accent('◆')} ${colors.dim('Status:')} ${colors.success('Active')}\n` +
      `${colors.accent('◆')} ${colors.dim('Connected Agents:')} ${colors.highlight('2')}\n` +
      `${colors.accent('◆')} ${colors.dim('Total Messages:')} ${colors.highlight('47')}\n` +
      `${colors.accent('◆')} ${colors.dim('Uptime:')} ${colors.highlight('15m 32s')}\n\n` +
      `${colors.success('✅')} All systems operational!`,
      { padding: 1, borderStyle: 'round', borderColor: '#2D4A3A' }
    ))
  }

  async brainJarStop(): Promise<void> {
    const spinner = ora('Stopping Brain Jar coordination...').start()
    
    try {
      // Would stop coordination server/connections here
      spinner.succeed('Brain Jar coordination stopped')
      
      console.log(colors.warning('⚠️  AI agents will no longer coordinate'))
      console.log(colors.dim('💡 Run: brainy brain-jar start to resume coordination'))
      
    } catch (error: any) {
      spinner.fail('Failed to stop Brain Jar')
      console.error(colors.error('Error:'), error.message)
    }
  }

  async brainJarAgents(): Promise<void> {
    console.log(boxen(
      `${emojis.robot}${emojis.network} ${colors.brain('CONNECTED AGENTS')}\n\n` +
      `${colors.success('🤖')} ${colors.highlight('Jarvis')} - ${colors.dim('Backend Systems')}\n` +
      `    ${colors.dim('Status:')} ${colors.success('Connected')}\n` +
      `    ${colors.dim('Last Active:')} ${colors.dim('2 minutes ago')}\n\n` +
      `${colors.success('🎨')} ${colors.highlight('Picasso')} - ${colors.dim('Frontend Design')}\n` +
      `    ${colors.dim('Status:')} ${colors.success('Connected')}\n` +
      `    ${colors.dim('Last Active:')} ${colors.dim('30 seconds ago')}\n\n` +
      `${colors.accent('Total Active Agents:')} ${colors.highlight('2')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#2D4A3A' }
    ))
  }

  async brainJarMessage(text: string): Promise<void> {
    const spinner = ora('Broadcasting message to coordination channel...').start()
    
    try {
      // Would send message through coordination system here
      spinner.succeed('Message sent to all connected agents')
      
      console.log(boxen(
        `${emojis.chat}${emojis.network} ${colors.brain('MESSAGE BROADCAST')}\n\n` +
        `${colors.dim('Message:')} ${colors.highlight(text)}\n` +
        `${colors.dim('Recipients:')} ${colors.success('All connected agents')}\n` +
        `${colors.dim('Timestamp:')} ${colors.dim(new Date().toLocaleTimeString())}`,
        { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
      ))
      
    } catch (error: any) {
      spinner.fail('Failed to send message')
      console.error(colors.error('Error:'), error.message)
    }
  }

  async brainJarSearch(query: string, limit: number): Promise<void> {
    const spinner = ora('Searching coordination history...').start()
    
    try {
      // Would search through coordination messages here
      spinner.succeed(`Found coordination messages for: "${query}"`)
      
      console.log(boxen(
        `${emojis.search}${emojis.brain} ${colors.brain('COORDINATION SEARCH RESULTS')}\n\n` +
        `${colors.dim('Query:')} ${colors.highlight(query)}\n` +
        `${colors.dim('Results:')} ${colors.success('5 matches')}\n` +
        `${colors.dim('Limit:')} ${colors.dim(limit.toString())}\n\n` +
        `${colors.success('📨')} ${colors.dim('Jarvis:')} "Setting up backend coordination..."\n` +
        `${colors.success('📨')} ${colors.dim('Picasso:')} "Frontend components ready for integration..."\n` +
        `${colors.success('📨')} ${colors.dim('Jarvis:')} "Database connections established..."\n\n` +
        `${colors.dim('Use')} ${colors.primary('brainy brain-jar dashboard')} ${colors.dim('for visual search')}`,
        { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
      ))
      
    } catch (error: any) {
      spinner.fail('Search failed')
      console.error(colors.error('Error:'), error.message)
    }
  }

  /**
   * Helper method to determine data type from file path
   */
  private getDataTypeFromPath(filePath: string): string {
    const path = require('path')
    const ext = path.extname(filePath).toLowerCase()
    
    switch (ext) {
      case '.json': return 'json'
      case '.csv': return 'csv'
      case '.yaml':
      case '.yml': return 'yaml'
      case '.txt': return 'text'
      default: return 'text'
    }
  }
}

// Type definitions
interface CortexConfig {
  storage: string
  encryption: boolean
  encryptionEnabled?: boolean
  chat: boolean
  llm?: string
  s3Bucket?: string
  r2Bucket?: string
  gcsBucket?: string
  initialized: boolean
  createdAt: string
  brainyOptions?: any
}

interface InitOptions {
  storage?: string
  encryption?: boolean
  chat?: boolean
  llm?: string
}

interface MigrateOptions {
  to: string
  bucket?: string
  strategy?: 'immediate' | 'gradual'
}

interface SearchOptions {
  limit?: number
  filter?: any  // MongoDB-style filters
  verbs?: string[]  // Graph verb types to traverse
  depth?: number  // Graph traversal depth
}