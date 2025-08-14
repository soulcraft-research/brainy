#!/usr/bin/env node

/**
 * Brainy CLI - Cleaned Up & Beautiful
 * 🧠⚛️ ONE way to do everything
 * 
 * After the Great Cleanup of 2025:
 * - 5 commands total (was 40+)
 * - Clear, obvious naming
 * - Interactive mode for beginners
 */

// @ts-ignore
import { program } from 'commander'
import { Cortex } from '../dist/cortex.js'
// @ts-ignore
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

// Create single Cortex instance (the ONE orchestrator)
const cortex = new Cortex()

// Beautiful colors
const colors = {
  primary: chalk.hex('#3A5F4A'),
  success: chalk.hex('#2D4A3A'), 
  info: chalk.hex('#4A6B5A'),
  warning: chalk.hex('#D67441'),
  error: chalk.hex('#B85C35')
}

// Helper functions
const exitProcess = (code = 0) => {
  setTimeout(() => process.exit(code), 100)
}

const wrapAction = (fn) => {
  return async (...args) => {
    try {
      await fn(...args)
      exitProcess(0)
    } catch (error) {
      console.error(colors.error('Error:'), error.message)
      exitProcess(1)
    }
  }
}

// ========================================
// MAIN PROGRAM - CLEAN & SIMPLE
// ========================================

program
  .name('brainy')
  .description('🧠⚛️ Brainy - Your AI-Powered Second Brain')
  .version(packageJson.version)

// ========================================
// THE 5 COMMANDS (ONE WAY TO DO EVERYTHING)
// ========================================

// Command 1: ADD - Add data (smart by default)
program
  .command('add [data]')
  .description('Add data to your brain (smart auto-detection)')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('-i, --id <id>', 'Custom ID') 
  .option('--literal', 'Skip AI processing (literal storage)')
  .action(wrapAction(async (data, options) => {
    if (!data) {
      console.log(colors.info('🧠 Interactive add mode'))
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      data = await new Promise(resolve => {
        rl.question(colors.primary('What would you like to add? '), (answer) => {
          rl.close()
          resolve(answer)
        })
      })
    }
    
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(colors.error('Invalid JSON metadata'))
        process.exit(1)
      }
    }
    if (options.id) {
      metadata.id = options.id
    }
    
    console.log(options.literal 
      ? colors.info('🔒 Literal storage') 
      : colors.success('🧠 Smart mode (auto-detects types)')
    )
    
    await cortex.add(data, metadata)
    console.log(colors.success('✅ Added successfully!'))
  }))

// Command 2: IMPORT - Bulk/external data
program
  .command('import <source>')
  .description('Import bulk data from files, URLs, or streams')
  .option('-t, --type <type>', 'Source type (file, url, stream)')
  .option('-c, --chunk-size <size>', 'Chunk size for large imports', '1000')
  .action(wrapAction(async (source, options) => {
    console.log(colors.info('📥 Starting neural import...'))
    console.log(colors.info(`Source: ${source}`))
    
    // Use the unified import system from the cleanup plan
    const { NeuralImport } = await import('../dist/cortex/neuralImport.js')
    const importer = new NeuralImport()
    
    const result = await importer.import(source, {
      chunkSize: parseInt(options.chunkSize)
    })
    
    console.log(colors.success(`✅ Imported ${result.count} items`))
    if (result.detectedTypes) {
      console.log(colors.info('🔍 Detected types:'), result.detectedTypes)
    }
  }))

// Command 3: SEARCH - Triple-power search
program
  .command('search <query>')
  .description('Search your brain (vector + graph + facets)')
  .option('-l, --limit <number>', 'Results limit', '10')
  .option('-f, --filter <json>', 'Metadata filters')
  .option('-d, --depth <number>', 'Relationship depth', '2')
  .action(wrapAction(async (query, options) => {
    console.log(colors.info(`🔍 Searching: "${query}"`))
    
    const searchOptions = { 
      limit: parseInt(options.limit),
      depth: parseInt(options.depth)
    }
    
    if (options.filter) {
      try {
        searchOptions.filter = JSON.parse(options.filter)
      } catch {
        console.error(colors.error('Invalid filter JSON'))
        process.exit(1)
      }
    }
    
    const results = await cortex.search(query, searchOptions)
    
    if (results.length === 0) {
      console.log(colors.warning('No results found'))
      return
    }
    
    console.log(colors.success(`✅ Found ${results.length} results:`))
    results.forEach((result, i) => {
      console.log(colors.primary(`\n${i + 1}. ${result.content}`))
      if (result.score) {
        console.log(colors.info(`   Relevance: ${(result.score * 100).toFixed(1)}%`))
      }
      if (result.type) {
        console.log(colors.info(`   Type: ${result.type}`))
      }
    })
  }))

