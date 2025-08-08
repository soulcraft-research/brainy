#!/usr/bin/env node

// Quick demo with data and search
import { BrainyData } from './dist/index.js'
import { BrainyChat } from './dist/chat/brainyChat.js'

async function demo() {
  console.log('🧠 Setting up demo data...\n')
  
  // Create Brainy with memory storage
  const brainy = new BrainyData({ 
    storage: { forceMemoryStorage: true } 
  })
  await brainy.init()
  
  // Add people with clear Python skills
  console.log('Adding people...')
  await brainy.add('John Smith - Senior Software Engineer at TechCorp who knows Python, JavaScript, and React', {
    type: 'person',
    name: 'John Smith',
    skills: ['Python', 'JavaScript', 'React']
  })
  
  await brainy.add('Jane Doe - Data Scientist at DataCo expert in Python, TensorFlow, and Machine Learning', {
    type: 'person', 
    name: 'Jane Doe',
    skills: ['Python', 'TensorFlow', 'ML']
  })
  
  await brainy.add('Bob Wilson - Designer at DesignHub skilled in Figma, Sketch, and Adobe', {
    type: 'person',
    name: 'Bob Wilson', 
    skills: ['Figma', 'Sketch', 'Adobe']
  })
  
  console.log('✅ Data added!\n')
  
  // Create chat
  const chat = new BrainyChat(brainy)
  
  // Test questions
  console.log('💬 Testing questions:\n')
  
  const questions = [
    "Who knows Python?",
    "List all people",
    "Find data scientists",
    "How many people are there?"
  ]
  
  for (const q of questions) {
    console.log(`Q: ${q}`)
    const answer = await chat.ask(q)
    console.log(`A: ${answer}\n`)
  }
  
  // Also test search directly
  console.log('🔍 Direct search for "Python":')
  const results = await brainy.search('Python', 5)
  results.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.id.substring(0, 50)}... (${(r.score * 100).toFixed(0)}% match)`)
    if (r.metadata?.name) {
      console.log(`     Name: ${r.metadata.name}`)
    }
  })
}

demo().catch(console.error)