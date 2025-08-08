#!/usr/bin/env node

/**
 * Brainy CLI - Beautiful command center for the vector + graph database
 */

// @ts-ignore
import { program } from 'commander'
import { Cortex } from '../dist/cortex/cortex.js'
// @ts-ignore
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

// Create Cortex instance
const cortex = new Cortex()

// Helper to ensure proper process exit
const exitProcess = (code = 0) => {
  setTimeout(() => {
    process.exit(code)
  }, 100)
}

// Wrap async actions to ensure proper exit
const wrapAction = (fn) => {
  return async (...args) => {
    try {
      await fn(...args)
      // Always exit for non-interactive commands
      exitProcess(0)
    } catch (error) {
      console.error(chalk.red('Error:'), error.message)
      exitProcess(1)
    }
  }
}

// Wrap interactive actions with explicit exit
const wrapInteractive = (fn) => {
  return async (...args) => {
    try {
      await fn(...args)
      exitProcess(0)
    } catch (error) {
      console.error(chalk.red('Error:'), error.message)
      exitProcess(1)
    }
  }
}

// Setup program
program
  .name('cortex')
  .description('🧠 Cortex - Command Center for Brainy')
  .version(packageJson.version)

// Initialize command
program
  .command('init')
  .description('Initialize Cortex in your project')
  .option('-s, --storage <type>', 'Storage type (filesystem, s3, r2, gcs, memory)')
  .option('-e, --encryption', 'Enable encryption for secrets')
  .action(wrapAction(async (options) => {
    await cortex.init(options)
  }))

// Chat commands (simplified - just 'chat', no alias)
program
  .command('chat [question]')
  .description('💬 Chat with your data (interactive mode if no question)')
  .option('-l, --llm <model>', 'LLM model to use')
  .action(wrapInteractive(async (question, options) => {
    await cortex.chat(question)
  }))

// Data management commands
program
  .command('add [data]')
  .description('📊 Add data to Brainy')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('-i, --id <id>', 'Custom ID')
  .action(async (data, options) => {
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(chalk.red('Invalid JSON metadata'))
        process.exit(1)
      }
    }
    if (options.id) {
      metadata.id = options.id
    }
    await cortex.add(data, metadata)
    exitProcess(0)
  })

program
  .command('search <query>')
  .description('🔍 Search your database with advanced options')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-f, --filter <json>', 'MongoDB-style metadata filters')
  .option('-v, --verbs <types>', 'Graph verb types to traverse (comma-separated)')
  .option('-d, --depth <number>', 'Graph traversal depth', '1')
  .action(async (query, options) => {
    const searchOptions = { limit: parseInt(options.limit) }
    
    if (options.filter) {
      try {
        searchOptions.filter = JSON.parse(options.filter)
      } catch {
        console.error(chalk.red('Invalid filter JSON'))
        process.exit(1)
      }
    }
    
    if (options.verbs) {
      searchOptions.verbs = options.verbs.split(',').map(v => v.trim())
      searchOptions.depth = parseInt(options.depth)
    }
    
    await cortex.search(query, searchOptions)
    exitProcess(0)
  })

program
  .command('find')
  .description('🔍 Interactive advanced search with filters and graph traversal')
  .action(wrapInteractive(async () => {
    await cortex.advancedSearch()
  }))

program
  .command('update <id> <data>')
  .description('✏️ Update existing data')
  .option('-m, --metadata <json>', 'New metadata as JSON')
  .action(async (id, data, options) => {
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(chalk.red('Invalid metadata JSON'))
        process.exit(1)
      }
    }
    await cortex.update(id, data, metadata)
    exitProcess(0)
  })

program
  .command('delete <id>')
  .description('🗑️ Delete data by ID')
  .action(wrapAction(async (id) => {
    await cortex.delete(id)
  }))

