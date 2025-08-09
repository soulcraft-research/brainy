#!/usr/bin/env node

/**
 * Picasso - Frontend Claude Instance
 * 
 * This script simulates how Picasso (Frontend Claude) would connect
 * to the Brain Jar Broadcast Server for real-time coordination
 */

import { BrainyMCPClient } from '../src/mcp/brainyMCPClient.js'

async function startPicasso() {
  console.log('🎨 Picasso - Frontend Design Claude')
  console.log('====================================')
  
  // Create client
  const picasso = new BrainyMCPClient({
    name: 'Picasso',
    role: 'Frontend Design',
    serverUrl: 'ws://localhost:8765',
    useBrainyMemory: true
  })
  
  // Register message handlers
  picasso.on('message', (message) => {
    console.log(`\n📨 Message from ${message.from}:`)
    console.log(message.data)
    
    // Auto-respond to Jarvis
    if (message.from === 'Jarvis') {
      setTimeout(() => {
        picasso.sendTo('Jarvis', {
          text: `Frontend acknowledges! UI components ready.`,
          timestamp: new Date().toISOString()
        })
      }, 1000)
    }
  })
  
  picasso.on('notification', (message) => {
    if (message.event === 'agent_joined') {
      console.log(`\n👋 ${message.data.agent.name} joined the coordination!`)
    } else if (message.event === 'agent_left') {
      console.log(`\n👋 ${message.data.agent.name} left the coordination`)
    }
  })
  
  // Connect to server
  await picasso.connect()
  
  // Send initial message
  setTimeout(() => {
    console.log('\n📤 Sending initial broadcast...')
    picasso.broadcast({
      text: 'Picasso design systems online! Ready to create beautiful UIs.',
      capabilities: ['ui', 'animations', 'responsive', 'accessibility'],
      status: 'creative'
    })
  }, 2000)
  
  // Periodic design updates
  setInterval(() => {
    picasso.broadcast({
      type: 'design_update',
      text: `Design system status: Components rendering perfectly`,
      metrics: {
        components: Math.floor(Math.random() * 50),
        animations: Math.floor(Math.random() * 20),
        themes: ['retro', 'atomic', 'minimal']
      }
    })
  }, 30000)
  
  // Handle commands via stdin
  console.log('\nCommands:')
  console.log('  send <message>  - Broadcast a message')
  console.log('  to <name> <msg> - Send to specific agent')
  console.log('  search <query>  - Search message history')
  console.log('  recent          - Show recent messages')
  console.log('  agents          - List connected agents')
  console.log('  exit            - Disconnect and exit')
  console.log('')
  
  process.stdin.on('data', async (data) => {
    const input = data.toString().trim()
    
    if (input.startsWith('send ')) {
      const message = input.substring(5)
      picasso.broadcast({ text: message })
      console.log('✅ Message sent!')
    } else if (input.startsWith('to ')) {
      const parts = input.substring(3).split(' ')
      const recipient = parts[0]
      const message = parts.slice(1).join(' ')
      picasso.sendTo(recipient, { text: message })
      console.log(`✅ Message sent to ${recipient}!`)
    } else if (input.startsWith('search ')) {
      const query = input.substring(7)
      const results = await picasso.searchMemory(query, 5)
      console.log('\n📚 Search Results:')
      results.forEach(r => {
        console.log(`  - ${r.from}: ${JSON.stringify(r.data)}`)
      })
    } else if (input === 'recent') {
      const recent = await picasso.getRecentMessages(10)
      console.log('\n📜 Recent Messages:')
      recent.forEach(r => {
        console.log(`  - ${r.from}: ${JSON.stringify(r.data)}`)
      })
    } else if (input === 'agents') {
      console.log('Connected agents:', picasso.getAgentInfo())
    } else if (input === 'exit') {
      picasso.disconnect()
      process.exit(0)
    }
  })
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Picasso shutting down...')
    picasso.disconnect()
    process.exit(0)
  })
}

// Start Picasso
startPicasso().catch(error => {
  console.error('Failed to start Picasso:', error)
  process.exit(1)
})