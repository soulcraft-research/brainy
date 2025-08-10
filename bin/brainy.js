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
// BRAIN CLOUD INTEGRATION
// ========================================

program
  .command('connect')
  .description('🔗 Connect me to your Brain Cloud so I remember everything')
  .action(wrapInteractive(async () => {
    console.log(chalk.cyan('\n🧠 Setting Up AI Memory...'))
    console.log(chalk.gray('━'.repeat(50)))
    
    try {
      // Detect customer ID
      const customerId = await detectCustomerId()
      
      if (customerId) {
        console.log(chalk.green(`✅ Found your Brain Cloud: ${customerId}`))
        console.log('\n🔧 I can set up AI memory so I remember our conversations:')
        console.log(chalk.yellow('  • Update Claude configuration'))
        console.log(chalk.yellow('  • Add memory instructions'))
        console.log(chalk.yellow('  • Enable cross-session memory'))
        
        // For now, auto-proceed (in a real CLI environment, user could be prompted)
        console.log(chalk.cyan('\n🚀 Setting up AI memory...'))
        const proceed = true
        
        if (proceed) {
          await setupBrainCloudMemory(customerId)
          console.log(chalk.green('\n🎉 AI Memory Connected!'))
          console.log(chalk.cyan('Restart Claude Code and I\'ll remember everything!'))
        }
      } else {
        console.log(chalk.yellow('🤔 No Brain Cloud found. Let me help you set one up:'))
        console.log('\n1. Visit: ' + chalk.cyan('https://app.soulcraftlabs.com'))
        console.log('2. Sign up for Brain Cloud ($19/month)')
        console.log('3. Run ' + chalk.green('brainy connect') + ' again')
      }
    } catch (error) {
      console.log(chalk.red('❌ Setup failed:'), error.message)
    }
  }))

program
  .command('cloud [action]')
  .description('☁️ Connect to Brain Cloud - AI memory that never forgets')
  .option('--connect <id>', 'Connect to existing Brain Cloud instance')
  .option('--export <id>', 'Export all data from Brain Cloud instance')
  .option('--status <id>', 'Check status of Brain Cloud instance')
  .option('--dashboard <id>', 'Open dashboard for Brain Cloud instance')
  .option('--migrate', 'Migrate between local and cloud')
  .action(wrapInteractive(async (action, options) => {
    // For now, show connection instructions
    console.log(chalk.cyan('\n⚛️ BRAIN CLOUD - AI Memory That Never Forgets'))
    console.log(chalk.gray('━'.repeat(50)))
    
    if (options.connect) {
      console.log(chalk.green(`✅ Connecting to Brain Cloud instance: ${options.connect}`))
      
      try {
        // Test connection to Brain Cloud worker
        const healthUrl = `https://brain-cloud.dpsifr.workers.dev/health`
        const response = await fetch(healthUrl, {
          headers: { 'x-customer-id': options.connect }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(chalk.green(`🧠 ${data.status}`))
          console.log(chalk.cyan(`💫 Instance: ${data.customerId}`))
          console.log(chalk.gray(`⏰ Connected at: ${new Date(data.timestamp).toLocaleString()}`))
          
          // Test memories endpoint
          const memoriesResponse = await fetch(`https://brain-cloud.dpsifr.workers.dev/memories`, {
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
          console.log('\nSign up at: ' + chalk.cyan('https://app.soulcraftlabs.com'))
        }
      } catch (error) {
        console.log(chalk.red('❌ Connection failed:'), error.message)
        console.log('\nSign up at: ' + chalk.cyan('https://app.soulcraftlabs.com'))
      }
    } else if (options.export) {
      console.log(chalk.green(`📦 Exporting data from Brain Cloud instance: ${options.export}`))
      
      try {
        const response = await fetch(`https://brain-cloud.dpsifr.workers.dev/export`, {
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
        const response = await fetch(`https://brain-cloud.dpsifr.workers.dev/health`, {
          headers: { 'x-customer-id': options.status }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(chalk.green(`✅ Instance Status: Active`))
          console.log(chalk.cyan(`🧠 ${data.status}`))
          console.log(chalk.gray(`⏰ Last check: ${new Date(data.timestamp).toLocaleString()}`))
          
          // Get memory count
          const memoriesResponse = await fetch(`https://brain-cloud.dpsifr.workers.dev/memories`, {
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
      
      const dashboardUrl = `https://app.soulcraftlabs.com/dashboard.html?customer_id=${options.dashboard}`
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
      console.log('\n1. Sign up at: ' + chalk.cyan('https://app.soulcraftlabs.com'))
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
// BRAIN CLOUD SUPER COMMAND (New!)
// ========================================

program
  .command('cloud')
  .description('☁️ Setup Brain Cloud - AI coordination across all devices')
  .option('-m, --mode <type>', 'Setup mode (free|premium)', 'interactive')
  .option('-k, --key <key>', 'License key for premium features')
  .option('-s, --skip-install', 'Skip Brain Jar installation')
  .action(wrapInteractive(async (options) => {
    await cortex.setupBrainCloud(options)
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
  console.log(chalk.cyan('🧠☁️ Brainy - AI Coordination Service'))
  console.log('')
  console.log(chalk.bold('One-Command Setup:'))
  console.log(chalk.green('  brainy cloud                   # Setup Brain Cloud (recommended!)'))
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
        const response = await fetch(`https://brain-cloud.dpsifr.workers.dev/health`, {
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
            BRAIN_CLOUD_URL: "https://brain-cloud.dpsifr.workers.dev"
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
      brainCloudUrl: 'https://brain-cloud.dpsifr.workers.dev',
      lastConnected: new Date().toISOString()
    }
    
    await writeFile('brainy-config.json', JSON.stringify(brainyConfig, null, 2))
    console.log(chalk.green('✅ Brainy configuration saved'))
  } catch (error) {
    console.log(chalk.yellow('⚠️ Could not save brainy config:', error.message))
  }
}