// Graph commands
program
  .command('verb <subject> <verb> <object>')
  .description('🔗 Add graph relationship between nodes')
  .option('-m, --metadata <json>', 'Relationship metadata')
  .action(async (subject, verb, object, options) => {
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(chalk.red('Invalid metadata JSON'))
        process.exit(1)
      }
    }
    await cortex.addVerb(subject, verb, object, metadata)
    exitProcess(0)
  })

program
  .command('explore [nodeId]')
  .description('🗺️ Interactively explore graph connections')
  .action(wrapInteractive(async (nodeId) => {
    await cortex.explore(nodeId)
  }))

// Configuration commands
const config = program.command('config')
  .description('⚙️ Manage configuration')

config
  .command('set <key> <value>')
  .description('Set configuration value')
  .option('-e, --encrypt', 'Encrypt this value')
  .action(wrapAction(async (key, value, options) => {
    await cortex.configSet(key, value, options)
  }))

config
  .command('get <key>')
  .description('Get configuration value')
  .action(async (key) => {
    const value = await cortex.configGet(key)
    if (value) {
      console.log(chalk.green(`${key}: ${value}`))
    } else {
      console.log(chalk.yellow(`Key not found: ${key}`))
    }
    exitProcess(0)
  })

config
  .command('list')
  .description('List all configuration')
  .action(wrapAction(async () => {
    await cortex.configList()
  }))

config
  .command('import <file>')
  .description('Import configuration from .env file')
  .action(wrapAction(async (file) => {
    await cortex.importEnv(file)
  }))

config
  .command('export <file>')
  .description('Export configuration to .env file')
  .action(wrapAction(async (file) => {
    await cortex.exportEnv(file)
  }))

config
  .command('key-rotate')
  .description('🔄 Rotate master encryption key')
  .action(wrapInteractive(async () => {
    await cortex.resetMasterKey()
  }))

config
  .command('secrets-patterns')
  .description('🛡️ List secret detection patterns')
  .action(wrapAction(async () => {
    await cortex.listSecretPatterns()
  }))

config
  .command('secrets-add <pattern>')
  .description('➕ Add custom secret detection pattern')
  .action(wrapAction(async (pattern) => {
    await cortex.addSecretPattern(pattern)
  }))

config
  .command('secrets-remove <pattern>')
  .description('➖ Remove custom secret detection pattern')
  .action(wrapAction(async (pattern) => {
    await cortex.removeSecretPattern(pattern)
  }))

// Migration commands
program
  .command('migrate')
  .description('📦 Migrate to different storage')
  .requiredOption('-t, --to <type>', 'Target storage type (filesystem, s3, r2, gcs, memory)')
  .option('-b, --bucket <name>', 'Bucket name for cloud storage')
  .option('-s, --strategy <type>', 'Migration strategy', 'immediate')
  .action(wrapInteractive(async (options) => {
    await cortex.migrate(options)
  }))

// Database operations
program
  .command('stats')
  .description('📊 Show database statistics')
  .option('-d, --detailed', 'Show detailed field statistics')
  .action(wrapAction(async (options) => {
    await cortex.stats(options.detailed)
  }))

program
  .command('fields')
  .description('📋 List all searchable fields with samples')
  .action(wrapAction(async () => {
    await cortex.listFields()
  }))

// LLM setup
program
  .command('llm [provider]')
  .description('🤖 Setup or change LLM provider')
  .action(wrapInteractive(async (provider) => {
    await cortex.setupLLM(provider)
  }))

// Embedding utilities
program
  .command('embed <text>')
  .description('✨ Generate embedding vector for text')
  .action(wrapAction(async (text) => {
    await cortex.embed(text)
  }))

program
  .command('similarity <text1> <text2>')
  .description('🔍 Calculate semantic similarity between texts')
  .action(wrapAction(async (text1, text2) => {
    await cortex.similarity(text1, text2)
  }))

program
  .command('backup')
  .description('💾 Create database backup')
  .option('-c, --compress', 'Compress backup')
  .option('-o, --output <file>', 'Output file')
  .action(wrapAction(async (options) => {
    await cortex.backup(options)
  }))

