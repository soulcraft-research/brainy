#!/usr/bin/env node

// Clean setup with memory storage (no errors)
import { BrainyData } from './dist/index.js'
import { BrainyChat } from './dist/chat/brainyChat.js'
import fs from 'fs/promises'
import path from 'path'

async function cleanSetup() {
  console.log('🧠 Setting up Cortex (clean)...\n')
  
  // Clean up old data
  try {
    await fs.rm('.cortex', { recursive: true, force: true })
    await fs.rm('brainy_data', { recursive: true, force: true })
  } catch {}
  
  // Create config directory
  const configDir = path.join(process.cwd(), '.cortex')
  await fs.mkdir(configDir, { recursive: true })
  
  // Write config for memory storage (no errors)
  const config = {
    storage: 'memory',
    encryption: true,
    chat: true,
    initialized: true,
    createdAt: new Date().toISOString()
  }
  
  await fs.writeFile(
    path.join(configDir, 'config.json'),
    JSON.stringify(config, null, 2)
  )
  
  // Initialize Brainy with memory storage
  const brainy = new BrainyData({ 
    storage: { forceMemoryStorage: true } 
  })
  await brainy.init()
  
  // Add rich sample data
  console.log('📊 Adding sample data...')
  
  // People
  await brainy.add('John Smith: Senior Software Engineer at TechCorp, expert in Python, JavaScript, React, Node.js', {
    type: 'person',
    name: 'John Smith',
    role: 'Senior Software Engineer',
    company: 'TechCorp',
    skills: ['Python', 'JavaScript', 'React', 'Node.js'],
    experience: 8,
    salary: 150000
  })
  
  await brainy.add('Jane Doe: Data Scientist at DataCo, specializes in Python, TensorFlow, Machine Learning, Statistics', {
    type: 'person',
    name: 'Jane Doe',
    role: 'Data Scientist',
    company: 'DataCo',
    skills: ['Python', 'TensorFlow', 'Machine Learning', 'Statistics'],
    experience: 6,
    salary: 180000
  })
  
  await brainy.add('Alice Chen: Product Manager at StartupXYZ, focuses on Product Strategy, Analytics, User Research', {
    type: 'person',
    name: 'Alice Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    skills: ['Product Strategy', 'Analytics', 'User Research'],
    experience: 5,
    salary: 130000
  })
  
  // Projects
  await brainy.add('Customer Analytics Platform: AI-powered platform using Python and TensorFlow for churn prediction', {
    type: 'project',
    name: 'Customer Analytics Platform',
    tech: ['Python', 'TensorFlow', 'PostgreSQL'],
    status: 'active',
    budget: 500000
  })
  
  await brainy.add('E-commerce Recommendation Engine: Machine learning system for personalized product recommendations', {
    type: 'project',
    name: 'Recommendation Engine',
    tech: ['Python', 'scikit-learn', 'Redis'],
    status: 'completed',
    budget: 250000
  })
  
  console.log('✅ Setup complete!\n')
  
  // Test queries
  const chat = new BrainyChat(brainy)
  
  console.log('🧪 Testing queries:\n')
  
  const tests = [
    'Who knows Python?',
    'What projects are active?',
    'Find data scientists'
  ]
  
  for (const query of tests) {
    console.log(`Q: ${query}`)
    const answer = await chat.ask(query)
    console.log(`A: ${answer}\n`)
  }
  
  console.log('🎉 Ready! Try these commands:\n')
  console.log('  node bin/cortex.js chat')
  console.log('  node bin/cortex.js chat "Who knows Python?"')
  console.log('  node bin/cortex.js stats --detailed')
  console.log('  node bin/cortex.js fields')
  console.log('  node bin/cortex.js similarity "engineer" "developer"')
  
  process.exit(0)
}

cleanSetup().catch(console.error)