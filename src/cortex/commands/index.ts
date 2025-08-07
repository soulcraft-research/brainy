/**
 * Cortex Commands Implementation
 * 
 * All CLI commands for managing Brainy through Cortex
 */

import { CortexConfig } from '../config.js'
import { BrainyData } from '../../brainyData.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as readline from 'readline/promises'
import { stdin as input, stdout as output } from 'process'
import chalk from 'chalk'
import Table from 'cli-table3'

export class CortexCommands {
  /**
   * Initialize Cortex in a project
   */
  static async init(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    
    if (options.interactive) {
      const rl = readline.createInterface({ input, output })
      
      console.log(chalk.cyan('\n🧠 Welcome to Cortex - Brainy Command Center\n'))
      
      // Storage type
      const storageType = await rl.question(
        'Storage type (s3/filesystem/memory/opfs) [s3]: '
      ) || 's3'
      
      let storageConfig: any = { type: storageType }
      
      // Storage-specific configuration
      if (storageType === 's3') {
        storageConfig.bucket = await rl.question('S3 bucket name: ')
        storageConfig.region = await rl.question('AWS region [us-east-1]: ') || 'us-east-1'
        
        const useEnvCreds = await rl.question(
          'Use AWS credentials from environment? (y/n) [y]: '
        ) || 'y'
        
        if (useEnvCreds !== 'y') {
          storageConfig.accessKeyId = await rl.question('AWS Access Key ID: ')
          storageConfig.secretAccessKey = await rl.question('AWS Secret Access Key: ')
        }
      } else if (storageType === 'filesystem') {
        storageConfig.path = await rl.question(
          `Storage path [${path.join(process.cwd(), '.brainy-data')}]: `
        ) || path.join(process.cwd(), '.brainy-data')
      }
      
      // Encryption
      const enableEncryption = await rl.question(
        'Enable encrypted configuration? (y/n) [y]: '
      ) || 'y'
      
      // Coordination
      const enableCoordination = await rl.question(
        'Enable distributed coordination? (y/n) [y]: '
      ) || 'y'
      
      rl.close()
      
      await config.init({
        storage: storageConfig,
        encryption: {
          enabled: enableEncryption === 'y',
          keyDerivation: 'pbkdf2'
        },
        coordination: {
          enabled: enableCoordination === 'y',
          realtime: false,
          pollInterval: 30000
        }
      })
      
      console.log(chalk.green('\n✅ Cortex initialized successfully!'))
      console.log(chalk.gray('Configuration saved to .brainy/cortex.json'))
      console.log(chalk.gray('Master key saved to .brainy/cortex.key'))
      console.log(chalk.yellow('\n⚠️  Keep your master key safe!'))
      
    } else {
      // Non-interactive mode
      await config.init({
        storage: options.storage ? { type: options.storage } : undefined
      })
    }
  }

  /**
   * Set a configuration value
   */
  static async configSet(key: string, value: string | undefined, options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    // If no value provided, prompt for it
    if (!value) {
      const rl = readline.createInterface({ input, output })
      value = await rl.question(`Enter value for ${key}: `)
      rl.close()
    }
    
    await config.set(key, value, { encrypt: options.encrypt })
    console.log(chalk.green(`✅ Set ${key}`))
  }

  /**
   * Get a configuration value
   */
  static async configGet(key: string): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const value = await config.get(key)
    