program
  .command('restore <file>')
  .description('♻️ Restore from backup')
  .action(wrapInteractive(async (file) => {
    await cortex.restore(file)
  }))

program
  .command('health')
  .description('🏥 Check database health')
  .action(wrapAction(async () => {
    await cortex.health()
  }))

// Backup & Restore commands
program
  .command('backup')
  .description('💾 Create atomic vault backup')
  .option('-c, --compress', 'Enable quantum compression')
  .option('-o, --output <file>', 'Output file path')
  .option('--password <password>', 'Encrypt backup with password')
  .action(wrapAction(async (options) => {
    await cortex.backup(options)
  }))

program
  .command('restore <file>')
  .description('♻️ Restore from atomic vault')
  .option('--password <password>', 'Decrypt backup with password')
  .option('--dry-run', 'Simulate restore without making changes')
  .action(wrapInteractive(async (file, options) => {
    await cortex.restore(file, options)
  }))

program
  .command('backups')
  .description('📋 List available atomic vault backups')
  .option('-d, --directory <path>', 'Backup directory', './backups')
  .action(wrapAction(async (options) => {
    await cortex.listBackups(options.directory)
  }))

// Augmentation Management commands
program
  .command('augmentations')
  .description('🧠 Show augmentation status and management')
  .option('-v, --verbose', 'Show detailed augmentation information')
  .action(wrapInteractive(async (options) => {
    await cortex.augmentations(options)
  }))

// Performance Monitoring & Health Check commands
program
  .command('monitor')
  .description('📊 Monitor vector + graph database performance')
  .option('-d, --dashboard', 'Launch interactive performance dashboard')
  .action(wrapInteractive(async (options) => {
    await cortex.monitor(options)
  }))

program
  .command('health')
  .description('🔋 Check system health and diagnostics')
  .option('--auto-fix', 'Automatically apply safe repairs')
  .action(wrapAction(async (options) => {
    await cortex.health(options)
  }))

program
  .command('performance')
  .description('⚡ Analyze database performance metrics')
  .option('--analyze', 'Deep performance analysis with trends')
  .action(wrapAction(async (options) => {
    await cortex.performance(options)
  }))

// Premium Licensing commands
const license = program.command('license')
  .description('👑 Manage premium licenses and features')

license
  .command('catalog')
  .description('📋 Browse premium features catalog')
  .action(wrapAction(async () => {
    await cortex.licenseCatalog()
  }))

license
  .command('status [license-id]')
  .description('📊 Check license status and usage')
  .action(wrapAction(async (licenseId) => {
    await cortex.licenseStatus(licenseId)
  }))

license
  .command('trial <feature>')
  .description('⏰ Start free trial for premium feature')
  .option('--name <name>', 'Your name')
  .option('--email <email>', 'Your email address')
  .action(wrapAction(async (feature, options) => {
    await cortex.licenseTrial(feature, options.name, options.email)
  }))

license
  .command('validate <feature>')
  .description('✅ Validate feature license availability')
  .action(wrapAction(async (feature) => {
    await cortex.licenseValidate(feature)
  }))

// Augmentation management commands
const augment = program.command('augment')
  .description('🧩 Manage augmentation pipeline')

augment
  .command('list')
  .description('📋 List all augmentations and pipeline status')
  .action(wrapAction(async () => {
    await cortex.listAugmentations()
  }))

augment
  .command('add <type>')
  .description('➕ Add augmentation to pipeline')
  .option('-p, --position <number>', 'Pipeline position')
  .option('-c, --config <json>', 'Configuration as JSON')
  .action(wrapAction(async (type, options) => {
    let config = {}
    if (options.config) {
      try {
        config = JSON.parse(options.config)
      } catch {
        console.error(chalk.red('Invalid JSON configuration'))
        process.exit(1)
      }
    }
    await cortex.addAugmentation(type, options.position ? parseInt(options.position) : undefined, config)
  }))

