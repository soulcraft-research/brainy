#!/usr/bin/env node

/**
 * Brainy CLI
 * A command-line interface for interacting with the Brainy vector database
 */

import { BrainyData, NounType, VerbType, FileSystemStorage } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { Command } from 'commander';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import package.json for version info
const packageJson = {
  name: '@soulcraft/brainy',
  version: '0.6.0',
  description: 'A vector database using HNSW indexing with Origin Private File System storage'
};

// Helper function to parse JSON safely
function parseJSON(str: string): any {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', (e as Error).message);
    return {};
  }
}

// Helper function to resolve noun type
function resolveNounType(type: string | number | undefined): NounType {
  if (!type) return NounType.Thing;

  // If it's a string, try to match it to a NounType
  if (typeof type === 'string') {
    const nounTypeKey = Object.keys(NounType).find(
      key => key.toLowerCase() === type.toLowerCase()
    );
    return nounTypeKey ? NounType[nounTypeKey as keyof typeof NounType] : NounType.Thing;
  }

  // Convert number to string type for safety
  return Object.values(NounType)[type as number] || NounType.Thing;
}

// Helper function to resolve verb type
function resolveVerbType(type: string | number | undefined): VerbType {
  if (!type) return VerbType.RelatedTo;

  // If it's a string, try to match it to a VerbType
  if (typeof type === 'string') {
    const verbTypeKey = Object.keys(VerbType).find(
      key => key.toLowerCase() === type.toLowerCase()
    );
    return verbTypeKey ? VerbType[verbTypeKey as keyof typeof VerbType] : VerbType.RelatedTo;
  }

  // Convert number to string type for safety
  return Object.values(VerbType)[type as number] || VerbType.RelatedTo;
}

// Create a new Command instance
const program = new Command();

// Configure the program
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

// Create data directory if it doesn't exist
const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a database instance with file system storage
const createDb = () => {
  return new BrainyData({
    storageAdapter: new FileSystemStorage(dataDir)
  });
};

// Define commands
program
  .command('init')
  .description('Initialize a new database')
  .action(async () => {
    try {
      const db = createDb();
      await db.init();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('add')
  .description('Add a new noun with the given text and optional metadata')
  .argument('<text>', 'Text to add as a noun')
  .argument('[metadata]', 'Optional metadata as JSON string')
  .action(async (text, metadataStr) => {
    try {
      const db = createDb();
      await db.init();

      const metadata = metadataStr ? parseJSON(metadataStr) : {};

      // Process metadata to handle noun type
      if (metadata.noun) {
        metadata.noun = resolveNounType(metadata.noun);
      }

      const id = await db.add(text, metadata);
      console.log(`Added noun with ID: ${id}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for nouns similar to the query')
  .argument('<query>', 'Search query text')
  .option('-l, --limit <number>', 'Maximum number of results to return', '5')
  .action(async (query, options) => {
    try {
      const db = createDb();
      await db.init();

      const limit = parseInt(options.limit, 10);
      const results = await db.searchText(query, limit);

      console.log(`Search results for "${query}":`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ID: ${result.id}`);
        console.log(`   Score: ${result.score.toFixed(4)}`);
        console.log(`   Metadata: ${JSON.stringify(result.metadata)}`);
        console.log(`   Vector: [${result.vector.slice(0, 3).map(v => v.toFixed(2)).join(', ')}...]`);
        console.log();
      });
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('get')
  .description('Get a noun by ID')
  .argument('<id>', 'ID of the noun to get')
  .action(async (id) => {
    try {
      const db = createDb();
      await db.init();

      const noun = await db.get(id);
      if (noun) {
        console.log(`Noun ID: ${noun.id}`);
        console.log(`Metadata: ${JSON.stringify(noun.metadata)}`);
        console.log(`Vector: [${noun.vector.slice(0, 5).map(v => v.toFixed(2)).join(', ')}...]`);
      } else {
        console.log(`No noun found with ID: ${id}`);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('delete')
  .description('Delete a noun by ID')
  .argument('<id>', 'ID of the noun to delete')
  .action(async (id) => {
    try {
      const db = createDb();
      await db.init();

      await db.delete(id);
      console.log(`Deleted noun with ID: ${id}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('addVerb')
  .description('Add a relationship between nouns')
  .argument('<sourceId>', 'ID of the source noun')
  .argument('<targetId>', 'ID of the target noun')
  .argument('<verbType>', 'Type of relationship')
  .argument('[metadata]', 'Optional metadata as JSON string')
  .action(async (sourceId, targetId, verbTypeStr, metadataStr) => {
    try {
      const db = createDb();
      await db.init();

      const verbType = resolveVerbType(verbTypeStr);
      const verbMetadata = metadataStr ? parseJSON(metadataStr) : {};

      // Add verb type to metadata
      verbMetadata.verb = verbType;

      const verbId = await db.addVerb(sourceId, targetId, verbMetadata);
      console.log(`Added verb with ID: ${verbId}`);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('getVerbs')
  .description('Get all relationships for a noun')
  .argument('<id>', 'ID of the noun to get relationships for')
  .action(async (id) => {
    try {
      const db = createDb();
      await db.init();

      const verbs = await db.getVerbsBySource(id);

      console.log(`Relationships for noun ${id}:`);
      if (verbs.length === 0) {
        console.log('No relationships found');
      } else {
        verbs.forEach((verb, index) => {
          console.log(`${index + 1}. ID: ${verb.id}`);
          console.log(`   Type: ${Object.keys(VerbType).find(key => VerbType[key as keyof typeof VerbType] === verb.metadata.verb) || verb.metadata.verb}`);
          console.log(`   Target: ${verb.targetId}`);
          console.log(`   Metadata: ${JSON.stringify(verb.metadata)}`);
          console.log();
        });
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show database status')
  .action(async () => {
    try {
      const db = createDb();
      await db.init();

      const status = await db.status();
      console.log('Database Status:');
      console.log(`Storage type: ${status.type}`);
      console.log(`Storage used: ${status.used} bytes`);
      console.log(`Storage quota: ${status.quota !== null ? `${status.quota} bytes` : 'unlimited'}`);

      // Display additional details if available
      if (status.details) {
        console.log('Additional details:');
        Object.entries(status.details).forEach(([key, value]) => {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        });
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Add examples to help text
program.addHelpText('after', `
Examples:
  $ brainy init
  $ brainy add "Cats are independent pets" '{"noun":"Thing","category":"animal"}'
  $ brainy search "feline pets" --limit 5
  $ brainy addVerb id1 id2 RelatedTo '{"description":"Both are pets"}'
`);

// Parse command line arguments
program.parse();
