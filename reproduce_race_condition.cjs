#!/usr/bin/env node

/**
 * Reproduction script for race condition issues in Brainy
 * 
 * This script demonstrates two main issues:
 * 1. Race condition: Verbs arrive before their associated nouns are indexed
 * 2. Indexing delay: Newly inserted nouns can't be looked up immediately
 */

const { BrainyData } = require('./dist/unified.js');

async function reproduceRaceCondition() {
  console.log('🧠 Starting Brainy Race Condition Reproduction Test');
  console.log('=' .repeat(60));

  const brainy = new BrainyData({
    dimensions: 512, // Use correct dimensions for Universal Sentence Encoder
    maxConnections: 16,
    efConstruction: 200,
    storageType: 'memory' // Use memory storage for faster testing
  });

  await brainy.init();

  console.log('\n📊 Test 1: Race Condition - Verbs before Nouns');
  console.log('-'.repeat(50));

  try {
    // Simulate streaming data where verbs arrive before nouns
    const sourceId = 'user-123';
    const targetId = 'post-456';
    
    console.log(`Attempting to add verb between ${sourceId} and ${targetId} before nouns exist...`);
    
    // This should fail because the nouns don't exist yet
    await brainy.addVerb(sourceId, targetId, null, {
      type: 'likes',
      metadata: { action: 'like', timestamp: Date.now() }
    });
    
    console.log('❌ Expected failure did not occur - this indicates the race condition is not properly handled');
    
  } catch (error) {
    console.log('✅ Expected error occurred:', error.message);
  }

  console.log('\n📊 Test 2: Indexing Delay Issue');
  console.log('-'.repeat(50));

  try {
    // Add a noun
    const nounId = 'rapid-noun-' + Date.now();
    console.log(`Adding noun with ID: ${nounId}`);
    
    await brainy.add(Array.from({length: 512}, () => Math.random()), { 
      type: 'user', 
      name: 'Test User' 
    }, { id: nounId });
    
    console.log('✅ Noun added successfully');
    
    // Immediately try to add a verb that references this noun
    const verbTargetId = 'target-' + Date.now();
    
    // Add target noun
    await brainy.add(Array.from({length: 512}, () => Math.random()), { 
      type: 'post', 
      title: 'Test Post' 
    }, { id: verbTargetId });
    
    console.log('✅ Target noun added successfully');
    
    // Now try to add verb immediately - this might fail due to indexing delay
    console.log(`Attempting to add verb between ${nounId} and ${verbTargetId} immediately after noun creation...`);
    
    const verbId = await brainy.addVerb(nounId, verbTargetId, null, {
      type: 'created',
      metadata: { action: 'create', timestamp: Date.now() }
    });
    
    console.log('✅ Verb added successfully with ID:', verbId);
    
  } catch (error) {
    console.log('❌ Indexing delay error occurred:', error.message);
  }

  console.log('\n📊 Test 3: Rapid Streaming Simulation');
  console.log('-'.repeat(50));

  const errors = [];
  const successes = [];
  
  // Simulate rapid streaming of mixed noun and verb data
  const operations = [];
  
  for (let i = 0; i < 50; i++) {
    const userId = `user-${i}`;
    const postId = `post-${i}`;
    
    // Randomly order noun and verb operations to simulate streaming
    if (Math.random() > 0.5) {
      // Add verb first (should fail without autoCreateMissingNouns)
      operations.push({
        type: 'verb',
        sourceId: userId,
        targetId: postId,
        verbType: 'likes',
        id: i
      });
      
      // Then add nouns
      operations.push({
        type: 'noun',
        id: userId,
        vector: Array.from({length: 512}, () => Math.random()),
        metadata: { type: 'user', name: `User ${i}` }
      });
      
      operations.push({
        type: 'noun',
        id: postId,
        vector: Array.from({length: 512}, () => Math.random()),
        metadata: { type: 'post', title: `Post ${i}` }
      });
    } else {
      // Add nouns first
      operations.push({
        type: 'noun',
        id: userId,
        vector: Array.from({length: 384}, () => Math.random()),
        metadata: { type: 'user', name: `User ${i}` }
      });
      
      operations.push({
        type: 'noun',
        id: postId,
        vector: Array.from({length: 384}, () => Math.random()),
        metadata: { type: 'post', title: `Post ${i}` }
      });
      
      // Then add verb
      operations.push({
        type: 'verb',
        sourceId: userId,
        targetId: postId,
        verbType: 'likes',
        id: i
      });
    }
  }

  console.log(`Executing ${operations.length} operations in streaming order...`);

  for (const op of operations) {
    try {
      if (op.type === 'noun') {
        await brainy.add(op.vector, op.metadata, { id: op.id });
        successes.push(`Added noun ${op.id}`);
      } else if (op.type === 'verb') {
        await brainy.addVerb(op.sourceId, op.targetId, null, {
          type: op.verbType,
          metadata: { streamingTest: true, operationId: op.id }
        });
        successes.push(`Added verb ${op.sourceId} -> ${op.targetId}`);
      }
    } catch (error) {
      errors.push(`${op.type} operation failed: ${error.message}`);
    }
  }

  console.log('\n📈 Results Summary:');
  console.log(`✅ Successful operations: ${successes.length}`);
  console.log(`❌ Failed operations: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Error Details:');
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log('\n📊 Test 4: Auto-Create Missing Nouns Feature');
  console.log('-'.repeat(50));

  try {
    const autoSourceId = 'auto-user-' + Date.now();
    const autoTargetId = 'auto-post-' + Date.now();
    
    console.log(`Testing autoCreateMissingNouns feature with ${autoSourceId} -> ${autoTargetId}`);
    
    const autoVerbId = await brainy.addVerb(autoSourceId, autoTargetId, null, {
      type: 'follows',
      autoCreateMissingNouns: true,
      missingNounMetadata: { autoCreated: true, testCase: 'reproduction' },
      metadata: { testFeature: 'autoCreate' }
    });
    
    console.log('✅ Auto-create feature worked! Verb ID:', autoVerbId);
    
    // Verify the auto-created nouns exist
    const autoSourceNoun = await brainy.get(autoSourceId);
    const autoTargetNoun = await brainy.get(autoTargetId);
    
    console.log('✅ Auto-created source noun exists:', !!autoSourceNoun);
    console.log('✅ Auto-created target noun exists:', !!autoTargetNoun);
    
  } catch (error) {
    console.log('❌ Auto-create feature failed:', error.message);
  }

  await brainy.shutDown();
  
  console.log('\n🏁 Race Condition Reproduction Test Complete');
  console.log('=' .repeat(60));
  
  if (errors.length > 0) {
    console.log('\n💡 Recommendations:');
    console.log('1. Implement fallback storage lookup when index lookup fails');
    console.log('2. Add deferred resolution queue for missing noun references');
    console.log('3. Implement write-only mode that bypasses index checks');
    console.log('4. Add proper index synchronization mechanisms');
    
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed - race conditions may already be handled');
    process.exit(0);
  }
}

// Run the reproduction test
reproduceRaceCondition().catch(error => {
  console.error('💥 Reproduction script failed:', error);
  process.exit(1);
});