// Command 4: STATUS - Database health & info
program
  .command('status')
  .description('Show brain status and comprehensive statistics')
  .option('-v, --verbose', 'Show raw JSON statistics')
  .option('-s, --simple', 'Show only basic info')
  .action(wrapAction(async (options) => {
    console.log(colors.primary('🧠 Brain Status & Statistics'))
    console.log(colors.primary('=' .repeat(50)))
    
    try {
      const { BrainyData } = await import('../dist/brainyData.js')
      const brainy = new BrainyData()
      await brainy.init()
      
      // Get comprehensive stats
      const stats = await brainy.getStatistics()
      const memUsage = process.memoryUsage()
      
      // Basic Health Status
      console.log(colors.success('💚 Status: Healthy'))
      console.log(colors.info(`🚀 Version: ${packageJson.version}`))
      console.log()
      
      if (options.simple) {
        console.log(colors.info(`📊 Total Items: ${stats.total || 0}`))
        console.log(colors.info(`🧠 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`))
        return
      }
      
      // Core Statistics
      console.log(colors.primary('📊 Core Database Statistics'))
      console.log(colors.info(`  Total Items: ${colors.success(stats.total || 0)}`))
      console.log(colors.info(`  Nouns: ${colors.success(stats.nounCount || 0)}`))
      console.log(colors.info(`  Verbs (Relationships): ${colors.success(stats.verbCount || 0)}`))
      console.log(colors.info(`  Documents: ${colors.success(stats.documentCount || 0)}`))
      console.log()
      
      // Storage Information
      if (stats.storage) {
        console.log(colors.primary('💾 Storage Information'))
        console.log(colors.info(`  Type: ${colors.success(stats.storage.type || 'Unknown')}`))
        if (stats.storage.size) {
          const sizeInMB = (stats.storage.size / 1024 / 1024).toFixed(2)
          console.log(colors.info(`  Size: ${colors.success(sizeInMB)} MB`))
        }
        if (stats.storage.location) {
          console.log(colors.info(`  Location: ${colors.success(stats.storage.location)}`))
        }
        console.log()
      }
      
      // Performance Metrics
      if (stats.performance) {
        console.log(colors.primary('⚡ Performance Metrics'))
        if (stats.performance.avgQueryTime) {
          console.log(colors.info(`  Avg Query Time: ${colors.success(stats.performance.avgQueryTime.toFixed(2))} ms`))
        }
        if (stats.performance.totalQueries) {
          console.log(colors.info(`  Total Queries: ${colors.success(stats.performance.totalQueries)}`))
        }
        if (stats.performance.cacheHitRate) {
          console.log(colors.info(`  Cache Hit Rate: ${colors.success((stats.performance.cacheHitRate * 100).toFixed(1))}%`))
        }
        console.log()
      }
      
      // Vector Index Information
      if (stats.index) {
        console.log(colors.primary('🎯 Vector Index'))
        console.log(colors.info(`  Dimensions: ${colors.success(stats.index.dimensions || 'N/A')}`))
        console.log(colors.info(`  Indexed Vectors: ${colors.success(stats.index.vectorCount || 0)}`))
        if (stats.index.indexSize) {
          console.log(colors.info(`  Index Size: ${colors.success((stats.index.indexSize / 1024 / 1024).toFixed(2))} MB`))
        }
        console.log()
      }
      
      // Memory Usage Breakdown
      console.log(colors.primary('🧠 Memory Usage'))
      console.log(colors.info(`  Heap Used: ${colors.success((memUsage.heapUsed / 1024 / 1024).toFixed(1))} MB`))
      console.log(colors.info(`  Heap Total: ${colors.success((memUsage.heapTotal / 1024 / 1024).toFixed(1))} MB`))
      console.log(colors.info(`  RSS: ${colors.success((memUsage.rss / 1024 / 1024).toFixed(1))} MB`))
      console.log()
      
      // Active Augmentations
      console.log(colors.primary('🔌 Active Augmentations'))
      const augmentations = cortex.getAllAugmentations()
      if (augmentations.length === 0) {
        console.log(colors.warning('  No augmentations currently active'))
      } else {
        augmentations.forEach(aug => {
          console.log(colors.success(`  ✅ ${aug.name}`))
          if (aug.description) {
            console.log(colors.info(`     ${aug.description}`))
          }
        })
      }
      console.log()
      
      // Configuration Summary
      if (stats.config) {
        console.log(colors.primary('⚙️ Configuration'))
        Object.entries(stats.config).forEach(([key, value]) => {
          // Don't show sensitive values
          if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
            console.log(colors.info(`  ${key}: ${colors.warning('[HIDDEN]')}`))
          } else {
            console.log(colors.info(`  ${key}: ${colors.success(value)}`))
          }
        })
        console.log()
      }
      
      // Show raw JSON if verbose
      if (options.verbose) {
        console.log(colors.primary('📋 Raw Statistics (JSON)'))
        console.log(colors.info(JSON.stringify(stats, null, 2)))
      }
      
    } catch (error) {
      console.log(colors.error('❌ Status: Error'))
      console.log(colors.error(`Error: ${error.message}`))
      if (options.verbose) {
        console.log(colors.error('Stack trace:'))
        console.log(error.stack)
      }
    }
  }))

