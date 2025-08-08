#!/usr/bin/env node

// Auto-initialize Cortex for testing
import { Cortex } from './dist/cortex/cortex.js'
import { BrainyData } from './dist/index.js'
import { BrainyChat } from './dist/chat/brainyChat.js'

async function setupCortex() {
  console.log('🧠 Setting up Cortex for testing...\n')
  
  // Create Brainy instance with memory storage
  const brainy = new BrainyData({ 
    storage: { forceMemoryStorage: true } 
  })
  await brainy.init()
  
  // Add sample data
  console.log('📊 Adding sample data...')
  
  // People
  const john = await brainy.add('John Smith is a senior software engineer at TechCorp', {
    type: 'person',
    name: 'John Smith',
    role: 'Senior Software Engineer',
    company: 'TechCorp',
    skills: ['JavaScript', 'Python', 'React'],
    experience: 8
  })
  
  const jane = await brainy.add('Jane Doe is a data scientist specializing in ML at DataCo', {
    type: 'person',
    name: 'Jane Doe',
    role: 'Data Scientist',
    company: 'DataCo',
    skills: ['Python', 'TensorFlow', 'Statistics'],
    experience: 6
  })
  
  const alice = await brainy.add('Alice Chen is a product manager at StartupXYZ', {
    type: 'person',
    name: 'Alice Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    skills: ['Product Strategy', 'Analytics', 'User Research'],
    experience: 5
  })
  
  // Projects
  await brainy.add('AI Customer Analytics Platform - uses ML to predict churn', {
    type: 'project',
    name: 'Customer Analytics Platform',
    domain: 'AI/ML',
    status: 'active',
    budget: 500000,
    team_size: 5
  })
  
  await brainy.add('E-commerce Recommendation Engine powered by collaborative filtering', {
    type: 'project',
    name: 'Recommendation Engine',
    domain: 'E-commerce',
    status: 'completed',
    budget: 250000,
    team_size: 3
  })
  
  // Events
  await brainy.add('Machine Learning Workshop - Feb 15, 2024 - Advanced topics', {
    type: 'event',
    name: 'ML Workshop',
    date: '2024-02-15',
    topic: 'Machine Learning',
    attendees: 50,
    location: 'Virtual'
  })
  
  await brainy.add('Tech Conference 2024 - March 20-22 - Latest in AI and Cloud', {
    type: 'event',
    name: 'Tech Conference 2024',
    date: '2024-03-20',
    topic: 'AI & Cloud Computing',
    attendees: 500,
    location: 'San Francisco'
  })
  
  // Products
  await brainy.add('SmartHome Hub - IoT device for home automation', {
    type: 'product',
    name: 'SmartHome Hub',
    category: 'IoT',
    price: 199.99,
    rating: 4.5,
    in_stock: true
  })
  
  await brainy.add('DataAnalyzer Pro - Business intelligence software', {
    type: 'product',
    name: 'DataAnalyzer Pro',
    category: 'Software',
    price: 499.99,
    rating: 4.8,
    in_stock: true
  })
  
  console.log('✅ Sample data added!\n')
  
  // Create chat instance
  const chat = new BrainyChat(brainy)
  
  // Test chat
  console.log('💬 Testing chat...')
  const answer = await chat.ask('What people do we have in our database?')
  console.log('Q: What people do we have in our database?')
  console.log('A:', answer)
  
  console.log('\n🎉 Cortex is ready! Now you can run these commands:\n')
  console.log('INTERACTIVE COMMANDS:')
  console.log('  node bin/cortex.js chat                  # Chat with your data')
  console.log('  node bin/cortex.js explore               # Explore graph interactively')
  console.log('  node bin/cortex.js search-advanced       # Advanced search with filters')
  console.log('  node bin/cortex.js llm                   # Setup LLM (Claude, GPT, etc.)')
  console.log('')
  console.log('QUICK COMMANDS:')
  console.log('  node bin/cortex.js search "engineer"     # Search for engineers')
  console.log('  node bin/cortex.js search "project" --filter \'{"status": "active"}\'')
  console.log('  node bin/cortex.js stats --detailed      # Show detailed statistics')
  console.log('  node bin/cortex.js fields                # List all searchable fields')
  console.log('  node bin/cortex.js similarity "AI" "Machine Learning"')
  console.log('')
  console.log('GRAPH COMMANDS:')
  console.log('  node bin/cortex.js verb "John" "works_on" "Customer Analytics"')
  console.log('  node bin/cortex.js verb "Jane" "leads" "ML Workshop"')
  console.log('')
  
  // Save the config for Cortex CLI to use
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const cortexConfig = {
    storage: 'memory',
    encryption: false,
    chat: true,
    initialized: true,
    createdAt: new Date().toISOString()
  }
  
  const configDir = path.join(process.cwd(), '.cortex')
  await fs.mkdir(configDir, { recursive: true })
  await fs.writeFile(
    path.join(configDir, 'config.json'),
    JSON.stringify(cortexConfig, null, 2)
  )
  
  console.log('📁 Config saved to .cortex/config.json')
}

setupCortex().catch(console.error)