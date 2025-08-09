#!/usr/bin/env node

/**
 * Brainy CLI - Redesigned for Better UX
 * Direct commands + Augmentation system
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
      console.error(chalk.red('Error:'), error.message)
      exitProcess(1)
    }
  }
}

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

// ========================================
// MAIN PROGRAM SETUP
// ========================================

program
  .name('brainy')
  .description('🧠 Brainy - Vector + Graph Database with AI Coordination')
  .version(packageJson.version)

// ========================================
// CORE DATABASE COMMANDS (Direct Access)
// ========================================

program
  .command('init')
  .description('🚀 Initialize Brainy in your project')
  .option('-s, --storage <type>', 'Storage type (filesystem, s3, r2, gcs, memory)')
  .option('-e, --encryption', 'Enable encryption for secrets')
  .action(wrapAction(async (options) => {
    await cortex.init(options)
  }))

program
  .command('add [data]')
  .description('📊 Add data to Brainy')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('-i, --id <id>', 'Custom ID')
  .action(wrapAction(async (data, options) => {
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
  }))

program
  .command('search <query>')
  .description('🔍 Search your database')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-f, --filter <json>', 'MongoDB-style metadata filters')
  .option('-v, --verbs <types>', 'Graph verb types to traverse (comma-separated)')
  .option('-d, --depth <number>', 'Graph traversal depth', '1')
  .action(wrapAction(async (query, options) => {
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
  }))

program
  .command('chat [question]')
  .description('💬 Chat with your data (interactive mode if no question)')
  .option('-l, --llm <model>', 'LLM model to use')
  .action(wrapInteractive(async (question, options) => {
    await cortex.chat(question)
  }))

program
  .command('stats')
  .description('📊 Show database statistics')
  .option('-d, --detailed', 'Show detailed statistics')
  .action(wrapAction(async (options) => {
    await cortex.stats(options.detailed)
  }))

program
  .command('health')
  .description('🔋 Check system health')
  .option('--auto-fix', 'Automatically apply safe repairs')
  .action(wrapAction(async (options) => {
    await cortex.health(options)
  }))

program
  .command('find')
  .description('🔍 Interactive advanced search')
  .action(wrapInteractive(async () => {
    await cortex.advancedSearch()
  }))

program
  .command('explore [nodeId]')
  .description('🗺️ Interactively explore graph connections')
  .action(wrapInteractive(async (nodeId) => {
    await cortex.explore(nodeId)
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

// ========================================
// AUGMENTATION MANAGEMENT (Direct Commands)
// ========================================

program
  .command('install <augmentation>')
  .description('📦 Install augmentation')
  .option('-m, --mode <type>', 'Installation mode (free|premium)', 'free')
  .option('-c, --config <json>', 'Configuration as JSON')
  .action(wrapAction(async (augmentation, options) => {
    if (augmentation === 'brain-jar') {
      await cortex.brainJarInstall(options.mode)
    } else {
      // Generic augmentation install
      let config = {}
      if (options.config) {
        try {
          config = JSON.parse(options.config)
        } catch {
          console.error(chalk.red('Invalid JSON configuration'))
          process.exit(1)
        }
      }
      await cortex.addAugmentation(augmentation, undefined, config)
    }
  }))

program
  .command('run <augmentation>')
  .description('⚡ Run augmentation')
  .option('-c, --config <json>', 'Runtime configuration as JSON')
  .action(wrapAction(async (augmentation, options) => {
    if (augmentation === 'brain-jar') {
      await cortex.brainJarStart(options)
    } else {
      // Generic augmentation execution
      const inputData = options.config ? JSON.parse(options.config) : { run: true }
      await cortex.executePipelineStep(augmentation, inputData)
    }
  }))

program
  .command('status [augmentation]')
  .description('📊 Show augmentation status')
  .action(wrapAction(async (augmentation) => {
    if (augmentation === 'brain-jar') {
      await cortex.brainJarStatus()
    } else if (augmentation) {
      // Show specific augmentation status
      await cortex.listAugmentations()
    } else {
      // Show all augmentation status
      await cortex.listAugmentations()
    }
  }))

program
  .command('stop [augmentation]')
  .description('⏹️ Stop augmentation')
  .action(wrapAction(async (augmentation) => {
    if (augmentation === 'brain-jar') {
      await cortex.brainJarStop()
    } else {
      console.log(chalk.yellow('Stop functionality for generic augmentations not yet implemented'))
    }
  }))

program
  .command('list')
  .description('📋 List installed augmentations')
  .option('-a, --available', 'Show available augmentations')
  .action(wrapAction(async (options) => {
    if (options.available) {
      console.log(chalk.cyan('🧩 Available Augmentations:'))
      console.log('  • brain-jar - AI coordination and collaboration')
      console.log('  • encryption - Data encryption and security')
      console.log('  • neural-import - AI-powered data analysis')
      console.log('  • performance-monitor - System monitoring')
      console.log('')
      console.log(chalk.dim('Install: brainy install <augmentation>'))
    } else {
      await cortex.listAugmentations()
    }
  }))

// ========================================
// BRAIN JAR SPECIFIC COMMANDS (Rich UX)
// ========================================

const brainJar = program.command('brain-jar')
  .description('🧠🫙 AI coordination and collaboration')

brainJar
  .command('install')
  .description('📦 Install Brain Jar coordination')
  .option('-m, --mode <type>', 'Installation mode (free|premium)', 'free')
  .action(wrapAction(async (options) => {
    await cortex.brainJarInstall(options.mode)
  }))

brainJar
  .command('start')
  .description('🚀 Start Brain Jar coordination')
  .option('-s, --server <url>', 'Custom server URL')
  .option('-n, --name <name>', 'Agent name')
  .option('-r, --role <role>', 'Agent role')
  .action(wrapAction(async (options) => {
    await cortex.brainJarStart(options)
  }))

brainJar
  .command('dashboard')
  .description('📊 Open Brain Jar dashboard')
  .option('-o, --open', 'Auto-open in browser', true)
  .action(wrapAction(async (options) => {
    await cortex.brainJarDashboard(options.open)
  }))

brainJar
  .command('status')
  .description('🔍 Show Brain Jar status')
  .action(wrapAction(async () => {
    await cortex.brainJarStatus()
  }))

brainJar
  .command('agents')
  .description('👥 List connected agents')
  .action(wrapAction(async () => {
    await cortex.brainJarAgents()
  }))

brainJar
  .command('message <text>')
  .description('📨 Send message to coordination channel')
  .action(wrapAction(async (text) => {
    await cortex.brainJarMessage(text)
  }))

brainJar
  .command('search <query>')
  .description('🔍 Search coordination history')
  .option('-l, --limit <number>', 'Number of results', '10')
  .action(wrapAction(async (query, options) => {
    await cortex.brainJarSearch(query, parseInt(options.limit))
  }))

// ========================================
// CONFIGURATION COMMANDS
// ========================================

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
  .action(wrapAction(async (key) => {
    const value = await cortex.configGet(key)
    if (value) {
      console.log(chalk.green(`${key}: ${value}`))
    } else {
      console.log(chalk.yellow(`Key not found: ${key}`))
    }
  }))

config
  .command('list')
  .description('List all configuration')
  .action(wrapAction(async () => {
    await cortex.configList()
  }))

// ========================================
// LEGACY CORTEX COMMANDS (Backward Compatibility)
// ========================================

const cortexCmd = program.command('cortex')
  .description('🔧 Legacy Cortex commands (deprecated - use direct commands)')

cortexCmd
  .command('chat [question]')
  .description('💬 Chat with your data')
  .action(wrapInteractive(async (question) => {
    console.log(chalk.yellow('⚠️  Deprecated: Use "brainy chat" instead'))
    await cortex.chat(question)
  }))

cortexCmd
  .command('add [data]')
  .description('📊 Add data')
  .action(wrapAction(async (data) => {
    console.log(chalk.yellow('⚠️  Deprecated: Use "brainy add" instead'))
    await cortex.add(data, {})
  }))

// ========================================
// INTERACTIVE SHELL
// ========================================

program
  .command('shell')
  .description('🐚 Interactive Brainy shell')
  .action(wrapInteractive(async () => {
    console.log(chalk.cyan('🧠 Brainy Interactive Shell'))
    console.log(chalk.dim('Type "help" for commands, "exit" to quit\n'))
    await cortex.chat()
  }))

// ========================================
// PARSE AND HANDLE
// ========================================

program.parse(process.argv)

// Show help if no command
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🧠 Brainy - Vector + Graph Database with AI Coordination'))
  console.log('')
  console.log(chalk.bold('Quick Start:'))
  console.log('  brainy init                    # Initialize project')
  console.log('  brainy add "some data"         # Add data')
  console.log('  brainy search "query"          # Search data')
  console.log('  brainy chat                    # Chat with data')
  console.log('')
  console.log(chalk.bold('AI Coordination:'))
  console.log('  brainy install brain-jar       # Install AI coordination')
  console.log('  brainy brain-jar start         # Start coordination')
  console.log('  brainy brain-jar dashboard     # View dashboard')
  console.log('')
  program.outputHelp()
}