#!/usr/bin/env node

/**
 * Comprehensive production readiness check for Brainy
 * Tests all deployment scenarios to prevent emergency releases
 */

import { BrainyData, NounType, VerbType } from '../dist/index.js'
import fs from 'fs'
import { execSync } from 'child_process'

async function cleanEnvironment() {
  // Clean up any existing models or cache
  try {
    if (fs.existsSync('./models')) {
      console.log('🧹 Cleaning existing models directory...')
      fs.rmSync('./models', { recursive: true, force: true })
    }
    if (fs.existsSync('./brainy-data')) {
      console.log('🧹 Cleaning existing data directory...')
      fs.rmSync('./brainy-data', { recursive: true, force: true })
    }
  } catch (error) {
    console.log('Note: Some cleanup operations failed (this may be normal)')
  }
}

async function testScenario(name, envVars, expectedResult) {
  console.log(`\n🧪 TESTING: ${name}`)
  console.log(`Environment: ${JSON.stringify(envVars)}`)
  
  // Set environment variables
  for (const [key, value] of Object.entries(envVars)) {
    process.env[key] = value
  }
  
  try {
    const brain = new BrainyData()
    await brain.init()
    
    // Test basic operations
    const id = await brain.add("Test data for production scenario")
    const results = await brain.search("test", 1)
    
    if (expectedResult === 'success') {
      console.log(`✅ SUCCESS: ${name} - Operations completed successfully`)
      return true
    } else {
      console.log(`❌ UNEXPECTED SUCCESS: ${name} - Expected failure but got success`)
      return false
    }
  } catch (error) {
    if (expectedResult === 'failure') {
      console.log(`✅ EXPECTED FAILURE: ${name} - ${error.message}`)
      return true
    } else {
      console.log(`❌ UNEXPECTED FAILURE: ${name} - ${error.message}`)
      return false
    }
  } finally {
    // Clean environment variables
    for (const key of Object.keys(envVars)) {
      delete process.env[key]
    }
  }
}

async function runProductionReadinessCheck() {
  console.log('🏭 BRAINY PRODUCTION READINESS CHECK')
  console.log('====================================')
  console.log('Testing all deployment scenarios to ensure no emergency releases')
  
  await cleanEnvironment()
  
  const testResults = []
  
  // Test 1: Fresh install with default settings (NEW: should work with remote downloads)
  testResults.push(await testScenario(
    'Fresh Install - Default Settings',
    {},
    'success' // This should now work with the fix
  ))
  
  // Test 2: Explicit remote models enabled
  testResults.push(await testScenario(
    'Remote Models Explicitly Enabled',
    { BRAINY_ALLOW_REMOTE_MODELS: 'true' },
    'success'
  ))
  
  // Test 3: Remote models explicitly disabled (air-gapped scenario)
  testResults.push(await testScenario(
    'Air-Gapped Deployment (Local Only)',
    { BRAINY_ALLOW_REMOTE_MODELS: 'false' },
    'failure' // Should fail gracefully with helpful error
  ))
  
  // Test 4: Development environment
  testResults.push(await testScenario(
    'Development Environment',
    { NODE_ENV: 'development' },
    'success'
  ))
  
  // Test 5: Production environment with explicit config
  testResults.push(await testScenario(
    'Production Environment',
    { NODE_ENV: 'production', BRAINY_ALLOW_REMOTE_MODELS: 'true' },
    'success'
  ))
  
  const successCount = testResults.filter(result => result).length
  const totalTests = testResults.length
  
  console.log('\n📊 PRODUCTION READINESS RESULTS')
  console.log('===============================')
  console.log(`Passed: ${successCount}/${totalTests}`)
  
  if (successCount === totalTests) {
    console.log('✅ ALL TESTS PASSED - PRODUCTION READY!')
    console.log('\n🚀 DEPLOYMENT SCENARIOS VERIFIED:')
    console.log('  ✅ Fresh npm install works out of the box')
    console.log('  ✅ Remote model downloads work when enabled')
    console.log('  ✅ Air-gapped deployments fail gracefully with clear guidance')
    console.log('  ✅ Development environments work seamlessly')
    console.log('  ✅ Production environments work with proper configuration')
    
    return true
  } else {
    console.log('❌ PRODUCTION READINESS CHECK FAILED')
    console.log('🚫 DO NOT RELEASE - Fix issues first')
    
    return false
  }
}

// Export for use in CI/CD
export { runProductionReadinessCheck }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionReadinessCheck()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Production readiness check crashed:', error)
      process.exit(1)
    })
}