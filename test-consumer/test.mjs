import { BrainyData } from '@soulcraft/brainy';

async function testBrainy() {
  try {
    console.log('Creating BrainyData instance...');
    const brainy = new BrainyData({
      storageType: 'memory',
      defaultEmbeddingOptions: { verbose: false }
    });
    
    console.log('Initializing...');
    await brainy.init();
    
    console.log('Adding data...');
    await brainy.add({ name: 'test', data: 'Test document' });
    
    console.log('Searching...');
    const results = await brainy.search({ query: 'test' });
    console.log('Search results:', results);
    
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testBrainy();