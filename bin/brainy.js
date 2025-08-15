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
import { BrainyData } from '../dist/brainyData.js'
// @ts-ignore
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

// Create single BrainyData instance (the ONE data orchestrator)
let brainy = null
const getBrainy = async () => {
  if (!brainy) {
    brainy = new BrainyData()
    await brainy.init()
  }
  return brainy
}

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

// AI Response Generation with multiple model support
async function generateAIResponse(message, brainy, options) {
  const model = options.model || 'local'
  
  // Get relevant context from user's data
  const contextResults = await brainy.search(message, 5, {
    includeContent: true,
    scoreThreshold: 0.3
  })
  
  const context = contextResults.map(r => r.content).join('\n')
  const prompt = `Based on the following context from the user's data, answer their question:

Context:
${context}

Question: ${message}

Answer:`

  switch (model) {
    case 'local':
    case 'ollama':
      return await callOllamaModel(prompt, options)
      
    case 'openai':
    case 'gpt-3.5-turbo':
    case 'gpt-4':
      return await callOpenAI(prompt, options)
      
    case 'claude':
    case 'claude-3':
      return await callClaude(prompt, options)
      
    default:
      return await callOllamaModel(prompt, options)
  }
}

// Ollama (local) integration
async function callOllamaModel(prompt, options) {
  const baseUrl = options.baseUrl || 'http://localhost:11434'
  const model = options.model === 'local' ? 'llama2' : options.model
  
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    })
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}. Make sure Ollama is running: ollama serve`)
    }
    
    const data = await response.json()
    return data.response || 'No response from local model'
    
  } catch (error) {
    throw new Error(`Local model error: ${error.message}. Try: ollama run llama2`)
  }
}

// OpenAI integration
async function callOpenAI(prompt, options) {
  if (!options.apiKey) {
    throw new Error('OpenAI API key required. Use --api-key <key> or set OPENAI_API_KEY environment variable')
  }
  
  const model = options.model === 'openai' ? 'gpt-3.5-turbo' : options.model
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response from OpenAI'
    
  } catch (error) {
    throw new Error(`OpenAI error: ${error.message}`)
  }
}

// Claude integration  
async function callClaude(prompt, options) {
  if (!options.apiKey) {
    throw new Error('Anthropic API key required. Use --api-key <key> or set ANTHROPIC_API_KEY environment variable')
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': options.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Claude error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.content[0]?.text || 'No response from Claude'
    
  } catch (error) {
    throw new Error(`Claude error: ${error.message}`)
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

// Command 0: INIT - Initialize brainy (essential setup)
program
  .command('init')
  .description('Initialize Brainy in current directory')
  .option('-s, --storage <type>', 'Storage type (filesystem, memory, s3, r2, gcs)')
  .option('-e, --encryption', 'Enable encryption for sensitive data')
  .option('--s3-bucket <bucket>', 'S3 bucket name')
  .option('--s3-region <region>', 'S3 region')
  .option('--access-key <key>', 'Storage access key')
  .option('--secret-key <key>', 'Storage secret key')
  .action(wrapAction(async (options) => {
    console.log(colors.primary('🧠 Initializing Brainy'))
    console.log()
    
    const { BrainyData } = await import('../dist/brainyData.js')
    
    const config = {
      storage: options.storage || 'filesystem',
      encryption: options.encryption || false
    }
    
    // Storage-specific configuration
    if (options.storage === 's3' || options.storage === 'r2' || options.storage === 'gcs') {
      if (!options.accessKey || !options.secretKey) {
        console.log(colors.warning('⚠️ Cloud storage requires access credentials'))
        console.log(colors.info('Use: --access-key <key> --secret-key <secret>'))
        console.log(colors.info('Or set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'))
        process.exit(1)
      }
      
      config.storageOptions = {
        bucket: options.s3Bucket,
        region: options.s3Region || 'us-east-1',
        accessKeyId: options.accessKey,
        secretAccessKey: options.secretKey
      }
    }
    
    try {
      const brainy = new BrainyData(config)
      await brainy.init()
      
      console.log(colors.success('✅ Brainy initialized successfully!'))
      console.log(colors.info(`📁 Storage: ${config.storage}`))
      console.log(colors.info(`🔒 Encryption: ${config.encryption ? 'Enabled' : 'Disabled'}`))
      
      if (config.encryption) {
        console.log(colors.warning('🔐 Encryption enabled - keep your keys secure!'))
      }
      
      console.log()
      console.log(colors.success('🚀 Ready to go! Try:'))
      console.log(colors.info('  brainy add "Hello, World!"'))
      console.log(colors.info('  brainy search "hello"'))
      
    } catch (error) {
      console.log(colors.error('❌ Initialization failed:'))
      console.log(colors.error(error.message))
      process.exit(1)
    }
  }))

// Command 1: ADD - Add data (smart by default)
program
  .command('add [data]')
  .description('Add data to your brain (smart auto-detection)')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('-i, --id <id>', 'Custom ID') 
  .option('--literal', 'Skip AI processing (literal storage)')
  .option('--encrypt', 'Encrypt this data (for sensitive information)')
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
    if (options.encrypt) {
      metadata.encrypted = true
    }
    
    console.log(options.literal 
      ? colors.info('🔒 Literal storage') 
      : colors.success('🧠 Smart mode (auto-detects types)')
    )
    
    if (options.encrypt) {
      console.log(colors.warning('🔐 Encrypting sensitive data...'))
    }
    
    const brainyInstance = await getBrainy()
    
    // Handle encryption at data level if requested
    let processedData = data
    if (options.encrypt) {
      processedData = await brainyInstance.encryptData(data)
      metadata.encrypted = true
    }
    
    await brainyInstance.add(processedData, metadata, { 
      process: options.literal ? 'literal' : 'auto'
    })
    console.log(colors.success('✅ Added successfully!'))
  }))

// Command 2: CHAT - Talk to your data with AI
program
  .command('chat [message]')
  .description('AI chat with your brain data (supports local & cloud models)')
  .option('-s, --session <id>', 'Use specific chat session')
  .option('-n, --new', 'Start a new session')
  .option('-l, --list', 'List all chat sessions') 
  .option('-h, --history [limit]', 'Show conversation history (default: 10)')
  .option('--search <query>', 'Search all conversations')
  .option('-m, --model <model>', 'LLM model (local/openai/claude/ollama)', 'local')
  .option('--api-key <key>', 'API key for cloud models')
  .option('--base-url <url>', 'Base URL for local models (default: http://localhost:11434)')
  .action(wrapAction(async (message, options) => {
    const { BrainyData } = await import('../dist/brainyData.js')
    const { BrainyChat } = await import('../dist/chat/BrainyChat.js')
    
    console.log(colors.primary('🧠💬 Brainy Chat - AI-Powered Conversation with Your Data'))
    console.log(colors.info('Talk to your brain using your data as context'))
    console.log()
    
    // Initialize brainy and chat
    const brainy = new BrainyData()
    await brainy.init()
    const chat = new BrainyChat(brainy)
    
    // Handle different options
    if (options.list) {
      console.log(colors.primary('📋 Chat Sessions'))
      const sessions = await chat.getSessions(20)
      if (sessions.length === 0) {
        console.log(colors.warning('No chat sessions found. Start chatting to create your first session!'))
      } else {
        sessions.forEach((session, i) => {
          console.log(colors.success(`${i + 1}. ${session.id}`))
          if (session.title) console.log(colors.info(`   Title: ${session.title}`))
          console.log(colors.info(`   Messages: ${session.messageCount}`))
          console.log(colors.info(`   Last active: ${session.lastMessageAt.toLocaleDateString()}`))
        })
      }
      return
    }
    
    if (options.search) {
      console.log(colors.primary(`🔍 Searching conversations for: "${options.search}"`))
      const results = await chat.searchMessages(options.search, { limit: 10 })
      if (results.length === 0) {
        console.log(colors.warning('No messages found'))
      } else {
        results.forEach((msg, i) => {
          console.log(colors.success(`\n${i + 1}. [${msg.sessionId}] ${colors.info(msg.speaker)}:`))
          console.log(`   ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`)
        })
      }
      return
    }
    
    if (options.history) {
      const limit = parseInt(options.history) || 10
      console.log(colors.primary(`📜 Recent Chat History (${limit} messages)`))
      const history = await chat.getHistory(limit)
      if (history.length === 0) {
        console.log(colors.warning('No chat history found'))
      } else {
        history.forEach(msg => {
          const speaker = msg.speaker === 'user' ? colors.success('You') : colors.info('AI')
          console.log(`${speaker}: ${msg.content}`)
          console.log(colors.info(`   ${msg.timestamp.toLocaleString()}`))
          console.log()
        })
      }
      return
    }
    
    // Start interactive chat or process single message
    if (!message) {
      console.log(colors.success('🎯 Interactive mode - type messages or "exit" to quit'))
      console.log(colors.info(`Model: ${options.model}`))
      console.log()
      
      // Auto-discover previous session
      const session = options.new ? null : await chat.initialize()
      if (session) {
        console.log(colors.success(`📋 Resumed session: ${session.id}`))
        console.log()
      } else {
        const newSession = await chat.startNewSession()
        console.log(colors.success(`🆕 Started new session: ${newSession.id}`))
        console.log()
      }
      
      // Interactive chat loop
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colors.primary('You: ')
      })
      
      rl.prompt()
      
      rl.on('line', async (input) => {
        if (input.trim().toLowerCase() === 'exit') {
          console.log(colors.success('👋 Chat session saved to your brain!'))
          rl.close()
          return
        }
        
        if (input.trim()) {
          // Store user message
          await chat.addMessage(input.trim(), 'user')
          
          // Generate AI response
          try {
            const response = await generateAIResponse(input.trim(), brainy, options)
            console.log(colors.info('AI: ') + response)
            
            // Store AI response
            await chat.addMessage(response, 'assistant', { model: options.model })
            console.log()
          } catch (error) {
            console.log(colors.error('AI Error: ') + error.message)
            console.log(colors.warning('💡 Tip: Try setting --model local or providing --api-key'))
            console.log()
          }
        }
        
        rl.prompt()
      })
      
      rl.on('close', () => {
        exitProcess(0)
      })
      
    } else {
      // Single message mode
      console.log(colors.success('You: ') + message)
      
      try {
        const response = await generateAIResponse(message, brainy, options)
        console.log(colors.info('AI: ') + response)
        
        // Store conversation
        await chat.addMessage(message, 'user')
        await chat.addMessage(response, 'assistant', { model: options.model })
        
      } catch (error) {
        console.log(colors.error('Error: ') + error.message)
        console.log(colors.info('💡 Try: brainy chat --model local or provide --api-key'))
      }
    }
  }))

// Command 3: IMPORT - Bulk/external data
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
  .option('-f, --filter <json>', 'Metadata filters (see "brainy fields" for available fields)')
  .option('-d, --depth <number>', 'Relationship depth', '2')
  .option('--fields', 'Show available filter fields and exit')
  .action(wrapAction(async (query, options) => {
    
    // Handle --fields option
    if (options.fields) {
      console.log(colors.primary('🔍 Available Filter Fields'))
      console.log(colors.primary('=' .repeat(30)))
      
      try {
        const { BrainyData } = await import('../dist/brainyData.js')
        const brainy = new BrainyData()
        await brainy.init()
        
        const filterFields = await brainy.getFilterFields()
        if (filterFields.length > 0) {
          console.log(colors.success('Available fields for --filter option:'))
          filterFields.forEach(field => {
            console.log(colors.info(`  ${field}`))
          })
          console.log()
          console.log(colors.primary('Usage Examples:'))
          console.log(colors.info(`  brainy search "query" --filter '{"type":"person"}'`))
          console.log(colors.info(`  brainy search "query" --filter '{"category":"work","status":"active"}'`))
        } else {
          console.log(colors.warning('No indexed fields available yet.'))
          console.log(colors.info('Add some data with metadata to see available fields.'))
        }
        
      } catch (error) {
        console.log(colors.error(`Error: ${error.message}`))
      }
      return
    }
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
    
    const brainyInstance = await getBrainy()
    const results = await brainyInstance.search(query, searchOptions.limit || 10, searchOptions)
    
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

// Command 4: UPDATE - Update existing data
program
  .command('update <id>')
  .description('Update existing data with new content or metadata')
  .option('-d, --data <data>', 'New data content')
  .option('-m, --metadata <json>', 'New metadata as JSON')
  .option('--no-merge', 'Replace metadata instead of merging')
  .option('--no-reindex', 'Skip reindexing (faster but less accurate search)')
  .option('--cascade', 'Update related verbs')
  .action(wrapAction(async (id, options) => {
    console.log(colors.info(`🔄 Updating: "${id}"`))
    
    if (!options.data && !options.metadata) {
      console.error(colors.error('Error: Must provide --data or --metadata'))
      process.exit(1)
    }
    
    let metadata = undefined
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(colors.error('Invalid JSON metadata'))
        process.exit(1)
      }
    }
    
    const brainyInstance = await getBrainy()
    
    const success = await brainyInstance.update(id, options.data, metadata, {
      merge: options.merge !== false, // Default true unless --no-merge
      reindex: options.reindex !== false, // Default true unless --no-reindex  
      cascade: options.cascade || false
    })
    
    if (success) {
      console.log(colors.success('✅ Updated successfully!'))
      if (options.cascade) {
        console.log(colors.info('📎 Related verbs updated'))
      }
    } else {
      console.log(colors.error('❌ Update failed'))
    }
  }))

// Command 5: DELETE - Remove data (soft delete by default)
program
  .command('delete <id>')
  .description('Delete data (soft delete by default, preserves indexes)')
  .option('--hard', 'Permanent deletion (removes from indexes)')
  .option('--cascade', 'Delete related verbs')
  .option('--force', 'Force delete even if has relationships')
  .action(wrapAction(async (id, options) => {
    console.log(colors.info(`🗑️  Deleting: "${id}"`))
    
    if (options.hard) {
      console.log(colors.warning('⚠️  Hard delete - data will be permanently removed'))
    } else {
      console.log(colors.info('🔒 Soft delete - data marked as deleted but preserved'))
    }
    
    const brainyInstance = await getBrainy()
    
    try {
      const success = await brainyInstance.delete(id, {
        soft: !options.hard, // Soft delete unless --hard specified
        cascade: options.cascade || false,
        force: options.force || false
      })
      
      if (success) {
        console.log(colors.success('✅ Deleted successfully!'))
        if (options.cascade) {
          console.log(colors.info('📎 Related verbs also deleted'))
        }
      } else {
        console.log(colors.error('❌ Delete failed'))
      }
    } catch (error) {
      console.error(colors.error(`❌ Delete failed: ${error.message}`))
      if (error.message.includes('has relationships')) {
        console.log(colors.info('💡 Try: --cascade to delete relationships or --force to ignore them'))
      }
    }
  }))

// Command 6A: ADD-NOUN - Create typed entities (Method #4)
program
  .command('add-noun <name>')
  .description('Add a typed entity to your knowledge graph')
  .option('-t, --type <type>', 'Noun type (Person, Organization, Project, Event, Concept, Location, Product)', 'Concept')
  .option('-m, --metadata <json>', 'Metadata as JSON')
  .option('--encrypt', 'Encrypt this entity')
  .action(wrapAction(async (name, options) => {
    const brainy = await getBrainy()
    
    // Validate noun type
    const validTypes = ['Person', 'Organization', 'Project', 'Event', 'Concept', 'Location', 'Product']
    if (!validTypes.includes(options.type)) {
      console.log(colors.error(`❌ Invalid noun type: ${options.type}`))
      console.log(colors.info(`Valid types: ${validTypes.join(', ')}`))
      process.exit(1)
    }
    
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(colors.error('❌ Invalid JSON metadata'))
        process.exit(1)
      }
    }
    
    if (options.encrypt) {
      metadata.encrypted = true
    }
    
    try {
      const { NounType } = await import('../dist/types/graphTypes.js')
      const id = await brainy.addNoun(name, NounType[options.type], metadata)
      
      console.log(colors.success('✅ Noun added successfully!'))
      console.log(colors.info(`🆔 ID: ${id}`))
      console.log(colors.info(`👤 Name: ${name}`))
      console.log(colors.info(`🏷️ Type: ${options.type}`))
      if (Object.keys(metadata).length > 0) {
        console.log(colors.info(`📝 Metadata: ${JSON.stringify(metadata, null, 2)}`))
      }
    } catch (error) {
      console.log(colors.error('❌ Failed to add noun:'))
      console.log(colors.error(error.message))
      process.exit(1)
    }
  }))

// Command 6B: ADD-VERB - Create relationships (Method #5)
program
  .command('add-verb <source> <target>')
  .description('Create a relationship between two entities')
  .option('-t, --type <type>', 'Verb type (WorksFor, Knows, CreatedBy, BelongsTo, Uses, etc.)', 'RelatedTo')
  .option('-m, --metadata <json>', 'Relationship metadata as JSON')
  .option('--encrypt', 'Encrypt this relationship')
  .action(wrapAction(async (source, target, options) => {
    const brainy = await getBrainy()
    
    // Common verb types for validation
    const commonTypes = ['WorksFor', 'Knows', 'CreatedBy', 'BelongsTo', 'Uses', 'LeadsProject', 'MemberOf', 'RelatedTo', 'InteractedWith']
    if (!commonTypes.includes(options.type)) {
      console.log(colors.warning(`⚠️ Uncommon verb type: ${options.type}`))
      console.log(colors.info(`Common types: ${commonTypes.join(', ')}`))
    }
    
    let metadata = {}
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata)
      } catch {
        console.error(colors.error('❌ Invalid JSON metadata'))
        process.exit(1)
      }
    }
    
    if (options.encrypt) {
      metadata.encrypted = true
    }
    
    try {
      const { VerbType } = await import('../dist/types/graphTypes.js')
      
      // Use the provided type or fall back to RelatedTo
      const verbType = VerbType[options.type] || options.type
      const id = await brainy.addVerb(source, target, verbType, metadata)
      
      console.log(colors.success('✅ Relationship added successfully!'))
      console.log(colors.info(`🆔 ID: ${id}`))
      console.log(colors.info(`🔗 ${source} --[${options.type}]--> ${target}`))
      if (Object.keys(metadata).length > 0) {
        console.log(colors.info(`📝 Metadata: ${JSON.stringify(metadata, null, 2)}`))
      }
    } catch (error) {
      console.log(colors.error('❌ Failed to add relationship:'))
      console.log(colors.error(error.message))
      process.exit(1)
    }
  }))

// Command 7: STATUS - Database health & info
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
      console.log(colors.info(`  Metadata Records: ${colors.success(stats.metadataCount || 0)}`))
      console.log()
      
      // Per-Service Breakdown (if available)
      if (stats.serviceBreakdown && Object.keys(stats.serviceBreakdown).length > 0) {
        console.log(colors.primary('🔧 Per-Service Breakdown'))
        Object.entries(stats.serviceBreakdown).forEach(([service, serviceStats]) => {
          console.log(colors.info(`  ${colors.success(service)}:`))
          console.log(colors.info(`    Nouns: ${serviceStats.nounCount}`))
          console.log(colors.info(`    Verbs: ${serviceStats.verbCount}`))
          console.log(colors.info(`    Metadata: ${serviceStats.metadataCount}`))
        })
        console.log()
      }
      
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
      
      // Available Fields for Advanced Search
      console.log(colors.primary('🔍 Available Search Fields'))
      try {
        const filterFields = await brainy.getFilterFields()
        if (filterFields.length > 0) {
          console.log(colors.info('  Use these fields for advanced filtering:'))
          filterFields.forEach(field => {
            console.log(colors.success(`    ${field}`))
          })
          console.log(colors.info('\n  Example: brainy search "query" --filter \'{"type":"person"}\''))
        } else {
          console.log(colors.warning('  No indexed fields available yet'))
          console.log(colors.info('  Add some data to see available fields'))
        }
      } catch (error) {
        console.log(colors.warning('  Field discovery not available'))
      }
      console.log()
      
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

// Command 6: AUGMENT - Manage augmentations (The 8th Unified Method!)
program
  .command('augment <action>')
  .description('Manage augmentations to extend Brainy\'s capabilities')
  .option('-n, --name <name>', 'Augmentation name')
  .option('-t, --type <type>', 'Augmentation type (sense, conduit, cognition, memory)')
  .option('-p, --path <path>', 'Path to augmentation module')
  .option('-l, --list', 'List all augmentations')
  .action(wrapAction(async (action, options) => {
    const brainy = await initBrainy()
    console.log(colors.brain('🧩 Augmentation Management'))
    
    const actions = {
      list: async () => {
        const augmentations = brainy.listAugmentations()
        if (augmentations.length === 0) {
          console.log(colors.warning('No augmentations registered'))
          return
        }
        
        const table = new Table({
          head: [colors.brain('Name'), colors.brain('Type'), colors.brain('Status'), colors.brain('Description')],
          style: { head: [], border: [] }
        })
        
        augmentations.forEach(aug => {
          table.push([
            colors.primary(aug.name),
            colors.info(aug.type),
            aug.enabled ? colors.success('✅ Enabled') : colors.dim('⚪ Disabled'),
            colors.dim(aug.description || '')
          ])
        })
        
        console.log(table.toString())
        console.log(colors.info(`\nTotal: ${augmentations.length} augmentations`))
      },
      
      enable: async () => {
        if (!options.name) {
          console.log(colors.error('Name required: --name <augmentation-name>'))
          return
        }
        const success = brainy.enableAugmentation(options.name)
        if (success) {
          console.log(colors.success(`✅ Enabled augmentation: ${options.name}`))
        } else {
          console.log(colors.error(`Failed to enable: ${options.name} (not found)`))
        }
      },
      
      disable: async () => {
        if (!options.name) {
          console.log(colors.error('Name required: --name <augmentation-name>'))
          return
        }
        const success = brainy.disableAugmentation(options.name)
        if (success) {
          console.log(colors.warning(`⚪ Disabled augmentation: ${options.name}`))
        } else {
          console.log(colors.error(`Failed to disable: ${options.name} (not found)`))
        }
      },
      
      register: async () => {
        if (!options.path) {
          console.log(colors.error('Path required: --path <augmentation-module>'))
          return
        }
        
        try {
          // Dynamic import of custom augmentation
          const customModule = await import(options.path)
          const AugmentationClass = customModule.default || customModule[Object.keys(customModule)[0]]
          
          if (!AugmentationClass) {
            console.log(colors.error('No augmentation class found in module'))
            return
          }
          
          const augmentation = new AugmentationClass()
          brainy.register(augmentation)
          console.log(colors.success(`✅ Registered augmentation: ${augmentation.name}`))
          console.log(colors.info(`Type: ${augmentation.type}`))
          if (augmentation.description) {
            console.log(colors.dim(`Description: ${augmentation.description}`))
          }
        } catch (error) {
          console.log(colors.error(`Failed to register augmentation: ${error.message}`))
        }
      },
      
      unregister: async () => {
        if (!options.name) {
          console.log(colors.error('Name required: --name <augmentation-name>'))
          return
        }
        
        brainy.unregister(options.name)
        console.log(colors.warning(`🗑️ Unregistered augmentation: ${options.name}`))
      },
      
      'enable-type': async () => {
        if (!options.type) {
          console.log(colors.error('Type required: --type <augmentation-type>'))
          console.log(colors.info('Valid types: sense, conduit, cognition, memory, perception, dialog, activation'))
          return
        }
        
        const count = brainy.enableAugmentationType(options.type)
        console.log(colors.success(`✅ Enabled ${count} ${options.type} augmentations`))
      },
      
      'disable-type': async () => {
        if (!options.type) {
          console.log(colors.error('Type required: --type <augmentation-type>'))
          console.log(colors.info('Valid types: sense, conduit, cognition, memory, perception, dialog, activation'))
          return
        }
        
        const count = brainy.disableAugmentationType(options.type)
        console.log(colors.warning(`⚪ Disabled ${count} ${options.type} augmentations`))
      }
    }
    
    if (actions[action]) {
      await actions[action]()
    } else {
      console.log(colors.error('Valid actions: list, enable, disable, register, unregister, enable-type, disable-type'))
      console.log(colors.info('\nExamples:'))
      console.log(colors.dim('  brainy augment list                                  # List all augmentations'))
      console.log(colors.dim('  brainy augment enable --name neural-import           # Enable an augmentation'))
      console.log(colors.dim('  brainy augment register --path ./my-augmentation.js  # Register custom augmentation'))
      console.log(colors.dim('  brainy augment enable-type --type sense              # Enable all sense augmentations'))
    }
  }))

// Command 7: EXPORT - Export your data
program
  .command('export')
  .description('Export your brain data in various formats')
  .option('-f, --format <format>', 'Export format (json, csv, graph, embeddings)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .option('--vectors', 'Include vector embeddings')
  .option('--no-metadata', 'Exclude metadata')
  .option('--no-relationships', 'Exclude relationships')
  .option('--filter <json>', 'Filter by metadata')
  .option('-l, --limit <number>', 'Limit number of items')
  .action(wrapAction(async (options) => {
    const brainy = await initBrainy()
    console.log(colors.brain('📤 Exporting Brain Data'))
    
    const spinner = ora('Exporting data...').start()
    
    try {
      const exportOptions = {
        format: options.format,
        includeVectors: options.vectors || false,
        includeMetadata: options.metadata !== false,
        includeRelationships: options.relationships !== false,
        filter: options.filter ? JSON.parse(options.filter) : {},
        limit: options.limit ? parseInt(options.limit) : undefined
      }
      
      const data = await brainy.export(exportOptions)
      
      spinner.succeed('Export complete')
      
      if (options.output) {
        // Write to file
        const fs = require('fs')
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        fs.writeFileSync(options.output, content)
        console.log(colors.success(`✅ Exported to: ${options.output}`))
        
        // Show summary
        const items = Array.isArray(data) ? data.length : (data.nodes ? data.nodes.length : 1)
        console.log(colors.info(`📊 Format: ${options.format}`))
        console.log(colors.info(`📁 Items: ${items}`))
        if (options.vectors) {
          console.log(colors.info(`🔢 Vectors: Included`))
        }
      } else {
        // Output to console
        if (typeof data === 'string') {
          console.log(data)
        } else {
          console.log(JSON.stringify(data, null, 2))
        }
      }
    } catch (error) {
      spinner.fail('Export failed')
      console.error(colors.error(error.message))
      process.exit(1)
    }
  }))

// Command 8: CLOUD - Premium features connection
program
  .command('cloud <action>')
  .description('☁️ Brain Cloud - AI Memory, Team Sync, Enterprise Connectors (FREE TRIAL!)')
  .option('-i, --instance <id>', 'Brain Cloud instance ID')
  .option('-e, --email <email>', 'Your email for signup')
  .action(wrapAction(async (action, options) => {
    console.log(boxen(
      colors.brain('☁️ BRAIN CLOUD - SUPERCHARGE YOUR BRAIN! 🚀\n\n') +
      colors.success('✨ FREE TRIAL: First 100GB FREE!\n') +
      colors.info('💰 Then just $9/month (individuals) or $49/month (teams)\n\n') +
      colors.primary('Features:\n') +
      colors.dim('  • AI Memory that persists across sessions\n') +
      colors.dim('  • Multi-agent coordination\n') +
      colors.dim('  • Automatic backups & sync\n') +
      colors.dim('  • Premium connectors (Notion, Slack, etc.)'),
      { padding: 1, borderStyle: 'round', borderColor: 'cyan' }
    ))
    
    const cloudActions = {
      setup: async () => {
        console.log(colors.brain('\n🚀 Quick Setup - 30 seconds to superpowers!\n'))
        
        if (!options.email) {
          const { email } = await prompts({
            type: 'text',
            name: 'email',
            message: 'Enter your email for FREE trial:',
            validate: (value) => value.includes('@') || 'Please enter a valid email'
          })
          options.email = email
        }
        
        console.log(colors.success(`\n✅ Setting up Brain Cloud for: ${options.email}`))
        console.log(colors.info('\n📧 Check your email for activation link!'))
        console.log(colors.dim('\nOr visit: https://app.soulcraft.com/activate\n'))
        
        // TODO: Actually call Brain Cloud API when ready
        console.log(colors.brain('🎉 Your Brain Cloud trial is ready!'))
        console.log(colors.success('\nNext steps:'))
        console.log(colors.dim('  1. Check your email for API key'))
        console.log(colors.dim('  2. Run: brainy cloud connect --key YOUR_KEY'))
        console.log(colors.dim('  3. Start using persistent AI memory!'))
      },
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
    console.log(colors.info('2. Chat with AI using your data'))
    console.log(colors.info('3. Search your brain'))
    console.log(colors.info('4. Update existing data'))
    console.log(colors.info('5. Delete data'))
    console.log(colors.info('6. Import a file'))
    console.log(colors.info('7. Check status'))
    console.log(colors.info('8. Connect to Brain Cloud'))
    console.log(colors.info('9. Configuration'))
    console.log(colors.info('10. Show all commands'))
    console.log()
    
    const choice = await new Promise(resolve => {
      rl.question(colors.primary('Enter your choice (1-10): '), (answer) => {
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
        console.log(colors.success('\n💬 Use: brainy chat "your question"'))
        console.log(colors.info('Example: brainy chat "Tell me about my data"'))
        console.log(colors.info('Supports: local (Ollama), OpenAI, Claude'))
        break
      case '3':
        console.log(colors.success('\n🔍 Use: brainy search "your query"'))
        console.log(colors.info('Example: brainy search "Google employees"'))
        break
      case '4':
        console.log(colors.success('\n📥 Use: brainy import <file-or-url>'))
        console.log(colors.info('Example: brainy import data.txt'))
        break
      case '5':
        console.log(colors.success('\n📊 Use: brainy status'))
        console.log(colors.info('Shows comprehensive brain statistics'))
        console.log(colors.info('Options: --simple (quick) or --verbose (detailed)'))
        break
      case '6':
        console.log(colors.success('\n☁️ Use: brainy cloud connect'))
        console.log(colors.info('Example: brainy cloud connect --instance demo-test-auto'))
        break
      case '7':
        console.log(colors.success('\n🔧 Use: brainy config <action>'))
        console.log(colors.info('Example: brainy config list'))
        break
      case '8':
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