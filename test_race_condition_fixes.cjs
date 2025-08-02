#!/usr/bin/env node

/**
 * Simple test script to verify race condition fixes
 */

const { BrainyData } = require('./dist/unified.js');

async function testRaceConditionFixes() {
  console.log('🧠 Testing Race Condition Fixes');
  console.log('=' .repeat(50));

  const brainy = new BrainyData({
    dimensions: 512,
    maxConnections: 16,
    efConstruction: 200,
    storageType: 'memory'
  });

  await brainy.init();

  console.log('\n📊 Test 1: Write-Only Mode');
  console.log('-'.repeat(30));

  try {
    // Test writeOnlyMode - should succeed even without existing nouns
    const verbId = await brainy.addVerb('user-writeonly-1', 'post-writeonly-1', null, {
      type: 'likes',
      writeOnlyMode: true,
      metadata: { test: 'writeOnlyMode' }
    });
    
    console.log('✅ Write-only mode verb added successfully:', verbId);
    
    // Verify the verb was created
    const verb = await brainy.getVerb(verbId);
    console.log('✅ Verb retrieved successfully:', !!verb);
    
  } catch (error) {
    console.log('❌ Write-only mode test failed:', error.message);
  }

  console.log('\n📊 Test 2: Auto-Create Missing Nouns');
  console.log('-'.repeat(30));

  try {
    // Test autoCreateMissingNouns
    const verbId2 = await brainy.addVerb('user-auto-1', 'post-auto-1', null, {
      type: 'follows',
      autoCreateMissingNouns: true,
      metadata: { test: 'autoCreate' }
    });
    
    console.log('✅ Auto-create verb added successfully:', verbId2);
    
    // Verify the auto-created nouns exist
    const sourceNoun = await brainy.get('user-auto-1');
    const targetNoun = await brainy.get('post-auto-1');
    
    console.log('✅ Auto-created source noun exists:', !!sourceNoun);
    console.log('✅ Auto-created target noun exists:', !!targetNoun);
    
  } catch (error) {
    console.log('❌ Auto-create test failed:', error.message);
  }

  console.log('\n📊 Test 3: Normal Mode (Should Fail)');
  console.log('-'.repeat(30));

  try {
    // Test normal mode without existing nouns - should fail
    await brainy.addVerb('user-normal-1', 'post-normal-1', null, {
      type: 'mentions',
      metadata: { test: 'normalMode' }
    });
    
    console.log('❌ Normal mode should have failed but succeeded');
    
  } catch (error) {
    console.log('✅ Normal mode correctly failed:', error.message);
  }

  console.log('\n📊 Test 4: Fallback Storage Lookup');
  console.log('-'.repeat(30));

  try {
    // First add a noun normally
    const nounId = await brainy.add(Array.from({length: 512}, () => Math.random()), {
      type: 'user',
      name: 'Test User for Fallback'
    }, { id: 'fallback-test-user' });
    
    console.log('✅ Noun added for fallback test:', nounId);
    
    // Add another noun
    const targetId = await brainy.add(Array.from({length: 512}, () => Math.random()), {
      type: 'post', 
      title: 'Test Post for Fallback'
    }, { id: 'fallback-test-post' });
    
    console.log('✅ Target noun added for fallback test:', targetId);
    
    // Now try to add a verb - this should work with fallback storage lookup
    const verbId3 = await brainy.addVerb('fallback-test-user', 'fallback-test-post', null, {
      type: 'created',
      metadata: { test: 'fallbackLookup' }
    });
    
    console.log('✅ Fallback storage lookup verb added successfully:', verbId3);
    
  } catch (error) {
    console.log('❌ Fallback storage lookup test failed:', error.message);
  }

  await brainy.shutDown();
  
  console.log('\n🏁 Race Condition Fixes Test Complete');
  console.log('=' .repeat(50));
}

// Run the test
testRaceConditionFixes().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
