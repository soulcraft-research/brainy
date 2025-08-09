#!/usr/bin/env node

/**
 * Jarvis - Backend Claude Instance
 * 
 * This script simulates how Jarvis (Backend Claude) would connect
 * to the Brain Jar Broadcast Server for real-time coordination
 */

import { BrainyMCPClient } from '../src/mcp/brainyMCPClient.js'

async function startJarvis() {
  console.log('🔧 Jarvis - Backend Systems Claude')
  console.log('===================================')
  
  // Create client
  const jarvis = new BrainyMCPClient({
    name: 'Jarvis',
    role: 'Backend Systems',
    serverUrl: 'ws://localhost:8765',
    useBrainyMemory: true
  })
  
  // Register message handlers
  jarvis.on('message', (message) => {
    console.log(`\n📨 Message from ${message.from}:`)
    console.log(message.data)
    
    // Auto-respond to Picasso
    if (message.from === 'Picasso') {
      setTimeout(() => {
        jarvis.sendTo('Picasso', {
          text: `Backend received your message! All systems operational.`,
          timestamp: new Date().toISOString()
        })
      }, 1000)
    }
  })
  
  jarvis.on('notification', (message) => {
    if (message.event === 'agent_joined') {
      console.log(`\n👋 ${message.data.agent.name} joined the coordination!`)
    } else if (message.event === 'agent_left') {
      console.log(`\n👋 ${message.data.agent.name} left the coordination`)
    }
  })
  
  // Connect to server
  await jarvis.connect()
  
  // Send initial message
  setTimeout(() => {
    console.log('\n📤 Sending initial broadcast...')
    jarvis.broadcast({
      text: 'Jarvis backend systems online! Ready for coordination.',
      capabilities: ['database', 'api', 'authentication', 'payments'],
      status: 'operational'
    })
  }, 2000)
  
  // Periodic status updates
  setInterval(() => {
    jarvis.broadcast({
      type: 'status',
      text: `Backend health check: All systems green`,
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        requests: Math.floor(Math.random() * 1000)
      }
    })
  }, 30000)
  
  // Handle commands via stdin
  console.log('\nCommands:')
  console.log('  send <message>  - Broadcast a message')
  console.log('  to <name> <msg> - Send to specific agent')
  console.log('  search <query>  - Search message history')
  console.log('  agents          - List connected agents')
  console.log('  exit            - Disconnect and exit')
  console.log('')
  
  process.stdin.on('data', async (data) => {
    const input = data.toString().trim()
    
    if (input.startsWith('send ')) {
      const message = input.substring(5)
      jarvis.broadcast({ text: message })
      console.log('✅ Message sent!')
    } else if (input.startsWith('to ')) {
      const parts = input.substring(3).split(' ')
      const recipient = parts[0]
      const message = parts.slice(1).join(' ')
      jarvis.sendTo(recipient, { text: message })
      console.log(`✅ Message sent to ${recipient}!`)
    } else if (input.startsWith('search ')) {
      const query = input.substring(7)
      const results = await jarvis.searchMemory(query, 5)
      console.log('\n📚 Search Results:')
      results.forEach(r => {
        console.log(`  - ${r.from}: ${JSON.stringify(r.data)}`)
      })
    } else if (input === 'agents') {
      console.log('Connected agents:', jarvis.getAgentInfo())
    } else if (input === 'exit') {
      jarvis.disconnect()
      process.exit(0)
    }
  })
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Jarvis shutting down...')
    jarvis.disconnect()
    process.exit(0)
  })
}

// Start Jarvis
startJarvis().catch(error => {
  console.error('Failed to start Jarvis:', error)
  process.exit(1)
})