/**
 * Test script to demonstrate improved JSON document search capabilities
 * 
 * This script tests the new functionality for searching within JSON documents,
 * particularly focusing on company names in nested fields.
 */

/* eslint-disable no-console */

import { BrainyData } from '../src/brainyData.js'

async function runTest() {
  console.log('Starting JSON document search test...')
  
  // Initialize BrainyData
  const brainy = new BrainyData()
  await brainy.init()
  
  console.log('Adding test documents...')
  
  // Add some test documents with company names in different fields
  const doc1Id = await brainy.add({
    title: 'Employee Profile',
    person: {
      name: 'John Smith',
      company: 'Acme Corporation',
      position: 'Software Engineer'
    },
    skills: ['JavaScript', 'TypeScript', 'React']
  })
  
  const doc2Id = await brainy.add({
    title: 'Project Proposal',
    client: {
      name: 'TechSolutions Inc.',
      industry: 'Software Development'
    },
    description: 'A project to develop a new CRM system'
  })
  
  const doc3Id = await brainy.add({
    title: 'Partnership Agreement',
    parties: [
      {
        name: 'Global Innovations Ltd',
        type: 'Service Provider'
      },
      {
        name: 'DataCorp',
        type: 'Client'
      }
    ],
    details: 'Agreement for providing data processing services'
  })
  
  console.log('Documents added with IDs:', doc1Id, doc2Id, doc3Id)
  
  // Test 1: Standard search (before our improvements, this might not work well)
  console.log('\nTest 1: Standard search for "Acme Corporation"')
  const results1 = await brainy.search('Acme Corporation', 5)
  console.log(`Found ${results1.length} results:`)
  results1.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Test 2: Search with our new JSON processing (should work better)
  console.log('\nTest 2: Search with JSON object and priority fields')
  const results2 = await brainy.search({ company: 'Acme Corporation' }, 5, {
    priorityFields: ['company', 'name']
  })
  console.log(`Found ${results2.length} results:`)
  results2.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Test 3: Field-specific search
  console.log('\nTest 3: Field-specific search for "person.company=Acme Corporation"')
  const results3 = await brainy.search({ searchTerm: 'Acme Corporation' }, 5, {
    searchField: 'person.company'
  })
  console.log(`Found ${results3.length} results:`)
  results3.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Test 4: Search for TechSolutions Inc.
  console.log('\nTest 4: Search for "TechSolutions Inc."')
  const results4 = await brainy.search('TechSolutions Inc.', 5)
  console.log(`Found ${results4.length} results:`)
  results4.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Test 5: Field-specific search for TechSolutions
  console.log('\nTest 5: Field-specific search for "client.name=TechSolutions Inc."')
  const results5 = await brainy.search({ searchTerm: 'TechSolutions Inc.' }, 5, {
    searchField: 'client.name'
  })
  console.log(`Found ${results5.length} results:`)
  results5.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Test 6: Search for DataCorp in nested array
  console.log('\nTest 6: Search for "DataCorp" in nested array')
  const results6 = await brainy.search('DataCorp', 5)
  console.log(`Found ${results6.length} results:`)
  results6.forEach((result, i) => {
    console.log(`Result ${i+1}: ID=${result.id}, Score=${result.score}`)
  })
  
  // Clean up
  await brainy.clear()
  console.log('\nTest completed and database cleared.')
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error)
})