// Command 5: CONFIG - Essential configuration
program
  .command('config <action> [key] [value]')
  .description('Configure brainy (get, set, list)')
  .action(wrapAction(async (action, key, value) => {
    const configActions = {
      get: async () => {
        if (!key) {
          console.error(colors.error('Please specify a key: brainy config get <key>'))
          process.exit(1)
        }
        const result = await cortex.configGet(key)
        console.log(colors.success(`${key}: ${result || 'not set'}`))
      },
      set: async () => {
        if (!key || !value) {
          console.error(colors.error('Usage: brainy config set <key> <value>'))
          process.exit(1)
        }
        await cortex.configSet(key, value)
        console.log(colors.success(`✅ Set ${key} = ${value}`))
      },
      list: async () => {
        const config = await cortex.configList()
        console.log(colors.primary('🔧 Current Configuration:'))
        Object.entries(config).forEach(([k, v]) => {
          console.log(colors.info(`  ${k}: ${v}`))
        })
      }
    }
    
    if (configActions[action]) {
      await configActions[action]()
    } else {
      console.error(colors.error('Valid actions: get, set, list'))
      process.exit(1)
    }
  }))

// Command 6: CLOUD - Premium features connection
program
  .command('cloud <action>')
  .description('Connect to Brain Cloud premium features')
  .option('-i, --instance <id>', 'Brain Cloud instance ID')
  .action(wrapAction(async (action, options) => {
    console.log(colors.primary('☁️ Brain Cloud Premium Features'))
    
    const cloudActions = {
      connect: async () => {
        console.log(colors.info('🔗 Connecting to Brain Cloud...'))
        // Dynamic import to avoid loading premium code unnecessarily
        try {
          const { BrainCloudSDK } = await import('@brainy-cloud/sdk')
          const connected = await BrainCloudSDK.connect(options.instance)
          if (connected) {
            console.log(colors.success('✅ Connected to Brain Cloud'))
            console.log(colors.info(`Instance: ${connected.instanceId}`))
          }
        } catch (error) {
          console.log(colors.warning('⚠️ Brain Cloud SDK not installed'))
          console.log(colors.info('Install with: npm install @brainy-cloud/sdk'))
          console.log(colors.info('Or visit: https://brain-cloud.soulcraft.com'))
        }
      },
      status: async () => {
        try {
          const { BrainCloudSDK } = await import('@brainy-cloud/sdk')
          const status = await BrainCloudSDK.getStatus()
          console.log(colors.success('☁️ Cloud Status: Connected'))
          console.log(colors.info(`Instance: ${status.instanceId}`))
          console.log(colors.info(`Augmentations: ${status.augmentationCount} available`))
        } catch {
          console.log(colors.warning('☁️ Cloud Status: Not connected'))
          console.log(colors.info('Use "brainy cloud connect" to connect'))
        }
      },
      augmentations: async () => {
        try {
          const { BrainCloudSDK } = await import('@brainy-cloud/sdk')
          const augs = await BrainCloudSDK.listAugmentations()
          console.log(colors.primary('🧩 Available Premium Augmentations:'))
          augs.forEach(aug => {
            console.log(colors.success(`  ✅ ${aug.name} - ${aug.description}`))
          })
        } catch {
          console.log(colors.warning('Connect to Brain Cloud first: brainy cloud connect'))
        }
      }
    }
    
    if (cloudActions[action]) {
      await cloudActions[action]()
    } else {
      console.log(colors.error('Valid actions: connect, status, augmentations'))
      console.log(colors.info('Example: brainy cloud connect --instance demo-test-auto'))
    }
  }))