augment
  .command('remove <type>')
  .description('➖ Remove augmentation from pipeline')
  .action(wrapAction(async (type) => {
    await cortex.removeAugmentation(type)
  }))

augment
  .command('configure <type> <config>')
  .description('⚙️ Configure existing augmentation')
  .action(wrapAction(async (type, configJson) => {
    let config = {}
    try {
      config = JSON.parse(configJson)
    } catch {
      console.error(chalk.red('Invalid JSON configuration'))
      process.exit(1)
    }
    await cortex.configureAugmentation(type, config)
  }))

augment
  .command('reset')
  .description('🔄 Reset pipeline to defaults')
  .action(wrapInteractive(async () => {
    await cortex.resetPipeline()
  }))

augment
  .command('execute <step> [data]')
  .description('⚡ Execute specific pipeline step')
  .action(wrapAction(async (step, data) => {
    const inputData = data ? JSON.parse(data) : { test: true }
    await cortex.executePipelineStep(step, inputData)
  }))

// Neural Import commands - The AI-Powered Data Understanding System
const neural = program.command('neural')
  .description('🧠 AI-powered data analysis and import')

neural
  .command('import <file>')
  .description('🧠 Smart import with AI analysis')
  .option('-c, --confidence <threshold>', 'Confidence threshold (0-1)', '0.7')
  .option('-a, --auto-apply', 'Auto-apply without confirmation')
  .option('-w, --enable-weights', 'Enable relationship weights', true)
  .option('--skip-duplicates', 'Skip duplicate detection', true)
  .action(wrapInteractive(async (file, options) => {
    const importOptions = {
      confidenceThreshold: parseFloat(options.confidence),
      autoApply: options.autoApply,
      enableWeights: options.enableWeights,
      skipDuplicates: options.skipDuplicates
    }
    await cortex.neuralImport(file, importOptions)
  }))

neural
  .command('analyze <file>')
  .description('🔬 Analyze data structure without importing')
  .action(wrapAction(async (file) => {
    await cortex.neuralAnalyze(file)
  }))

neural
  .command('validate <file>')
  .description('✅ Validate data import compatibility')
  .action(wrapAction(async (file) => {
    await cortex.neuralValidate(file)
  }))

neural
  .command('types')
  .description('📋 Show available noun and verb types')
  .action(wrapAction(async () => {
    await cortex.neuralTypes()
  }))

// Service integration commands
const service = program.command('service')
  .description('🛠️ Service integration and management')

service
  .command('discover')
  .description('🔍 Discover Brainy services in environment')
  .action(wrapAction(async () => {
    console.log('🔍 Discovering services...')
    // This would call CortexServiceIntegration.discoverBrainyInstances()
    console.log('📋 Service discovery complete (placeholder)')
  }))

service
  .command('health-all')
  .description('🩺 Health check all discovered services')
  .action(wrapAction(async () => {
    console.log('🩺 Running health checks on all services...')
    // This would call CortexServiceIntegration.healthCheckAll()
    console.log('✅ Health checks complete (placeholder)')
  }))

service
  .command('migrate-all')
  .description('🚀 Migrate all services to new storage')
  .requiredOption('-t, --to <type>', 'Target storage type')
  .option('-s, --strategy <type>', 'Migration strategy', 'immediate')
  .action(wrapInteractive(async (options) => {
    console.log(`🚀 Planning migration to ${options.to}...`)
    // This would call CortexServiceIntegration.migrateAll()
    console.log('✅ Migration complete (placeholder)')
  }))

// Interactive shell
program
  .command('shell')
  .description('🐚 Interactive Cortex shell')
  .action(async () => {
    console.log(chalk.cyan('🧠 Cortex Interactive Shell'))
    console.log(chalk.dim('Type "help" for commands, "exit" to quit\n'))
    
    // Start interactive mode
    await cortex.chat()
    exitProcess(0)
  })

// Parse arguments
program.parse(process.argv)

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp()
}