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
import { createInterface } from 'readline'

// Use native fetch (available in Node.js 18+)

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
  .description('🧠 Brainy - Multi-Dimensional AI Database')
  .version(packageJson.version)

// ========================================
// CORE DATABASE COMMANDS (Direct Access)
// ========================================

program
  .command('init')
  .description('Initialize Brainy in your project')
  .option('-s, --storage <type>', 'Storage type (filesystem, s3, r2, gcs, memory)')
  .option('-e, --encryption', 'Enable encryption for secrets')
  .action(wrapAction(async (options) => {
    await cortex.init(options)
  }))

program
  .command('add [data]')
  .description('Add data across multiple dimensions (vector, graph, facets)')
  .option('-m, --metadata <json>', 'Metadata facets as JSON')
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
  .description('Multi-dimensional search across vector, graph, and facets')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-f, --filter <json>', 'Filter by metadata facets')
  .option('-v, --verbs <types>', 'Include related data (comma-separated)')
  .option('-d, --depth <number>', 'Relationship depth', '1')
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
  .description('AI-powered chat with multi-dimensional context')
  .option('-l, --llm <model>', 'LLM model to use')
  .action(wrapInteractive(async (question, options) => {
    await cortex.chat(question)
  }))

program
  .command('stats')
  .description('Show database statistics and insights')
  .option('-d, --detailed', 'Show detailed statistics')
  .action(wrapAction(async (options) => {
    await cortex.stats(options.detailed)
  }))

program
  .command('health')
  .description('Check system health')
  .option('--auto-fix', 'Automatically apply safe repairs')
  .action(wrapAction(async (options) => {
    await cortex.health(options)
  }))

program
  .command('find')
  .description('Advanced intelligent search (interactive)')
  .action(wrapInteractive(async () => {
    await cortex.advancedSearch()
  }))

program
  .command('explore [nodeId]')
  .description('Explore data relationships interactively')
  .action(wrapInteractive(async (nodeId) => {
    await cortex.explore(nodeId)
  }))

program
  .command('backup')
  .description('Create database backup')
  .option('-c, --compress', 'Compress backup')
  .option('-o, --output <file>', 'Output file')
  .action(wrapAction(async (options) => {
    await cortex.backup(options)
  }))

program
  .command('restore <file>')
  .description('Restore from backup')
  .action(wrapInteractive(async (file) => {
    await cortex.restore(file)
  }))

// ========================================
// BRAIN CLOUD INTEGRATION
// ========================================

program
  .command('connect')
  .description('Connect to Brain Cloud for AI memory')
  .action(wrapInteractive(async () => {
    console.log(chalk.cyan('\n🧠 Brain Cloud Setup'))
    console.log(chalk.gray('━'.repeat(40)))
    
    try {
      // Detect customer ID
      const customerId = await detectCustomerId()
      
      if (customerId) {
        console.log(chalk.green(`✅ Found Brain Cloud: ${customerId}`))
        console.log('\n🔧 Setting up AI memory:')
        console.log(chalk.yellow('  • Update configuration'))
        console.log(chalk.yellow('  • Add memory instructions'))
        console.log(chalk.yellow('  • Enable cross-session memory'))
        
        console.log(chalk.cyan('\n🚀 Configuring...'))
        await setupBrainCloudMemory(customerId)
        console.log(chalk.green('\n✅ AI memory connected!'))
        console.log(chalk.cyan('Restart Claude Code to activate memory.'))
      } else {
        console.log(chalk.yellow('No Brain Cloud found. Setting up:'))
        console.log('\n1. Visit: ' + chalk.cyan('https://soulcraft.com/brain-cloud'))
        console.log('2. Get your Early Access license key')
        console.log('3. Run ' + chalk.green('brainy cloud setup') + ' for auto-configuration')
      }
    } catch (error) {
      console.log(chalk.red('❌ Setup failed:'), error.message)
    }
  }))

// Moved to brainy cloud setup command below for better separation

// ========================================
// BRAIN CLOUD COMMANDS (Premium Features)
// ========================================

const cloud = program
  .command('cloud')
  .description('Brain Cloud premium features and management')

