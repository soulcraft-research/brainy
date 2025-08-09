#!/usr/bin/env node

/**
 * Brain Jar Broadcast Server
 * 
 * Start this server to enable real-time communication between
 * multiple Claude instances (Jarvis, Picasso, etc.)
 * 
 * Usage:
 *   npm run broadcast:local    # Start local server on port 8765
 *   npm run broadcast:cloud    # Start cloud server on port 8080
 */

import { BrainyData } from '../src/brainyData.js'
import { BrainyMCPBroadcast } from '../src/mcp/brainyMCPBroadcast.js'

const isCloud = process.argv.includes('--cloud')
const port = isCloud ? 8080 : 8765

async function startServer() {
  console.log('🧠🫙 Starting Brain Jar Broadcast Server...')
  console.log('=====================================')
  
  // Initialize Brainy for server-side memory
  const brainy = new BrainyData({
    storagePath: '.brain-jar/server',
    dimensions: 384
  })
  
  await brainy.init()
  console.log('✅ Brainy initialized for server memory')
  
  // Create broadcast server
  const broadcast = new BrainyMCPBroadcast(brainy, {
    broadcastPort: port,
    cloudUrl: isCloud ? process.env.CLOUD_URL : undefined
  })
  
  // Start the server
  await broadcast.startBroadcastServer(port, isCloud)
  
  console.log('')
  console.log('🚀 Server Ready!')
  console.log('=====================================')
  console.log('Claude instances can now connect using:')
  console.log('')
  console.log('For Jarvis (Backend):')
  console.log(`  const client = new BrainyMCPClient({`)
  console.log(`    name: 'Jarvis',`)
  console.log(`    role: 'Backend Systems',`)
  console.log(`    serverUrl: 'ws://localhost:${port}'`)
  console.log(`  })`)
  console.log(`  await client.connect()`)
  console.log('')
  console.log('For Picasso (Frontend):')
  console.log(`  const client = new BrainyMCPClient({`)
  console.log(`    name: 'Picasso',`)
  console.log(`    role: 'Frontend Design',`)
  console.log(`    serverUrl: 'ws://localhost:${port}'`)
  console.log(`  })`)
  console.log(`  await client.connect()`)
  console.log('')
  console.log('=====================================')
  console.log('Press Ctrl+C to stop the server')
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📛 Shutting down server...')
    await broadcast.stopBroadcastServer()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await broadcast.stopBroadcastServer()
    process.exit(0)
  })
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})