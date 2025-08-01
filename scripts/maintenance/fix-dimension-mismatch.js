// Script to fix dimension mismatch by re-embedding existing data
import { BrainyData } from './dist/brainyData.js';
import fs from 'fs';
import path from 'path';

async function fixDimensionMismatch() {
  try {
    console.log('Starting dimension mismatch fix...');
    
    // Create a backup of the existing data
    const backupDir = './brainy-data-backup-' + Date.now();
    console.log(`Creating backup of existing data in ${backupDir}...`);
    
    // Copy the entire brainy-data directory to the backup directory
    await fs.promises.mkdir(backupDir, { recursive: true });
    await copyDirectory('./brainy-data', backupDir);
    console.log('Backup created successfully.');
    
    // Initialize BrainyData with the current embedding function
    console.log('Initializing BrainyData...');
    const db = new BrainyData();
    await db.init();
    
    // Get database status to check if there's any data
    const status = await db.status();
    console.log('Database status:', JSON.stringify(status, null, 2));
    
    // Read all noun files directly from the filesystem
    console.log('Reading noun files directly from filesystem...');
    const nounsDir = './brainy-data/nouns';
    const files = await fs.promises.readdir(nounsDir);
    
    // Process each noun file
    const processedNouns = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(nounsDir, file);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const parsedNoun = JSON.parse(data);
        
        // Get the metadata for this noun
        const metadataPath = path.join('./brainy-data/metadata', `${parsedNoun.id}.json`);
        let metadata = {};
        try {
          const metadataData = await fs.promises.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metadataData);
        } catch (error) {
          console.warn(`No metadata found for noun ${parsedNoun.id}`);
        }
        
        // Extract text from metadata if available
        let text = '';
        if (metadata.text) {
          text = metadata.text;
        } else if (metadata.description) {
          text = metadata.description;
        } else {
          // If no text is available, use a placeholder
          text = `Noun ${parsedNoun.id}`;
          console.warn(`No text found for noun ${parsedNoun.id}, using placeholder`);
        }
        
        // Re-embed the text using the current embedding function
        console.log(`Re-embedding noun ${parsedNoun.id}...`);
        try {
          // Delete the existing noun first
          await db.delete(parsedNoun.id);
          
          // Add the noun with the same ID but new vector
          const newId = await db.add(text, metadata, { id: parsedNoun.id });
          processedNouns.push({ id: newId, originalId: parsedNoun.id });
          console.log(`Successfully re-embedded noun ${parsedNoun.id}`);
        } catch (error) {
          console.error(`Error re-embedding noun ${parsedNoun.id}:`, error);
        }
      }
    }
    
    console.log(`Processed ${processedNouns.length} nouns.`);
    
    // Recreate verbs
    console.log('Reading verb files directly from filesystem...');
    const verbsDir = './brainy-data/verbs';
    const verbFiles = await fs.promises.readdir(verbsDir);
    
    // Process each verb file
    const processedVerbs = [];
    for (const file of verbFiles) {
      if (file.endsWith('.json')) {
        const filePath = path.join(verbsDir, file);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const parsedVerb = JSON.parse(data);
        
        // Check if both source and target nouns exist
        const sourceExists = processedNouns.some(n => n.originalId === parsedVerb.sourceId);
        const targetExists = processedNouns.some(n => n.originalId === parsedVerb.targetId);
        
        if (sourceExists && targetExists) {
          console.log(`Re-creating verb ${parsedVerb.id} between ${parsedVerb.sourceId} and ${parsedVerb.targetId}...`);
          try {
            // Delete the existing verb first
            await db.deleteVerb(parsedVerb.id);
            
            // Add the verb with the same relationship
            await db.addVerb(parsedVerb.sourceId, parsedVerb.targetId, {
              verb: parsedVerb.type || 'RelatedTo',
              ...parsedVerb.metadata
            });
            
            processedVerbs.push(parsedVerb.id);
            console.log(`Successfully re-created verb ${parsedVerb.id}`);
          } catch (error) {
            console.error(`Error re-creating verb ${parsedVerb.id}:`, error);
          }
        } else {
          console.warn(`Skipping verb ${parsedVerb.id} because source or target noun doesn't exist`);
        }
      }
    }
    
    console.log(`Processed ${processedVerbs.length} verbs.`);
    
    // Try a search to verify it works
    console.log('Trying a search to verify it works...');
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
    
    console.log('Dimension mismatch fix completed successfully.');
  } catch (error) {
    console.error('Error fixing dimension mismatch:', error);
  }
}

// Helper function to copy a directory recursively
async function copyDirectory(source, destination) {
  const entries = await fs.promises.readdir(source, { withFileTypes: true });
  
  await fs.promises.mkdir(destination, { recursive: true });
  
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

fixDimensionMismatch().catch(console.error);