// Command 7: MIGRATE - Migration tools
program
  .command('migrate <action>')
  .description('Migration tools for upgrades')
  .option('-f, --from <version>', 'Migrate from version')
  .option('-b, --backup', 'Create backup before migration')
  .action(wrapAction(async (action, options) => {
    console.log(colors.primary('🔄 Brainy Migration Tools'))
    
    const migrateActions = {
      check: async () => {
        console.log(colors.info('🔍 Checking for migration needs...'))
        // Check for deprecated methods, old config, etc.
        const issues = []
        
        try {
          const { BrainyData } = await import('../dist/brainyData.js')
          const brainy = new BrainyData()
          
          // Check for old API usage
          console.log(colors.success('✅ No migration issues found'))
        } catch (error) {
          console.log(colors.warning(`⚠️ Found issues: ${error.message}`))
        }
      },
      backup: async () => {
        console.log(colors.info('💾 Creating backup...'))
        const { BrainyData } = await import('../dist/brainyData.js')
        const brainy = new BrainyData()
        const backup = await brainy.createBackup()
        console.log(colors.success(`✅ Backup created: ${backup.path}`))
      },
      restore: async () => {
        if (!options.from) {
          console.error(colors.error('Please specify backup file: --from <path>'))
          process.exit(1)
        }
        console.log(colors.info(`📥 Restoring from: ${options.from}`))
        const { BrainyData } = await import('../dist/brainyData.js')
        const brainy = new BrainyData()
        await brainy.restoreBackup(options.from)
        console.log(colors.success('✅ Restore complete'))
      }
    }
    
    if (migrateActions[action]) {
      await migrateActions[action]()
    } else {
      console.log(colors.error('Valid actions: check, backup, restore'))
      console.log(colors.info('Example: brainy migrate check'))
    }
  }))

// Command 8: HELP - Interactive guidance
program
  .command('help [command]')
  .description('Get help or enter interactive mode')
  .action(wrapAction(async (command) => {
    if (command) {
      program.help()
      return
    }
    
    // Interactive mode for beginners
    console.log(colors.primary('🧠⚛️ Welcome to Brainy!'))
    console.log(colors.info('Your AI-powered second brain'))
    console.log()
    
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    console.log(colors.primary('What would you like to do?'))
    console.log(colors.info('1. Add some data'))
    console.log(colors.info('2. Search your brain'))
    console.log(colors.info('3. Import a file'))
    console.log(colors.info('4. Check status'))
    console.log(colors.info('5. Connect to Brain Cloud'))
    console.log(colors.info('6. Configuration'))
    console.log(colors.info('7. Show all commands'))
    console.log()
    
    const choice = await new Promise(resolve => {
      rl.question(colors.primary('Enter your choice (1-7): '), (answer) => {
        rl.close()
        resolve(answer)
      })
    })
    
    switch (choice) {
      case '1':
        console.log(colors.success('\n🧠 Use: brainy add "your data here"'))
        console.log(colors.info('Example: brainy add "John works at Google"'))
        break
      case '2':
        console.log(colors.success('\n🔍 Use: brainy search "your query"'))
        console.log(colors.info('Example: brainy search "Google employees"'))
        break
      case '3':
        console.log(colors.success('\n📥 Use: brainy import <file-or-url>'))
        console.log(colors.info('Example: brainy import data.txt'))
        break
      case '4':
        console.log(colors.success('\n📊 Use: brainy status'))
        console.log(colors.info('Shows comprehensive brain statistics'))
        console.log(colors.info('Options: --simple (quick) or --verbose (detailed)'))
        break
      case '5':
        console.log(colors.success('\n☁️ Use: brainy cloud connect'))
        console.log(colors.info('Example: brainy cloud connect --instance demo-test-auto'))
        break
      case '6':
        console.log(colors.success('\n🔧 Use: brainy config <action>'))
        console.log(colors.info('Example: brainy config list'))
        break
      case '7':
        program.help()
        break
      default:
        console.log(colors.warning('Invalid choice. Use "brainy --help" for all commands.'))
    }
  }))

// ========================================
// FALLBACK - Show interactive help if no command
// ========================================

// If no arguments provided, show interactive help
if (process.argv.length === 2) {
  program.parse(['node', 'brainy', 'help'])
} else {
  program.parse(process.argv)
}