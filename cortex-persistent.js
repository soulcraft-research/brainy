#!/usr/bin/env node

// Persistent Cortex setup using filesystem
import { Cortex } from './dist/cortex/cortex.js'

async function setup() {
  console.log('🧠 Setting up persistent Cortex with filesystem storage...\n')
  
  const cortex = new Cortex()
  
  // Initialize with filesystem (persistent)
  await cortex.init({
    storage: 'filesystem',
    encryption: false,
    chat: true
  })
  
  // Add sample data
  console.log('Adding sample data...\n')
  
  await cortex.add('John Smith is a Senior Software Engineer at TechCorp who specializes in Python and JavaScript', {
    type: 'person',
    name: 'John Smith',
    role: 'Senior Software Engineer',
    company: 'TechCorp',
    skills: ['Python', 'JavaScript', 'React'],
    experience: 8
  })
  
  await cortex.add('Jane Doe is a Data Scientist at DataCo expert in Python and Machine Learning', {
    type: 'person',
    name: 'Jane Doe',
    role: 'Data Scientist',
    company: 'DataCo',
    skills: ['Python', 'TensorFlow', 'Machine Learning'],
    experience: 6
  })
  
  await cortex.add('Alice Chen is a Product Manager at StartupXYZ', {
    type: 'person',
    name: 'Alice Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    skills: ['Product Strategy', 'Analytics'],
    experience: 5
  })
  
  await cortex.add('AI Customer Analytics Platform using machine learning', {
    type: 'project',
    name: 'Customer Analytics',
    status: 'active',
    tech: ['Python', 'TensorFlow']
  })
  
  console.log('\n✅ Setup complete! Data is now persistent.\n')
  console.log('Try these commands:\n')
  console.log('  node bin/cortex.js chat "Who knows Python?"')
  console.log('  node bin/cortex.js search "Python"')
  console.log('  node bin/cortex.js stats')
  console.log('  node bin/cortex.js fields')
  console.log('  node bin/cortex.js chat  # Interactive mode')
}

setup().catch(console.error)