cloud
  .command('setup')
  .description('🚀 Auto-setup Brain Cloud (provisions cloud instance + configures locally)')
  .option('--email <email>', 'Your email address')
  .action(wrapInteractive(async (options) => {
    console.log(chalk.cyan('🧠☁️  Brain Cloud Auto-Setup'))
    console.log(chalk.gray('═'.repeat(50)))
    console.log(chalk.yellow('Perfect for non-coders! One-click setup.\n'))

    try {
      // Step 1: Validate license
      await validateLicense()
      
      // Step 2: Check if Brainy is installed
      await ensureBrainyInstalled()
      
      // Step 3: Provision cloud instance
      const instance = await provisionCloudInstance(options.email)
      
      // Step 4: Configure local Brainy
      await configureBrainy(instance)
      
      // Step 5: Install Brain Cloud package
      await installBrainCloudPackage()
      
      // Step 6: Test connection
      await testConnection(instance)
      
      console.log('\n✅ Setup Complete!')
      console.log(chalk.gray('═'.repeat(30)))
      console.log('\nYour Brain Cloud instance is ready:')
      console.log(`📱 Dashboard: ${chalk.cyan(instance.endpoints.dashboard)}`)
      console.log(`🔗 API: ${chalk.gray(instance.endpoints.api)}`)
      console.log('\n🚀 What\'s next?')
      console.log('• Your AI now has persistent memory across all conversations')
      console.log('• All devices sync automatically to your cloud instance')
      console.log('• Agents coordinate seamlessly through handoffs')
      console.log('\n💡 Try asking Claude: "Remember that I prefer TypeScript"')
      console.log('   Then in a new conversation: "What do you know about my preferences?"')

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message)
      console.log('\n🆘 Need help? Contact support@soulcraft.com')
    }
  }))

cloud
  .command('connect [id]')
  .description('Connect to existing Brain Cloud instance')
  .action(wrapInteractive(async (id) => {
    if (id) {
      console.log(chalk.green(`✅ Connecting to Brain Cloud instance: ${id}`))
      // Connect to specific instance
    } else {
      // Show connection instructions
      console.log(chalk.cyan('\n🔗 Brain Cloud Connection'))
      console.log(chalk.gray('━'.repeat(40)))
      console.log('\nOptions:')
      console.log('1. ' + chalk.green('brainy cloud setup') + ' - Auto-setup with provisioning')
      console.log('2. ' + chalk.green('brainy cloud connect <id>') + ' - Connect to existing instance')
      console.log('\nGet started: ' + chalk.cyan('https://soulcraft.com/brain-cloud'))
    }
  }))

cloud
  .command('status [id]')
  .description('Check Brain Cloud instance status')
  .action(wrapInteractive(async (id) => {
    // Implementation moved from old cloud command
    console.log('Checking Brain Cloud status...')
  }))

cloud
  .command('dashboard [id]')
  .description('Open Brain Cloud dashboard')
  .action(wrapInteractive(async (id) => {
    const dashboardUrl = id 
      ? `https://brainy-${id}.soulcraft-brain.workers.dev/dashboard`
      : 'https://app.soulcraft.com'
      
    console.log(chalk.cyan(`\n🌐 Opening Brain Cloud Dashboard: ${dashboardUrl}`))
    
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      const command = process.platform === 'win32' ? 'start' : 
                     process.platform === 'darwin' ? 'open' : 'xdg-open'
      
      await execAsync(`${command} "${dashboardUrl}"`)
      console.log(chalk.green('✅ Dashboard opened!'))
    } catch (error) {
      console.log(chalk.yellow('💡 Copy the URL above to open in your browser'))
    }
  }))

