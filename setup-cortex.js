#!/usr/bin/env node

// Auto-setup Cortex without prompts
import { BrainyData } from './dist/index.js'
import { BrainyChat } from './dist/chat/brainyChat.js'
import fs from 'fs/promises'
import path from 'path'

async function autoSetup() {
  console.log('🧠 Auto-configuring Cortex...\n')
  
  // Create config directory
  const configDir = path.join(process.cwd(), '.cortex')
  await fs.mkdir(configDir, { recursive: true })
  
  // Write config
  const config = {
    storage: 'filesystem',
    encryption: false,
    chat: true,
    initialized: true,
    createdAt: new Date().toISOString()
  }
  
  await fs.writeFile(
    path.join(configDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )
  
  // Initialize Brainy
  const brainy = new BrainyData({ 
    storage: { forceFileSystemStorage: true } 
  })
  await brainy.init()
  
  // Add data
  console.log('📊 Adding sample data...')
  
  await brainy.add('John Smith is a Senior Software Engineer at TechCorp specializing in Python and JavaScript', {
    type: 'person',
    name: 'John Smith',
    role: 'Senior Engineer',
    skills: 'Python, JavaScript, React'
  })
  
  await brainy.add('Jane Doe is a Data Scientist at DataCo, expert in Python and Machine Learning', {
    type: 'person',
    name: 'Jane Doe',
    role: 'Data Scientist',
    skills: 'Python, TensorFlow, ML'
  })
  
  await brainy.add('Customer Analytics AI Project using Python and TensorFlow', {
    type: 'project',
    name: 'Customer Analytics',
    tech: 'Python, TensorFlow'
  })
  
  console.log('✅ Setup complete!\n')
  
  // Test it
  const chat = new BrainyChat(brainy)
  console.log('Testing: "Who knows Python?"')
  const answer = await chat.ask('Who knows Python?')
  console.log('Answer:', answer)
  
  console.log('\n🎉 Cortex is ready! Try these commands:\n')
  console.log('  node bin/cortex.js chat')
  console.log('  node bin/cortex.js search "Python"')
  console.log('  node bin/cortex.js stats')
  console.log('  node bin/cortex.js fields')
}

autoSetup().catch(console.error)