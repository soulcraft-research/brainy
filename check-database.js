// Script to check if there's any data in the database
import { BrainyData } from './dist/brainyData.js';

async function checkDatabase() {
  try {
    console.log('Initializing BrainyData...');
    const db = new BrainyData();
    await db.init();
    
    console.log('Getting database status...');
    const status = await db.status();
    console.log('Database status:', JSON.stringify(status, null, 2));
    
    console.log('Getting statistics...');
    const stats = await db.getStatistics();
    console.log('Statistics:', JSON.stringify(stats, null, 2));
    
    console.log('Getting all nouns...');
    const nouns = await db.getAllNouns();
    console.log(`Found ${nouns.length} nouns in the database.`);
    
    if (nouns.length > 0) {
      console.log('Sample of nouns:');
      for (let i = 0; i < Math.min(5, nouns.length); i++) {
        console.log(`Noun ${i + 1}:`, JSON.stringify(nouns[i], null, 2));
      }
    }
    
    console.log('Getting all verbs...');
    const verbs = await db.getAllVerbs();
    console.log(`Found ${verbs.length} verbs in the database.`);
    
    if (verbs.length > 0) {
      console.log('Sample of verbs:');
      for (let i = 0; i < Math.min(5, verbs.length); i++) {
        console.log(`Verb ${i + 1}:`, JSON.stringify(verbs[i], null, 2));
      }
    }
    
    // Try a simple search to see if it returns any results
    console.log('Trying a simple search...');
    const searchResults = await db.searchText('test', 10);
    console.log(`Search returned ${searchResults.length} results.`);
    
    if (searchResults.length > 0) {
      console.log('Sample of search results:');
      for (let i = 0; i < Math.min(5, searchResults.length); i++) {
        console.log(`Result ${i + 1}:`, JSON.stringify({
          id: searchResults[i].id,
          score: searchResults[i].score,
          metadata: searchResults[i].metadata
        }, null, 2));
      }
    }
    
    // If no results, try adding a test item and searching again
    if (searchResults.length === 0 && nouns.length === 0) {
      console.log('No data found. Adding a test item...');
      const id = await db.add('This is a test item for searching', { noun: 'Thing', category: 'test' });
      console.log(`Added test item with ID: ${id}`);
      
      console.log('Trying search again...');
      const newSearchResults = await db.searchText('test', 10);
      console.log(`Search returned ${newSearchResults.length} results.`);
      
      if (newSearchResults.length > 0) {
        console.log('Sample of search results:');
        for (let i = 0; i < Math.min(5, newSearchResults.length); i++) {
          console.log(`Result ${i + 1}:`, JSON.stringify({
            id: newSearchResults[i].id,
            score: newSearchResults[i].score,
            metadata: newSearchResults[i].metadata
          }, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase().catch(console.error);