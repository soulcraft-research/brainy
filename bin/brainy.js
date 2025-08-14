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
  .description('Show brain status and health')
  .option('-v, --verbose', 'Detailed information')
  .action(wrapAction(async (options) => {
    console.log(colors.primary('🧠 Brain Status'))
    console.log(colors.primary('=' .repeat(50)))
    
    try {
      const { BrainyData } = await import('../dist/brainyData.js')
      const brainy = new BrainyData()
      await brainy.init()
      
      // Get basic stats
      const stats = await brainy.getStatistics()
      console.log(colors.success('💚 Status: Healthy'))
      console.log(colors.info(`📊 Items: ${stats.total || 0}`))
      console.log(colors.info(`🧠 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`))
      
      if (options.verbose) {
        console.log(colors.info('\n📋 Detailed Statistics:'))
        console.log(JSON.stringify(stats, null, 2))
        
        console.log(colors.info('\n🔌 Active Augmentations:'))
        const augmentations = cortex.getAllAugmentations()
        if (augmentations.length === 0) {
          console.log(colors.warning('  No augmentations active'))
        } else {
          augmentations.forEach(aug => {
            console.log(colors.success(`  ✅ ${aug.name}`))
          })
        }
      }
    } catch (error) {
      console.log(colors.error('❌ Status: Error'))
      console.log(colors.error(error.message))
    }
  }))

// Command 5: HELP - Interactive guidance
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
    console.log(colors.info('5. Show all commands'))
    console.log()
    
    const choice = await new Promise(resolve => {
      rl.question(colors.primary('Enter your choice (1-5): '), (answer) => {
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
        console.log(colors.info('Shows your brain health and statistics'))
        break
      case '5':
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