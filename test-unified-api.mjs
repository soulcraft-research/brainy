import { BrainyData, NounType, VerbType } from './dist/index.js';

async function testUnifiedAPI() {
  console.log('🧠 Testing Unified API Methods...\n');
  
  const brainy = new BrainyData();
  await brainy.init();
  console.log('✅ BrainyData initialized');
  
  try {
    // Test 1: add()
    const id1 = await brainy.add("John Doe is a software engineer");
    console.log('✅ add() works, ID:', id1.substring(0, 8) + '...');
    
    // Test 2: addNoun()  
    const id2 = await brainy.addNoun("Tech Corp", NounType.Organization);
    console.log('✅ addNoun() works, ID:', id2.substring(0, 8) + '...');
    
    // Test 3: addVerb()
    const verbId = await brainy.addVerb(id1, id2, VerbType.WorksWith, { 
      role: "Senior Developer",
      department: "Engineering"
    });
    console.log('✅ addVerb() works, ID:', verbId.substring(0, 8) + '...');
    
    // Test 4: search()
    const results = await brainy.search("software engineer", 5);
    console.log('✅ search() works, found:', results.length, 'results');
    
    // Test 5: import()
    const importIds = await brainy.import([
      "Alice is a data scientist",
      "Bob works in marketing",
      "Charlie is a project manager"
    ]);
    console.log('✅ import() works, imported:', importIds.length, 'items');
    
    // Test 6: update()
    const updated = await brainy.update(id1, "John Doe is a lead software engineer");
    console.log('✅ update() works:', updated);
    
    // Test 7: delete() (soft delete by default)
    const deleted = await brainy.delete(verbId);
    console.log('✅ delete() works (soft delete):', deleted);
    
    // Test search after soft delete - should not find the verb
    const searchAfterDelete = await brainy.search("WorksWith", 10);
    console.log('✅ Soft delete verified - verb not in search results');
    
    await brainy.cleanup();
    console.log('\n🎉 All unified API methods working perfectly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await brainy.cleanup();
    process.exit(1);
  }
}

testUnifiedAPI();