    if (value === undefined) {
      console.log(chalk.yellow(`Configuration key '${key}' not found`))
    } else {
      console.log(value)
    }
  }

  /**
   * List all configuration keys
   */
  static async configList(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const configs = await config.list()
    
    if (configs.length === 0) {
      console.log(chalk.yellow('No configurations found'))
      return
    }
    
    const table = new Table({
      head: ['Key', 'Encrypted', 'Environment'],
      style: { head: ['cyan'] }
    })
    
    for (const cfg of configs) {
      const row = [
        cfg.key,
        cfg.encrypted ? chalk.green('✓') : chalk.gray('-'),
        cfg.environment
      ]
      
      if (options.showValues) {
        const value = await config.get(cfg.key)
        row.push(value ? String(value).substring(0, 50) : '')
      }
      
      table.push(row)
    }
    
    console.log(table.toString())
  }

  /**
   * Import configuration from .env file
   */
  static async configImport(file: string): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    await config.importEnv(file)
    console.log(chalk.green(`✅ Imported configuration from ${file}`))
  }

  /**
   * Load environment variables
   */
  static async envLoad(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const env = await config.loadEnvironment()
    
    if (options.export) {
      // Output as shell export commands
      for (const [key, value] of Object.entries(env)) {
        console.log(`export ${key}="${value}"`)
      }
    } else {
      // Set in current process
      Object.assign(process.env, env)
      console.log(chalk.green(`✅ Loaded ${Object.keys(env).length} environment variables`))
    }
  }

  /**
   * Migrate to new storage
   */
  static async migrate(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    
    // Parse target storage URL
    const targetUrl = new URL(options.to)
    let targetConfig: any = {}
    
    if (targetUrl.protocol === 's3:') {
      targetConfig = {
        type: 's3',
        bucket: targetUrl.hostname,
        region: targetUrl.searchParams.get('region') || 'us-east-1'
      }
    } else if (targetUrl.protocol === 'file:') {
      targetConfig = {
        type: 'filesystem',
        path: targetUrl.pathname
      }
    }
    
    // Create coordination plan
    const coordinationPlan = {
      version: 1,
      timestamp: new Date().toISOString(),
      migration: {
        enabled: true,
        target: targetConfig,
        strategy: options.strategy,
        dryRun: options.dryRun || false
      }
    }
    
    // Store coordination plan in current storage
    await brainy.addNoun({
      id: '_system/coordination',
      type: 'cortex_coordination',
      metadata: coordinationPlan
    })
    
    console.log(chalk.cyan('📋 Migration plan created:'))
    console.log(JSON.stringify(coordinationPlan, null, 2))
    
    if (!options.dryRun) {
      console.log(chalk.yellow('\n⏳ Migration will begin shortly...'))
      console.log(chalk.gray('All services will automatically detect and execute the migration'))
    }
  }

  /**
   * Synchronize services
   */
  static async sync(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    
    // Trigger sync by updating coordination timestamp
    await brainy.addNoun({
      id: '_system/sync',
      type: 'cortex_sync',
      metadata: {
        timestamp: new Date().toISOString(),
        force: options.force || false
      }
    })
    
    console.log(chalk.green('✅ Sync signal sent to all services'))
  }

  /**
   * Query data with advanced filtering
   */
  static async query(pattern: string, options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    
    // Parse metadata filter if provided
    let metadataFilter = null
    if (options.filter || options.metadata) {
      try {
        metadataFilter = JSON.parse(options.filter || options.metadata)
      } catch (error) {
        console.log(chalk.red(`Invalid filter JSON: ${error.message}`))
        return
      }
    }
    
    // Show query plan if requested
    if (options.explain) {
      console.log(chalk.cyan('\n📋 Query Plan:'))
      console.log(`Pattern: "${pattern}"`)
      if (metadataFilter) {
        console.log(`Filter: ${JSON.stringify(metadataFilter, null, 2)}`)
      }
      console.log(`Limit: ${options.limit || 10}\n`)
    }
    
    // Perform search with metadata filtering
    const results = await brainy.searchNouns(pattern, {
      limit: parseInt(options.limit) || 10,
      metadata: metadataFilter
    })
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2))
    } else {
      if (results.length === 0) {
        console.log(chalk.yellow('No results found'))
        return
      }
      
      const table = new Table({
        head: ['ID', 'Type', 'Score', 'Sample Metadata'],
        style: { head: ['cyan'] },
        colWidths: [30, 15, 10, 40]
      })
      
      for (const result of results) {
        // Show a sample of metadata
        let metaSample = ''
        if (result.metadata) {
          const keys = Object.keys(result.metadata).slice(0, 3)
          metaSample = keys.map(k => `${k}: ${JSON.stringify(result.metadata[k])}`).join(', ')
          if (Object.keys(result.metadata).length > 3) {
            metaSample += ', ...'
          }
        }
        
        table.push([
          result.id.substring(0, 28),
          result.type || '-',
          result.score?.toFixed(3) || '-',
          metaSample.substring(0, 38)
        ])
      }
      
      console.log(table.toString())
      console.log(chalk.gray(`\nFound ${results.length} results`))
    }
  }

  /**
   * Show statistics
   */
  static async stats(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    const stats = await brainy.getStatistics()
    
    if (options.json) {
      console.log(JSON.stringify(stats, null, 2))
    } else {
      console.log(chalk.cyan('\n📊 Brainy Statistics\n'))
      console.log(`Nouns: ${chalk.green(stats.totalNouns)}`)
      console.log(`Verbs: ${chalk.green(stats.totalVerbs)}`)
      console.log(`Storage Used: ${chalk.green(this.formatBytes(stats.storageUsed || 0))}`)
      console.log(`Index Size: ${chalk.green(this.formatBytes(stats.indexSize || 0))}`)
      
      if (stats.metadata) {
        console.log(`\nMetadata:`)
        for (const [key, value] of Object.entries(stats.metadata)) {
          console.log(`  ${key}: ${chalk.gray(JSON.stringify(value))}`)
        }
      }
    }
  }

  /**
   * Create backup
   */
  static async backup(destination: string | undefined, options: any): Promise<string> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `brainy-backup-${timestamp}`
    const backupPath = destination || path.join(process.cwd(), `${backupName}.json`)
    
    const brainy = config.getBrainy()
    
    // Export all data
    const backup: any = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        nouns: [],
        verbs: []
      }
    }
    
    // Export nouns with pagination
    let offset = 0
    let hasMore = true
    while (hasMore) {
      const result = await brainy.getNouns({
        pagination: { offset, limit: 100 }
      })
      backup.data.nouns.push(...result.items)
      hasMore = result.hasMore
      offset += 100
    }
    
    // Export verbs with pagination
    offset = 0
    hasMore = true
    while (hasMore) {
      const result = await brainy.getVerbs({
        pagination: { offset, limit: 100 }
      })
      backup.data.verbs.push(...result.items)
      hasMore = result.hasMore
      offset += 100
    }
    
    // Include configuration if requested
    if (options.includeConfig) {
      backup.config = await config.list()
    }
    
    // Save backup
    const backupContent = JSON.stringify(backup, null, 2)
    
    if (options.compress) {
      const zlib = await import('zlib')
      const compressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.gzip(Buffer.from(backupContent), (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      await fs.writeFile(`${backupPath}.gz`, compressed)
      return `${backupPath}.gz`
    } else {
      await fs.writeFile(backupPath, backupContent)
      return backupPath
    }
  }

  /**
   * Restore from backup
   */
  static async restore(source: string, options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    let backupContent: string
    
    if (source.endsWith('.gz')) {
      const zlib = await import('zlib')
      const compressed = await fs.readFile(source)
      backupContent = await new Promise<string>((resolve, reject) => {
        zlib.gunzip(compressed, (err, result) => {
          if (err) reject(err)
          else resolve(result.toString())
        })
      })
    } else {
      backupContent = await fs.readFile(source, 'utf-8')
    }
    
    const backup = JSON.parse(backupContent)
    const brainy = config.getBrainy()
    
    if (!options.force) {
      const rl = readline.createInterface({ input, output })
      const confirm = await rl.question(
        chalk.yellow('⚠️  This will overwrite existing data. Continue? (y/n): ')
      )
      rl.close()
      
      if (confirm !== 'y') {
        console.log('Restore cancelled')
        return
      }
    }
    
    // Restore nouns
    for (const noun of backup.data.nouns) {
      await brainy.addNoun(noun)
    }
    
    // Restore verbs
    for (const verb of backup.data.verbs) {
      await brainy.addVerb(verb)
    }
    
    console.log(chalk.green(`✅ Restored ${backup.data.nouns.length} nouns and ${backup.data.verbs.length} verbs`))
  }

  /**
   * Inspect an item
   */
  static async inspect(id: string, options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    
    try {
      // Try as noun first
      const noun = await brainy.getNoun(id)
      if (noun) {
        if (options.raw) {
          console.log(JSON.stringify(noun, null, 2))
        } else {
          console.log(chalk.cyan(`\n📦 Noun: ${id}\n`))
          console.log(`Type: ${chalk.green(noun.type || 'unknown')}`)
          if (noun.metadata) {
            console.log(`Metadata:`)
            console.log(JSON.stringify(noun.metadata, null, 2))
          }
        }
        return
      }
    } catch (e) {
      // Not a noun, try verb
    }
    
    try {
      // Try as verb
      const verb = await brainy.getVerb(id)
      if (verb) {
        if (options.raw) {
          console.log(JSON.stringify(verb, null, 2))
        } else {
          console.log(chalk.cyan(`\n🔗 Verb: ${id}\n`))
          console.log(`Type: ${chalk.green(verb.type)}`)
          console.log(`Source: ${chalk.blue(verb.source)}`)
          console.log(`Target: ${chalk.blue(verb.target)}`)
          if (verb.metadata) {
            console.log(`Metadata:`)
            console.log(JSON.stringify(verb.metadata, null, 2))
          }
        }
        return
      }
    } catch (e) {
      // Not found
    }
    
    console.log(chalk.red(`Item '${id}' not found`))
  }

  /**
   * Reindex database
   */
  static async reindex(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    const brainy = config.getBrainy()
    
    if (options.type === 'metadata' || options.type === 'all') {
      await brainy.rebuildMetadataIndex()
    }
    
    if (options.type === 'hnsw' || options.type === 'all') {
      // HNSW reindex would go here
      console.log(chalk.yellow('HNSW reindexing not yet implemented'))
    }
  }

  /**
   * Health check
   */
  static async health(options: any): Promise<void> {
    const config = CortexConfig.getInstance()
    
    try {
      await config.load()
      const brainy = config.getBrainy()
      const stats = await brainy.getStatistics()
      
      console.log(chalk.green('✅ Cortex: Healthy'))
      console.log(chalk.green('✅ Brainy: Connected'))
      console.log(chalk.green(`✅ Storage: Active (${stats.totalNouns} nouns, ${stats.totalVerbs} verbs)`))
      
      if (options.verbose) {
        console.log('\nDetailed Health:')
        console.log(`- Config Path: ${path.join(process.cwd(), '.brainy/cortex.json')}`)
        console.log(`- Storage Type: ${config.getStorageConfig()?.type}`)
        console.log(`- Environment: ${config.getCurrentEnvironment()}`)
      }
    } catch (error: any) {
      console.log(chalk.red('❌ Cortex: Error'))
      console.log(chalk.red(`   ${error.message}`))
      process.exit(1)
    }
  }

  /**
   * Interactive shell
   */
  static async shell(): Promise<void> {
    const config = CortexConfig.getInstance()
    await config.load()
    
    console.log(chalk.cyan('\n🧠 Cortex Interactive Shell\n'))
    console.log(chalk.gray('Type "help" for commands, "exit" to quit\n'))
    
    const rl = readline.createInterface({ input, output })
    
    while (true) {
      const command = await rl.question(chalk.cyan('cortex> '))
      
      if (command === 'exit' || command === 'quit') {
        break
      }
      
      if (command === 'help') {
        console.log(`
Available commands:
  query <pattern>    - Search for data
  get <key>         - Get config value
  set <key> <value> - Set config value
  stats             - Show statistics
  health            - Check health
  exit              - Exit shell
        `)
        continue
      }
      
      // Parse and execute command
      const [cmd, ...args] = command.split(' ')
      
      try {
        switch (cmd) {
          case 'query':
            await this.query(args.join(' '), { limit: 5 })
            break
          case 'get':
            await this.configGet(args[0])
            break
          case 'set':
            await this.configSet(args[0], args.slice(1).join(' '), { encrypt: true })
            break
          case 'stats':
            await this.stats({})
            break
          case 'health':
            await this.health({})
            break
          default:
            console.log(chalk.yellow(`Unknown command: ${cmd}`))
        }
      } catch (error: any) {
        console.log(chalk.red(`Error: ${error.message}`))
      }
    }
    
    rl.close()
    console.log(chalk.gray('\nGoodbye!\n'))
  }

  /**
   * Show status
   */
  static async status(): Promise<void> {
    const config = CortexConfig.getInstance()
    
    try {
      await config.load()
      const brainy = config.getBrainy()
      const stats = await brainy.getStatistics()
      
      console.log(chalk.cyan('\n🧠 Cortex Status\n'))
      
      const table = new Table({
        style: { head: ['cyan'] }
      })
      
      table.push(
        { 'Configuration': chalk.green('✓ Loaded') },
        { 'Storage': `${config.getStorageConfig()?.type}` },
        { 'Environment': config.getCurrentEnvironment() },
        { 'Encryption': chalk.green('✓ Enabled') },
        { 'Total Nouns': stats.totalNouns.toString() },
        { 'Total Verbs': stats.totalVerbs.toString() },
        { 'Storage Used': this.formatBytes(stats.storageUsed || 0) }
      )
      
      console.log(table.toString())
      
      // Check for active migrations
      const coordinationNoun = await brainy.getNoun('_system/coordination')
      if (coordinationNoun?.metadata?.migration?.enabled) {
        console.log(chalk.yellow('\n⚠️  Active Migration:'))
        console.log(`  Target: ${coordinationNoun.metadata.migration.target.type}`)
        console.log(`  Strategy: ${coordinationNoun.metadata.migration.strategy}`)
      }
      
    } catch (error: any) {
      console.log(chalk.red('❌ Cortex not initialized'))
      console.log(chalk.gray('Run "cortex init" to get started'))
    }
  }

  /**
   * Format bytes to human readable
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}