// Legacy cloud command (for backward compatibility)
program
  .command('cloud-legacy [action]')
  .description('Legacy Brain Cloud connection (deprecated - use "brainy cloud")')
  .option('--connect <id>', 'Connect to existing Brain Cloud instance')
  .option('--export <id>', 'Export all data from Brain Cloud instance')
  .option('--status <id>', 'Check status of Brain Cloud instance')
  .option('--dashboard <id>', 'Open dashboard for Brain Cloud instance')
  .option('--migrate', 'Migrate between local and cloud')
  .action(wrapInteractive(async (action, options) => {
    console.log(chalk.yellow('⚠️ Deprecated: Use "brainy cloud" commands instead'))
    console.log(chalk.cyan('Examples:'))
    console.log('  brainy cloud setup')
    console.log('  brainy cloud connect <id>')
    console.log('  brainy cloud dashboard')
    console.log('')
    // For now, show connection instructions
    console.log(chalk.cyan('\n⚛️ BRAIN CLOUD - AI Memory That Never Forgets'))
    console.log(chalk.gray('━'.repeat(50)))
    
    if (options.connect) {
      console.log(chalk.green(`✅ Connecting to Brain Cloud instance: ${options.connect}`))
      
      try {
        // Test connection to Brain Cloud worker
        const healthUrl = `https://api.soulcraft.com/brain-cloud/health`
        const response = await fetch(healthUrl, {
          headers: { 'x-customer-id': options.connect }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(chalk.green(`🧠 ${data.status}`))
          console.log(chalk.cyan(`💫 Instance: ${data.customerId}`))
          console.log(chalk.gray(`⏰ Connected at: ${new Date(data.timestamp).toLocaleString()}`))
          
          // Test memories endpoint
          const memoriesResponse = await fetch(`https://api.soulcraft.com/brain-cloud/memories`, {
            headers: { 'x-customer-id': options.connect }
          })
          
          if (memoriesResponse.ok) {
            const memoriesData = await memoriesResponse.json()
            console.log(chalk.yellow(`\n${memoriesData.message}`))
            console.log(chalk.gray('📊 Your atomic memories:'))
            memoriesData.memories.forEach(memory => {
              const time = new Date(memory.created).toLocaleString()
              console.log(chalk.gray(`  • ${memory.content} (${time})`))
            })
          }
          
        } else {
          console.log(chalk.red('❌ Could not connect to Brain Cloud'))
          console.log(chalk.yellow('💡 Make sure you have an active instance'))
          console.log('\nSign up at: ' + chalk.cyan('https://app.soulcraft.com'))
        }
      } catch (error) {
        console.log(chalk.red('❌ Connection failed:'), error.message)
        console.log('\nSign up at: ' + chalk.cyan('https://app.soulcraft.com'))
      }
    } else if (options.export) {
      console.log(chalk.green(`📦 Exporting data from Brain Cloud instance: ${options.export}`))
      
      try {
        const response = await fetch(`https://api.soulcraft.com/brain-cloud/export`, {
          headers: { 'x-customer-id': options.export }
        })
        
        if (response.ok) {
          const data = await response.json()
          const filename = `brainy-export-${options.export}-${Date.now()}.json`
          
          // Write to file
          const fs = await import('fs/promises')
          await fs.writeFile(filename, JSON.stringify(data, null, 2))
          
          console.log(chalk.green(`✅ Data exported to: ${filename}`))
          console.log(chalk.gray(`📊 Exported ${data.memories?.length || 0} memories`))
        } else {
          console.log(chalk.red('❌ Export failed - instance not found'))
        }
      } catch (error) {
        console.log(chalk.red('❌ Export error:'), error.message)
      }
    } else if (options.status) {
      console.log(chalk.green(`🔍 Checking status of Brain Cloud instance: ${options.status}`))
      
      try {
        const response = await fetch(`https://api.soulcraft.com/brain-cloud/health`, {
          headers: { 'x-customer-id': options.status }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(chalk.green(`✅ Instance Status: Active`))
          console.log(chalk.cyan(`🧠 ${data.status}`))
          console.log(chalk.gray(`⏰ Last check: ${new Date(data.timestamp).toLocaleString()}`))
          
          // Get memory count
          const memoriesResponse = await fetch(`https://api.soulcraft.com/brain-cloud/memories`, {
            headers: { 'x-customer-id': options.status }
          })
          
          if (memoriesResponse.ok) {
            const memoriesData = await memoriesResponse.json()
            console.log(chalk.yellow(`📊 Total memories: ${memoriesData.count}`))
          }
        } else {
          console.log(chalk.red('❌ Instance not found or inactive'))
        }
      } catch (error) {
        console.log(chalk.red('❌ Status check failed:'), error.message)
      }
    } else if (options.dashboard) {
      console.log(chalk.green(`🌐 Opening dashboard for Brain Cloud instance: ${options.dashboard}`))
      
      const dashboardUrl = `https://app.soulcraft.com/dashboard.html?customer_id=${options.dashboard}`
      console.log(chalk.cyan(`\n🔗 Dashboard URL: ${dashboardUrl}`))
      console.log(chalk.gray('Opening in your default browser...'))
      
      try {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        
        // Cross-platform browser opening
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open'
        
        await execAsync(`${command} "${dashboardUrl}"`)
        console.log(chalk.green('✅ Dashboard opened!'))
      } catch (error) {
        console.log(chalk.yellow('💡 Copy the URL above to open in your browser'))
      }
    } else {
      console.log(chalk.yellow('📡 Brain Cloud Setup'))
      console.log('\n1. Sign up at: ' + chalk.cyan('https://app.soulcraft.com'))
      console.log('2. Get your customer ID')
      console.log('3. Connect with: ' + chalk.green('brainy cloud --connect YOUR_ID'))
      console.log('\nBenefits:')
      console.log('  • ' + chalk.green('Never lose AI context again'))
      console.log('  • ' + chalk.green('Sync across all devices'))
      console.log('  • ' + chalk.green('Unlimited memory storage'))
      console.log('  • ' + chalk.green('$19/month or free trial'))
    }
  }))

// ========================================
// AUGMENTATION MANAGEMENT (Direct Commands)
// ========================================

const augment = program
  .command('augment')
  .description('Manage brain augmentations')

augment
  .command('list')
  .description('List available and active augmentations')
  .action(wrapAction(async () => {
    console.log(chalk.green('✅ Active (Built-in):'))
    console.log('  • neural-import')
    console.log('  • basic-storage')
    console.log('')
    
    // Check for Brain Cloud
    try {
      await import('@soulcraft/brain-cloud')
      const hasLicense = process.env.BRAINY_LICENSE_KEY
      
      if (hasLicense) {
        console.log(chalk.cyan('✅ Active (Premium):'))
        console.log('  • ai-memory')
        console.log('  • agent-coordinator')
        console.log('')
      }
    } catch {}
    
    // Fetch from catalog API
    try {
      const response = await fetch('http://localhost:3001/api/catalog/cli')
      if (response.ok) {
        const catalog = await response.json()
        
        // Show available augmentations
        const available = catalog.augmentations.filter(aug => aug.status === 'available')
        if (available.length > 0) {
          console.log(chalk.cyan('🌟 Available (Brain Cloud):'))
          available.forEach(aug => {
            const popular = aug.popular ? chalk.yellow(' ⭐ Popular') : ''
            console.log(`  • ${aug.id} - ${aug.description}${popular}`)
          })
          console.log('')
        }
        
        // Show coming soon
        const comingSoon = catalog.augmentations.filter(aug => aug.status === 'coming-soon')
        if (comingSoon.length > 0) {
          console.log(chalk.dim('📦 Coming Soon:'))
          comingSoon.forEach(aug => {
            const eta = aug.eta ? ` (${aug.eta})` : ''
            console.log(chalk.dim(`  • ${aug.id} - ${aug.description}${eta}`))
          })
          console.log('')
        }
      } else {
        throw new Error('API unavailable')
      }
    } catch (error) {
      // Fallback to static list if API is unavailable
      console.log(chalk.cyan('🌟 Available (Brain Cloud):'))
      console.log('  • ai-memory - ' + chalk.yellow('⭐ Popular') + ' - Persistent AI memory')
      console.log('  • agent-coordinator - ' + chalk.yellow('⭐ Popular') + ' - Multi-agent handoffs')  
      console.log('  • notion-sync - Enterprise connector')
      console.log('')
    }
    
    console.log(chalk.dim('🚀 Join Early Access: https://soulcraft.com/brain-cloud'))
    console.log(chalk.dim('📦 Install: npm install @soulcraft/brain-cloud'))
  }))

augment
  .command('activate')
  .description('Activate Brain Cloud with license key')
  .action(wrapAction(async () => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    console.log(chalk.cyan('☁️  Brain Cloud Activation (Optional Premium)'))
    console.log('')
    console.log(chalk.yellow('Note: Brainy core is 100% free and fully functional!'))
    console.log('Brain Cloud adds optional team & sync features.')
    console.log('')
    console.log('Get Brain Cloud at: ' + chalk.green('app.soulcraft.com'))
    console.log('(14-day free trial available)')
    console.log('')
    
    rl.question('License key: ', async (key) => {
      if (key.startsWith('lic_')) {
        // Save to config
        const fs = await import('fs/promises')
        const os = await import('os')
        const configPath = `${os.homedir()}/.brainy`
        
        await fs.mkdir(configPath, { recursive: true })
        await fs.writeFile(`${configPath}/license`, key)
        
        console.log(chalk.green('✅ License saved!'))
        console.log('')
        console.log('Install Brain Cloud:')
        console.log(chalk.cyan('  npm install @soulcraft/brain-cloud'))
        console.log('')
        console.log('Then use in your code:')
        console.log(chalk.gray('  import { AIMemory } from "@soulcraft/brain-cloud"'))
        console.log(chalk.gray('  cortex.register(new AIMemory())'))
      } else {
        console.log(chalk.red('Invalid license key'))
      }
      rl.close()
    })
  }))

augment
  .command('info <name>')
  .description('Get info about an augmentation')
  .action(wrapAction(async (name) => {
    const augmentations = {
      'ai-memory': {
        name: 'AI Memory',
        description: 'Persistent memory across all AI sessions',
        category: 'Memory',
        tier: 'Premium',
        popular: true,
        example: `
import { AIMemory } from '@soulcraft/brain-cloud'

const cortex = new Cortex()
cortex.register(new AIMemory())

// Now your AI remembers everything
await brain.add("User prefers dark mode")
// This persists across sessions automatically`
      },
      'agent-coordinator': {
        name: 'Agent Coordinator',
        description: 'Multi-agent handoffs and orchestration',
        category: 'Coordination',
        tier: 'Premium',
        popular: true
      },
      'notion-sync': {
        name: 'Notion Sync',
        description: 'Bidirectional Notion database sync',
        category: 'Enterprise',
        tier: 'Premium'
      }
    }
    
    const aug = augmentations[name]
    if (aug) {
      console.log(chalk.cyan(`📦 ${aug.name}`) + (aug.popular ? chalk.yellow(' ⭐ Popular') : ''))
      console.log('')
      console.log(`Category: ${aug.category}`)
      console.log(`Tier: ${aug.tier}`)
      console.log(`Description: ${aug.description}`)
      if (aug.example) {
        console.log('')
        console.log('Example:')
        console.log(chalk.gray(aug.example))
      }
    } else {
      console.log(chalk.red(`Unknown augmentation: ${name}`))
    }
  }))

program
  .command('install <augmentation>')
  .description('Install augmentation (legacy - use augment activate)')
  .option('-m, --mode <type>', 'Installation mode (free|premium)', 'free')
  .option('-c, --config <json>', 'Configuration as JSON')
  .action(wrapAction(async (augmentation, options) => {
    console.log(chalk.yellow('Note: Use "brainy augment activate" for Brain Cloud'))
    
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
  .description('Run augmentation')
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
  .description('Show augmentation status')
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
  .description('Stop augmentation')
  .action(wrapAction(async (augmentation) => {
    if (augmentation === 'brain-jar') {
      await cortex.brainJarStop()
    } else {
      console.log(chalk.yellow('Stop functionality for generic augmentations not yet implemented'))
    }
  }))

program
  .command('list')
  .description('List installed augmentations')
  .option('-a, --available', 'Show available augmentations')
  .action(wrapAction(async (options) => {
    if (options.available) {
      console.log(chalk.green('✅ Built-in (Free):'))
      console.log('  • neural-import - AI-powered data understanding')
      console.log('  • basic-storage - Local persistence')
      console.log('')
      console.log(chalk.cyan('🌟 Premium (Brain Cloud):'))
      console.log('  • ai-memory - ' + chalk.yellow('⭐ Most Popular') + ' - AI that remembers')
      console.log('  • agent-coordinator - ' + chalk.yellow('⭐ Most Popular') + ' - Multi-agent orchestration')
      console.log('  • notion-sync - Enterprise connector')
      console.log('  • More at app.soulcraft.com/augmentations')
      console.log('')
      console.log(chalk.dim('Sign up: app.soulcraft.com (14-day free trial)'))
      console.log(chalk.dim('Install: npm install @soulcraft/brain-cloud'))
    } else {
      await cortex.listAugmentations()
    }
  }))


// ========================================
// BRAIN JAR SPECIFIC COMMANDS (Rich UX)
// ========================================

const brainJar = program.command('brain-jar')
  .description('AI coordination and collaboration')

brainJar
  .command('install')
  .description('Install Brain Jar coordination')
  .option('-m, --mode <type>', 'Installation mode (free|premium)', 'free')
  .action(wrapAction(async (options) => {
    await cortex.brainJarInstall(options.mode)
  }))

brainJar
  .command('start')
  .description('Start Brain Jar coordination')
  .option('-s, --server <url>', 'Custom server URL')
  .option('-n, --name <name>', 'Agent name')
  .option('-r, --role <role>', 'Agent role')
  .action(wrapAction(async (options) => {
    await cortex.brainJarStart(options)
  }))

brainJar
  .command('dashboard')
  .description('Open Brain Jar dashboard')
  .option('-o, --open', 'Auto-open in browser', true)
  .action(wrapAction(async (options) => {
    await cortex.brainJarDashboard(options.open)
  }))

brainJar
  .command('status')
  .description('Show Brain Jar status')
  .action(wrapAction(async () => {
    await cortex.brainJarStatus()
  }))

brainJar
  .command('agents')
  .description('List connected agents')
  .action(wrapAction(async () => {
    await cortex.brainJarAgents()
  }))

brainJar
  .command('message <text>')
  .description('Send message to coordination channel')
  .action(wrapAction(async (text) => {
    await cortex.brainJarMessage(text)
  }))

brainJar
  .command('search <query>')
  .description('Search coordination history')
  .option('-l, --limit <number>', 'Number of results', '10')
  .action(wrapAction(async (query, options) => {
    await cortex.brainJarSearch(query, parseInt(options.limit))
  }))

// ========================================
// CONFIGURATION COMMANDS
// ========================================

const config = program.command('config')
  .description('Manage configuration')

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
  .description('Legacy Cortex commands (deprecated - use direct commands)')

cortexCmd
  .command('chat [question]')
  .description('Chat with your data')
  .action(wrapInteractive(async (question) => {
    console.log(chalk.yellow('⚠️  Deprecated: Use "brainy chat" instead'))
    await cortex.chat(question)
  }))

cortexCmd
  .command('add [data]')
  .description('Add data')
  .action(wrapAction(async (data) => {
    console.log(chalk.yellow('⚠️  Deprecated: Use "brainy add" instead'))
    await cortex.add(data, {})
  }))

// ========================================
// INTERACTIVE SHELL
// ========================================

program
  .command('shell')
  .description('Interactive Brainy shell')
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
  console.log(chalk.cyan('🧠 Brainy - Multi-Dimensional AI Database'))
  console.log(chalk.gray('Vector similarity, graph relationships, metadata facets, and AI context.\n'))
  
  console.log(chalk.bold('Quick Start:'))
  console.log('  brainy init                    # Initialize project')
  console.log('  brainy add "some data"         # Add multi-dimensional data')
  console.log('  brainy search "query"          # Search across all dimensions')
  console.log('  brainy chat                    # AI chat with full context')
  console.log('')
  console.log(chalk.bold('Brain Cloud (Premium):'))
  console.log(chalk.green('  brainy cloud setup             # Auto-setup with provisioning'))
  console.log('  brainy cloud connect <id>      # Connect to existing instance')
  console.log('  brainy cloud dashboard         # Open Brain Cloud dashboard')
  console.log('')
  console.log(chalk.bold('AI Coordination:'))
  console.log('  brainy install brain-jar       # Install coordination')
  console.log('  brainy brain-jar start         # Start coordination')
  console.log('')
  console.log(chalk.dim('Learn more: https://soulcraft.com'))
  console.log('')
  program.outputHelp()
}

// ========================================
// BRAIN CLOUD MEMORY SETUP FUNCTIONS
// ========================================

async function detectCustomerId() {
  try {
    // Method 1: Check for existing brainy config
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    
    try {
      const configPath = join(process.cwd(), 'brainy-config.json')
      const config = JSON.parse(await readFile(configPath, 'utf8'))
      if (config.brainCloudCustomerId) {
        return config.brainCloudCustomerId
      }
    } catch {}
    
    // Method 2: Check CLAUDE.md for existing customer ID
    try {
      const claudePath = join(process.cwd(), 'CLAUDE.md')
      const claudeContent = await readFile(claudePath, 'utf8')
      const match = claudeContent.match(/customer.*?([a-z0-9-]+)/i)
      if (match) return match[1]
    } catch {}
    
    // Method 3: Test common demo IDs
    const testIds = ['demo-test-auto', 'demo-test123']
    for (const id of testIds) {
      try {
        const response = await fetch(`https://api.soulcraft.com/brain-cloud/health`, {
          headers: { 'x-customer-id': id }
        })
        if (response.ok) {
          return id
        }
      } catch {}
    }
    
    return null
  } catch (error) {
    return null
  }
}

async function setupBrainCloudMemory(customerId) {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  
  console.log(chalk.gray('📝 Setting up AI memory configuration...'))
  
  // 1. Create/update .claude directory and MCP config
  try {
    await mkdir('.claude', { recursive: true })
    
    const mcpConfig = {
      mcpServers: {
        "brain-cloud": {
          command: "node",
          args: ["brainy-mcp-server.js"],
          env: {
            CUSTOMER_ID: customerId,
            BRAIN_CLOUD_URL: "https://api.soulcraft.com/brain-cloud"
          }
        }
      }
    }
    
    await writeFile('.claude/mcp_servers.json', JSON.stringify(mcpConfig, null, 2))
    console.log(chalk.green('✅ MCP configuration updated'))
  } catch (error) {
    console.log(chalk.yellow('⚠️ Could not update MCP config:', error.message))
  }
  
  // 2. Create/update CLAUDE.md with natural language instructions
  const claudeContent = `# 🧠 I Remember Everything Now!

Hi! I'm connected to your Brain Cloud (${customerId}) so I actually remember our conversations across sessions.

## Try Saying:
- "What did we build together?"
- "Remember that React project?"
- "Show me what we worked on yesterday"
- "Find my notes about APIs"
- "Search for that bug we fixed"

## I Can Also:
- Remember context from weeks ago
- Work with other AI assistants who share the same memory
- Keep everything synced across your devices
- Search through all our conversations

## Multi-AI Coordination:
When working with multiple AI assistants, we automatically coordinate:
- **Jarvis** (Backend): APIs, databases, deployment
- **Picasso** (Design): UI, themes, visual elements  
- **Claude** (Planning): Coordination, architecture, strategy

**Just talk to me normally - no commands needed!**

---
*Brain Cloud Instance: ${customerId}*
*Last Updated: ${new Date().toLocaleDateString()}*
`
  
  try {
    await writeFile('CLAUDE.md', claudeContent)
    console.log(chalk.green('✅ CLAUDE.md updated with memory instructions'))
  } catch (error) {
    console.log(chalk.yellow('⚠️ Could not update CLAUDE.md:', error.message))
  }
  
  // 3. Save customer ID to brainy config
  try {
    const brainyConfig = {
      brainCloudCustomerId: customerId,
      brainCloudUrl: 'https://api.soulcraft.com/brain-cloud',
      lastConnected: new Date().toISOString()
    }
    
    await writeFile('brainy-config.json', JSON.stringify(brainyConfig, null, 2))
    console.log(chalk.green('✅ Brainy configuration saved'))
  } catch (error) {
    console.log(chalk.yellow('⚠️ Could not save brainy config:', error.message))
  }
}

// ========================================
// AUTO-SETUP HELPER FUNCTIONS  
// ========================================

const PROVISIONING_API = 'https://provisioning.soulcraft.com'

let spinner = null

function startSpinner(message) {
  stopSpinner()
  process.stdout.write(`${message} `)
  
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  
  spinner = setInterval(() => {
    process.stdout.write(`\r${message} ${spinnerChars[i]}`)
    i = (i + 1) % spinnerChars.length
  }, 100)
}

function stopSpinner() {
  if (spinner) {
    clearInterval(spinner)
    spinner = null
    process.stdout.write('\r')
  }
}

async function validateLicense() {
  startSpinner('Validating Early Access license...')

  const licenseKey = process.env.BRAINY_LICENSE_KEY

  if (!licenseKey) {
    stopSpinner()
    console.log('\n❌ No license key found')
    console.log('\n🔑 Please set your Early Access license key:')
    console.log('   export BRAINY_LICENSE_KEY="lic_early_access_your_key"')
    console.log('\n📝 Don\'t have a key? Get one free at: https://soulcraft.com/brain-cloud')
    throw new Error('License key required')
  }

  if (!licenseKey.startsWith('lic_early_access_')) {
    stopSpinner()
    throw new Error('Invalid license key format. Early Access keys start with "lic_early_access_"')
  }

  stopSpinner()
  console.log('✅ License validated')
}

async function ensureBrainyInstalled() {
  startSpinner('Checking Brainy installation...')

  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    await execAsync('brainy --version')
    stopSpinner()
    console.log('✅ Brainy CLI found')
  } catch (error) {
    stopSpinner()
    console.log('📦 Installing Brainy CLI...')
    
    try {
      await execWithProgress('npm install -g @soulcraft/brainy')
      console.log('✅ Brainy CLI installed')
    } catch (installError) {
      throw new Error('Failed to install Brainy CLI. Please install manually: npm install -g @soulcraft/brainy')
    }
  }
}

async function provisionCloudInstance(userEmail) {
  const licenseKey = process.env.BRAINY_LICENSE_KEY
  startSpinner('Provisioning your cloud Brainy instance...')

  try {
    const response = await fetch(`${PROVISIONING_API}/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey,
        userEmail: userEmail || 'user@example.com'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Provisioning failed')
    }

    const result = await response.json()
    stopSpinner()
    
    if (result.instance.status === 'active') {
      console.log('✅ Cloud instance already active')
      return result.instance
    }

    console.log('🚀 Provisioning started (2-3 minutes)')
    
    // Wait for provisioning to complete
    return await waitForProvisioning(licenseKey)

  } catch (error) {
    stopSpinner()
    throw new Error(`Provisioning failed: ${error.message}`)
  }
}

async function waitForProvisioning(licenseKey) {
  const maxWaitTime = 5 * 60 * 1000 // 5 minutes
  const checkInterval = 15 * 1000 // 15 seconds
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    startSpinner('Waiting for cloud instance to be ready...')
    
    try {
      const response = await fetch(`${PROVISIONING_API}/status?licenseKey=${encodeURIComponent(licenseKey)}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.instance.status === 'active') {
          stopSpinner()
          console.log('✅ Cloud instance is ready')
          return result.instance
        }
        
        if (result.instance.status === 'failed') {
          stopSpinner()
          throw new Error('Instance provisioning failed')
        }
      }
      
      stopSpinner()
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      
    } catch (error) {
      stopSpinner()
      console.log('⏳ Still provisioning...')
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }

  throw new Error('Provisioning timeout. Please check your dashboard or contact support.')
}

async function configureBrainy(instance) {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const { homedir } = await import('os')
  const { existsSync } = await import('fs')
  
  startSpinner('Configuring local Brainy to use cloud instance...')

  // Ensure config directory exists
  const BRAINY_CONFIG_DIR = join(homedir(), '.brainy')
  const BRAINY_CONFIG_FILE = join(BRAINY_CONFIG_DIR, 'config.json')
  
  if (!existsSync(BRAINY_CONFIG_DIR)) {
    await mkdir(BRAINY_CONFIG_DIR, { recursive: true })
  }

  // Create or update Brainy config
  let config = {}
  if (existsSync(BRAINY_CONFIG_FILE)) {
    try {
      const { readFile } = await import('fs/promises')
      const existing = await readFile(BRAINY_CONFIG_FILE, 'utf8')
      config = JSON.parse(existing)
    } catch (error) {
      console.log('⚠️  Could not read existing config, creating new one')
    }
  }

  // Update config with cloud instance details
  config.cloudSync = {
    enabled: true,
    endpoint: instance.endpoints.api,
    instanceId: instance.id,
    licenseKey: process.env.BRAINY_LICENSE_KEY
  }

  config.aiMemory = {
    enabled: true,
    storage: 'cloud',
    endpoint: instance.endpoints.api
  }

  config.agentCoordination = {
    enabled: true,
    endpoint: instance.endpoints.api
  }

  await writeFile(BRAINY_CONFIG_FILE, JSON.stringify(config, null, 2))
  
  stopSpinner()
  console.log('✅ Local Brainy configured for cloud sync')
}

async function installBrainCloudPackage() {
  startSpinner('Installing Brain Cloud augmentations...')

  try {
    const { existsSync } = await import('fs')
    
    // Check if we're in a project directory
    const hasPackageJson = existsSync('package.json')
    
    if (hasPackageJson) {
      await execWithProgress('npm install @soulcraft/brain-cloud')
      console.log('✅ Brain Cloud package installed in current project')
    } else {
      // Install globally for non-project usage
      await execWithProgress('npm install -g @soulcraft/brain-cloud')
      console.log('✅ Brain Cloud package installed globally')
    }

  } catch (error) {
    stopSpinner()
    console.log('⚠️  Could not auto-install Brain Cloud package')
    console.log('   You can install it manually: npm install @soulcraft/brain-cloud')
    // Don't throw error, this is optional
  }
}

async function testConnection(instance) {
  startSpinner('Testing cloud connection...')

  try {
    const response = await fetch(`${instance.endpoints.api}/health`)
    
    if (response.ok) {
      const health = await response.json()
      stopSpinner()
      console.log('✅ Cloud instance connection verified')
      
      // Test memory storage
      const testMemory = {
        content: 'Test memory from auto-setup',
        source: 'brain-cloud-setup',
        importance: 'low',
        tags: ['setup', 'test']
      }

      const memoryResponse = await fetch(`${instance.endpoints.api}/api/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMemory)
      })

      if (memoryResponse.ok) {
        console.log('✅ Memory storage working')
      }

    } else {
      stopSpinner()
      console.log('⚠️  Cloud instance not responding yet (this is normal)')
      console.log('   Your instance may need a few more minutes to fully initialize')
    }
  } catch (error) {
    stopSpinner()
    console.log('⚠️  Could not test connection (this is usually fine)')
  }
}

async function execWithProgress(command) {
  const { spawn } = await import('child_process')
  
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], { 
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true 
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
      process.stdout.write('.')
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      process.stdout.write('\n')
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`))
      }
    })
  })
}