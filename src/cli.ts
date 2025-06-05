#!/usr/bin/env node

/**
 * Brainy CLI
 * A command-line interface for interacting with the Brainy vector database
 */

import { BrainyData, NounType, VerbType, FileSystemStorage } from './index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { Command } from 'commander'
import omelette from 'omelette'
import { VERSION } from './utils/version.js'
import { sequentialPipeline } from './sequentialPipeline.js'
import { augmentationPipeline, ExecutionMode } from './augmentationPipeline.js'
import { AugmentationType } from './types/augmentations.js'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper function to parse JSON safely
function parseJSON(str: string): any {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.error('Error parsing JSON:', (e as Error).message)
    return {}
  }
}

// Helper function to resolve noun type
function resolveNounType(type: string | number | undefined): NounType {
  if (!type) return NounType.Thing

  // If it's a string, try to match it to a NounType
  if (typeof type === 'string') {
    const nounTypeKey = Object.keys(NounType).find(
      key => key.toLowerCase() === type.toLowerCase()
    )
    return nounTypeKey ? NounType[nounTypeKey as keyof typeof NounType] : NounType.Thing
  }

  // Convert number to string type for safety
  return Object.values(NounType)[type as number] || NounType.Thing
}

// Helper function to resolve verb type
function resolveVerbType(type: string | number | undefined): VerbType {
  if (!type) return VerbType.RelatedTo

  // If it's a string, try to match it to a VerbType
  if (typeof type === 'string') {
    const verbTypeKey = Object.keys(VerbType).find(
      key => key.toLowerCase() === type.toLowerCase()
    )
    return verbTypeKey ? VerbType[verbTypeKey as keyof typeof VerbType] : VerbType.RelatedTo
  }

  // Convert number to string type for safety
  return Object.values(VerbType)[type as number] || VerbType.RelatedTo
}

// Create a new Command instance
const program = new Command()

// Configure the program
program
  .name('@soulcraft/brainy')
  .description('A vector database using HNSW indexing with Origin Private File System storage')
  .version(VERSION, '-V, --version', 'Output the current version')

// Create data directory if it doesn't exist
const dataDir = join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Create a database instance with file system storage
const createDb = () => {
  return new BrainyData({
    storageAdapter: new FileSystemStorage(dataDir)
  })
}

// Define commands
program
  .command('init')
  .description('Initialize a new database')
  .action(async () => {
    try {
      const db = createDb()
      await db.init()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('add')
  .description('Add a new noun with the given text and optional metadata')
  .argument('<text>', 'Text to add as a noun')
  .argument('[metadata]', 'Optional metadata as JSON string')
  .action(async (text, metadataStr) => {
    try {
      const db = createDb()
      await db.init()

      const metadata = metadataStr ? parseJSON(metadataStr) : {}

      // Process metadata to handle noun type
      if (metadata.noun) {
        metadata.noun = resolveNounType(metadata.noun)
      }

      const id = await db.add(text, metadata)
      console.log(`Added noun with ID: ${id}`)
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('search')
  .description('Search for nouns similar to the query')
  .argument('<query>', 'Search query text')
  .option('-l, --limit <number>', 'Maximum number of results to return', '5')
  .action(async (query, options) => {
    try {
      const db = createDb()
      await db.init()

      const limit = parseInt(options.limit, 10)
      const results = await db.searchText(query, limit)

      console.log(`Search results for "${query}":`)
      results.forEach((result, index) => {
        console.log(`${index + 1}. ID: ${result.id}`)
        console.log(`   Score: ${result.score.toFixed(4)}`)
        console.log(`   Metadata: ${JSON.stringify(result.metadata)}`)
        console.log(`   Vector: [${result.vector.slice(0, 3).map(v => v.toFixed(2)).join(', ')}...]`)
        console.log()
      })
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('get')
  .description('Get a noun by ID')
  .argument('<id>', 'ID of the noun to get')
  .action(async (id) => {
    try {
      const db = createDb()
      await db.init()

      const noun = await db.get(id)
      if (noun) {
        console.log(`Noun ID: ${noun.id}`)
        console.log(`Metadata: ${JSON.stringify(noun.metadata)}`)
        console.log(`Vector: [${noun.vector.slice(0, 5).map(v => v.toFixed(2)).join(', ')}...]`)
      } else {
        console.log(`No noun found with ID: ${id}`)
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('delete')
  .description('Delete a noun by ID')
  .argument('<id>', 'ID of the noun to delete')
  .action(async (id) => {
    try {
      const db = createDb()
      await db.init()

      await db.delete(id)
      console.log(`Deleted noun with ID: ${id}`)
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('addVerb')
  .description('Add a relationship between nouns')
  .argument('<sourceId>', 'ID of the source noun')
  .argument('<targetId>', 'ID of the target noun')
  .argument('<verbType>', 'Type of relationship')
  .argument('[metadata]', 'Optional metadata as JSON string')
  .action(async (sourceId, targetId, verbTypeStr, metadataStr) => {
    try {
      const db = createDb()
      await db.init()

      const verbType = resolveVerbType(verbTypeStr)
      const verbMetadata = metadataStr ? parseJSON(metadataStr) : {}

      // Add verb type to metadata
      verbMetadata.verb = verbType

      const verbId = await db.addVerb(sourceId, targetId, undefined, {
        type: verbType,
        metadata: verbMetadata
      })
      console.log(`Added verb with ID: ${verbId}`)
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('getVerbs')
  .description('Get all relationships for a noun')
  .argument('<id>', 'ID of the noun to get relationships for')
  .action(async (id) => {
    try {
      const db = createDb()
      await db.init()

      const verbs = await db.getVerbsBySource(id)

      console.log(`Relationships for noun ${id}:`)
      if (verbs.length === 0) {
        console.log('No relationships found')
      } else {
        verbs.forEach((verb, index) => {
          console.log(`${index + 1}. ID: ${verb.id}`)
          console.log(`   Type: ${Object.keys(VerbType).find(key => VerbType[key as keyof typeof VerbType] === verb.metadata.verb) || verb.metadata.verb}`)
          console.log(`   Target: ${verb.targetId}`)
          console.log(`   Metadata: ${JSON.stringify(verb.metadata)}`)
          console.log()
        })
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Show database status')
  .action(async () => {
    try {
      const db = createDb()
      await db.init()

      const status = await db.status()
      console.log('Database Status:')
      console.log(`Storage type: ${status.type}`)
      console.log(`Storage used: ${status.used} bytes`)
      console.log(`Storage quota: ${status.quota !== null ? `${status.quota} bytes` : 'unlimited'}`)

      // Display additional details if available
      if (status.details) {
        console.log('Additional details:')
        Object.entries(status.details).forEach(([key, value]) => {
          console.log(`  ${key}: ${JSON.stringify(value)}`)
        })
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('clear')
  .description('Clear all data from the database')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (options) => {
    try {
      // Confirm unless --force is used
      if (!options.force) {
        console.log('WARNING: This will permanently delete ALL data in the database.')
        console.log('To proceed without confirmation, use the --force option.')

        // Exit without doing anything
        console.log('Operation cancelled. No data was deleted.')
        console.log('To clear all data, use: brainy clear --force')
        return
      }

      const db = createDb()
      await db.init()

      await db.clear()
      console.log('Database cleared successfully. All data has been removed.')
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('visualize')
  .description('Visualize the graph structure in ASCII format')
  .option('-r, --root <id>', 'ID of the root noun to start visualization from')
  .option('-d, --depth <number>', 'Maximum depth of the graph to visualize', '2')
  .option('-t, --type <type>', 'Filter by noun type')
  .option('-l, --limit <number>', 'Maximum number of nodes to display per level', '10')
  .action(async (options) => {
    try {
      const db = createDb()
      await db.init()

      // Parse options
      const depth = parseInt(options.depth, 10)
      const limit = parseInt(options.limit, 10)
      const rootId = options.root
      const nounType = options.type ? resolveNounType(options.type) : undefined

      // Get all nouns if no root is specified
      if (!rootId && !nounType) {
        // Get all nouns (limited by the limit option)
        const allNouns = []
        let count = 0

        // Since there's no direct method to get all nouns, we'll use search with a high limit
        const searchResults = await db.search("", 1000, { 
          forceEmbed: true 
        })

        for (const result of searchResults) {
          if (count >= limit) break
          allNouns.push(result)
          count++
        }

        if (allNouns.length === 0) {
          console.log('No nouns found in the database.')
          return
        }

        console.log(`Graph Overview (showing ${allNouns.length} nouns):\n`)

        for (const noun of allNouns) {
          // Get outgoing verbs
          const outgoingVerbs = await db.getVerbsBySource(noun.id)
          // Get incoming verbs
          const incomingVerbs = await db.getVerbsByTarget(noun.id)

          const nounType = noun.metadata?.noun || 'Unknown'
          const label = noun.metadata?.label || noun.id.substring(0, 8)

          console.log(`[${nounType}] ${label} (${noun.id})`)

          if (outgoingVerbs.length > 0) {
            console.log('  Outgoing:')
            for (const verb of outgoingVerbs.slice(0, limit)) {
              const targetNoun = await db.get(verb.targetId)
              const targetLabel = targetNoun?.metadata?.label || verb.targetId.substring(0, 8)
              console.log(`    --(${verb.metadata?.verb || 'relates to'})--→ [${targetNoun?.metadata?.noun || 'Unknown'}] ${targetLabel}`)
            }
            if (outgoingVerbs.length > limit) {
              console.log(`    ... and ${outgoingVerbs.length - limit} more`)
            }
          }

          if (incomingVerbs.length > 0) {
            console.log('  Incoming:')
            for (const verb of incomingVerbs.slice(0, limit)) {
              const sourceNoun = await db.get(verb.sourceId)
              const sourceLabel = sourceNoun?.metadata?.label || verb.sourceId.substring(0, 8)
              console.log(`    ←--(${verb.metadata?.verb || 'relates to'})-- [${sourceNoun?.metadata?.noun || 'Unknown'}] ${sourceLabel}`)
            }
            if (incomingVerbs.length > limit) {
              console.log(`    ... and ${incomingVerbs.length - limit} more`)
            }
          }

          console.log('')
        }

        return
      }

      // If noun type is specified but no root, show all nouns of that type
      if (!rootId && nounType) {
        console.log(`Visualizing nouns of type: ${nounType}\n`)

        // Search for nouns of the specified type
        const searchResults = await db.search("", 1000, { 
          nounTypes: [nounType],
          forceEmbed: true 
        })

        const filteredNouns = searchResults.slice(0, limit)

        if (filteredNouns.length === 0) {
          console.log(`No nouns found with type: ${nounType}`)
          return
        }

        for (const noun of filteredNouns) {
          const label = noun.metadata?.label || noun.id.substring(0, 8)

          console.log(`[${nounType}] ${label} (${noun.id})`)

          // Get outgoing verbs
          const outgoingVerbs = await db.getVerbsBySource(noun.id)
          if (outgoingVerbs.length > 0) {
            console.log('  Outgoing:')
            for (const verb of outgoingVerbs.slice(0, limit)) {
              const targetNoun = await db.get(verb.targetId)
              const targetLabel = targetNoun?.metadata?.label || verb.targetId.substring(0, 8)
              console.log(`    --(${verb.metadata?.verb || 'relates to'})--→ [${targetNoun?.metadata?.noun || 'Unknown'}] ${targetLabel}`)
            }
            if (outgoingVerbs.length > limit) {
              console.log(`    ... and ${outgoingVerbs.length - limit} more`)
            }
          }

          console.log('')
        }

        return
      }

      // If root is specified, visualize the graph starting from that root
      if (rootId) {
        const rootNoun = await db.get(rootId)
        if (!rootNoun) {
          console.error(`Root noun with ID ${rootId} not found`)
          return
        }

        console.log(`Visualizing graph from root: ${rootNoun.metadata?.label || rootId}\n`)

        // Use a breadth-first search to visualize the graph
        const visited = new Set<string>()
        const queue: Array<{ id: string; level: number; path: string }> = [
          { id: rootId, level: 0, path: '' }
        ]

        while (queue.length > 0) {
          const { id, level, path } = queue.shift()!

          if (visited.has(id) || level > depth) {
            continue
          }

          visited.add(id)

          const noun = await db.get(id)
          if (!noun) {
            console.warn(`Noun with ID ${id} not found`)
            continue
          }

          const nounType = noun.metadata?.noun || 'Unknown'
          const label = noun.metadata?.label || id.substring(0, 8)

          // Print the current noun with proper indentation
          console.log(`${' '.repeat(level * 2)}${path}[${nounType}] ${label} (${id})`)

          // Get outgoing verbs
          const outgoingVerbs = await db.getVerbsBySource(id)

          // Add target nouns to the queue for the next level
          let verbCount = 0
          for (const verb of outgoingVerbs) {
            if (verbCount >= limit) {
              console.log(`${' '.repeat((level + 1) * 2)}... and ${outgoingVerbs.length - limit} more`)
              break
            }

            const verbType = verb.metadata?.verb || 'relates to'
            queue.push({ 
              id: verb.targetId, 
              level: level + 1, 
              path: `--(${verbType})--→ ` 
            })
            verbCount++
          }
        }
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('generate-random-graph')
  .description('Generate a random graph of data with typed nouns and verbs for testing')
  .option('-n, --noun-count <number>', 'Number of nouns to generate', '10')
  .option('-v, --verb-count <number>', 'Number of verbs to generate', '20')
  .option('-c, --clear', 'Clear existing data before generating', false)
  .option('-t, --noun-types <types>', 'Comma-separated list of noun types to use')
  .option('-r, --verb-types <types>', 'Comma-separated list of verb types to use')
  .action(async (options) => {
    try {
      const db = createDb()
      await db.init()

      // Parse options
      const nounCount = parseInt(options.nounCount, 10)
      const verbCount = parseInt(options.verbCount, 10)
      const clearExisting = options.clear

      // Parse noun types if provided
      let nounTypes: NounType[] | undefined
      if (options.nounTypes) {
        const typeNames = options.nounTypes.split(',').map((t: string) => t.trim())
        nounTypes = typeNames.map((name: string) => {
          // Try to match by key name (case insensitive)
          const key = Object.keys(NounType).find(
            k => k.toLowerCase() === name.toLowerCase()
          )
          if (key) return NounType[key as keyof typeof NounType]

          // If not found by key, check if it's a valid value
          if (Object.values(NounType).includes(name as NounType)) {
            return name as NounType
          }

          console.warn(`Warning: Unknown noun type "${name}", ignoring`)
          return null
        }).filter(Boolean) as NounType[]
      }

      // Parse verb types if provided
      let verbTypes: VerbType[] | undefined
      if (options.verbTypes) {
        const typeNames = options.verbTypes.split(',').map((t: string) => t.trim())
        verbTypes = typeNames.map((name: string) => {
          // Try to match by key name (case insensitive)
          const key = Object.keys(VerbType).find(
            k => k.toLowerCase() === name.toLowerCase()
          )
          if (key) return VerbType[key as keyof typeof VerbType]

          // If not found by key, check if it's a valid value
          if (Object.values(VerbType).includes(name as VerbType)) {
            return name as VerbType
          }

          console.warn(`Warning: Unknown verb type "${name}", ignoring`)
          return null
        }).filter(Boolean) as VerbType[]
      }

      console.log(`Generating random graph with ${nounCount} nouns and ${verbCount} verbs...`)
      if (clearExisting) {
        console.log('Clearing existing data first...')
      }

      const result = await db.generateRandomGraph({
        nounCount,
        verbCount,
        nounTypes,
        verbTypes,
        clearExisting
      })

      console.log('Random graph generated successfully!')
      console.log(`Created ${result.nounIds.length} nouns and ${result.verbIds.length} verbs`)

      // Print some sample IDs
      if (result.nounIds.length > 0) {
        console.log('\nSample noun IDs:')
        result.nounIds.slice(0, 3).forEach(id => console.log(`- ${id}`))
        if (result.nounIds.length > 3) {
          console.log(`... and ${result.nounIds.length - 3} more`)
        }
      }

      if (result.verbIds.length > 0) {
        console.log('\nSample verb IDs:')
        result.verbIds.slice(0, 3).forEach(id => console.log(`- ${id}`))
        if (result.verbIds.length > 3) {
          console.log(`... and ${result.verbIds.length - 3} more`)
        }
      }

      console.log('\nUse the search, get, or visualize commands to explore the generated graph')
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

// Add examples to help text
program.addHelpText('after', `
Examples:
  $ brainy init
  $ brainy add "Cats are independent pets" '{"noun":"Thing","category":"animal"}'
  $ brainy search "feline pets" --limit 5
  $ brainy addVerb id1 id2 RelatedTo '{"description":"Both are pets"}'
  $ brainy clear --force
  $ brainy generate-random-graph --noun-count 20 --verb-count 30 --clear
  $ brainy generate-random-graph --noun-types Person,Thing --verb-types RelatedTo,Owns
  $ brainy visualize --type Thing --limit 10
  $ brainy visualize --root id1 --depth 3
`)

// Setup autocomplete
const completion = omelette('brainy')

// Helper function to get all noun types
const getNounTypes = () => Object.keys(NounType)

// Helper function to get all verb types
const getVerbTypes = () => Object.keys(VerbType)

// Define autocomplete handlers
completion.tree({
  // First level commands - suggest all available commands
  _: () => [
    'add',
    'addVerb',
    'search',
    'get',
    'delete',
    'getVerbs',
    'status',
    'clear',
    'visualize',
    'generate-random-graph',
    'completion-setup',
    'init',
    'help',
    'list-augmentations',
    'augmentation-info',
    'test-pipeline',
    'stream-test'
  ],
  // Command-specific completions
  add: {
    // For the second argument of 'add' command (metadata)
    _: () => {
      // Generate templates for each noun type
      return getNounTypes().map(type =>
        `{"noun":"${type}","category":"example"}`
      )
    }
  },
  addVerb: {
    // First two arguments are IDs, third is verb type
    '<sourceId>': {
      '<targetId>': {
        _: () => {
          // Suggest all available verb types
          return getVerbTypes()
        }
      }
    }
  },
  // Add autocomplete for other commands
  search: {},
  get: {},
  delete: {},
  getVerbs: {},
  status: {},
  clear: {
    _: () => [
      '--force'
    ]
  },
  'generate-random-graph': {
    _: () => [
      '--noun-count 10',
      '--verb-count 20',
      '--clear',
      `--noun-types ${getNounTypes().join(',')}`,
      `--verb-types ${getVerbTypes().join(',')}`
    ]
  },
  'list-augmentations': {},
  'augmentation-info': {
    _: () => [
      'sense',
      'memory',
      'cognition',
      'conduit',
      'activation',
      'perception',
      'dialog',
      'websocket'
    ]
  },
  'test-pipeline': {
    _: () => [
      '--data-type text',
      '--mode sequential',
      '--mode parallel',
      '--mode threaded',
      '--stop-on-error',
      '--verbose'
    ]
  },
  'stream-test': {
    _: () => [
      '--count 5',
      '--interval 1000',
      '--data-type text',
      '--verbose'
    ]
  },
  'completion-setup': {},
  init: {},
  help: {}
})

// Initialize autocomplete
completion.init()

// If this script is run with --completion-setup flag, set up the autocomplete
if (process.argv.includes('--completion-setup')) {
  completion.setupShellInitFile()
  console.log('Autocomplete setup complete. Please restart your shell.')
  process.exit(0)
}

// Pipeline and Augmentation Commands
program
  .command('list-augmentations')
  .description('List all available augmentation types and registered augmentations')
  .action(async () => {
    try {
      // Initialize the pipeline
      await augmentationPipeline.initialize()

      // Get available augmentation types
      const availableTypes = augmentationPipeline.getAvailableAugmentationTypes()

      console.log('Available Augmentation Types:')
      if (availableTypes.length === 0) {
        console.log('  No augmentation types available')
      } else {
        availableTypes.forEach(type => {
          const augmentations = augmentationPipeline.getAugmentationsByType(type)
          console.log(`\n${type.toUpperCase()} (${augmentations.length} registered):`)

          if (augmentations.length === 0) {
            console.log('  No augmentations registered for this type')
          } else {
            augmentations.forEach(aug => {
              console.log(`  - ${aug.name}: ${aug.description}`)
              console.log(`    Status: ${aug.enabled ? 'Enabled' : 'Disabled'}`)
            })
          }
        })
      }

      // Show WebSocket augmentations separately
      const webSocketAugs = augmentationPipeline.getWebSocketAugmentations()
      console.log('\nWebSocket-Enabled Augmentations:')
      if (webSocketAugs.length === 0) {
        console.log('  No WebSocket-enabled augmentations available')
      } else {
        webSocketAugs.forEach(aug => {
          console.log(`  - ${aug.name}: ${aug.description}`)
          console.log(`    Status: ${aug.enabled ? 'Enabled' : 'Disabled'}`)
        })
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('test-pipeline')
  .description('Test the sequential pipeline with sample data')
  .argument('[text]', 'Sample text to process through the pipeline', 'This is a test of the Brainy pipeline')
  .option('-t, --data-type <type>', 'Type of data to process', 'text')
  .option('-m, --mode <mode>', 'Execution mode (sequential, parallel, threaded)', 'sequential')
  .option('-s, --stop-on-error', 'Stop execution if an error occurs', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (text, options) => {
    try {
      // Initialize the pipeline
      await sequentialPipeline.initialize()

      console.log(`Processing data: "${text}"`)
      console.log(`Data type: ${options.dataType}`)
      console.log(`Execution mode: ${options.mode}`)
      console.log(`Stop on error: ${options.stopOnError}`)
      console.log()

      // Set execution mode
      let executionMode = ExecutionMode.SEQUENTIAL
      switch (options.mode.toLowerCase()) {
        case 'parallel':
          executionMode = ExecutionMode.PARALLEL
          break
        case 'threaded':
          executionMode = ExecutionMode.THREADED
          break
        default:
          executionMode = ExecutionMode.SEQUENTIAL
      }

      // Process the data
      const result = await sequentialPipeline.processData(
        text,
        options.dataType,
        {
          stopOnError: options.stopOnError,
          timeout: 30000
        }
      )

      console.log('Pipeline Execution Result:')
      console.log(`Success: ${result.success}`)

      if (result.error) {
        console.log(`Error: ${result.error}`)
      }

      console.log('\nStage Results:')

      // Display stage results
      Object.entries(result.stageResults).forEach(([stage, stageResult]) => {
        console.log(`\n${stage.toUpperCase()}:`)
        console.log(`  Success: ${stageResult?.success}`)

        if (stageResult?.error) {
          console.log(`  Error: ${stageResult.error}`)
        }

        if (stageResult?.data && options.verbose) {
          console.log('  Data:')
          console.log(JSON.stringify(stageResult.data, null, 2)
            .split('\n')
            .map(line => `    ${line}`)
            .join('\n')
          )
        }
      })

      console.log('\nFinal Result Data:')
      console.log(JSON.stringify(result.data, null, 2)
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n')
      )
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('stream-test')
  .description('Test streaming data through the pipeline (simulated)')
  .option('-c, --count <number>', 'Number of data items to stream', '5')
  .option('-i, --interval <ms>', 'Interval between data items in milliseconds', '1000')
  .option('-t, --data-type <type>', 'Type of data to process', 'text')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (options) => {
    try {
      // Initialize the pipeline
      await sequentialPipeline.initialize()

      const count = parseInt(options.count, 10)
      const interval = parseInt(options.interval, 10)

      console.log(`Simulating stream of ${count} data items at ${interval}ms intervals`)
      console.log(`Data type: ${options.dataType}`)
      console.log()

      // Create a handler function similar to what would be used with WebSockets
      const handler = (data: string) => {
        // Process the data asynchronously without blocking
        sequentialPipeline.processData(
          data,
          options.dataType,
          { stopOnError: false }
        ).then(result => {
          console.log(`\nProcessed: "${data}"`)
          console.log(`Success: ${result.success}`)

          if (options.verbose) {
            console.log('Stage Results:')
            Object.entries(result.stageResults).forEach(([stage, stageResult]) => {
              if (stageResult?.success) {
                console.log(`  ${stage}: Success`)
              } else {
                console.log(`  ${stage}: Failed - ${stageResult?.error || 'Unknown error'}`)
              }
            })
          }

          if (result.data) {
            console.log('Result Data:')
            console.log(JSON.stringify(result.data, null, 2)
              .split('\n')
              .map(line => `  ${line}`)
              .join('\n')
            )
          }
        }).catch(error => {
          console.error(`Error processing "${data}":`, error.message)
        })
      }

      // Generate sample data items
      const sampleTexts = [
        "The quick brown fox jumps over the lazy dog",
        "Artificial intelligence is transforming how we interact with data",
        "Vector databases enable semantic search capabilities",
        "Graph relationships connect entities in meaningful ways",
        "Streaming data requires efficient real-time processing",
        "WebSockets provide bidirectional communication channels",
        "Augmentations extend the functionality of the core system",
        "Sequential pipelines process data in defined stages",
        "Parallel execution improves throughput for large datasets",
        "Threaded operations utilize multiple CPU cores efficiently"
      ]

      // Simulate streaming data
      console.log('Starting simulated data stream...')

      for (let i = 0; i < count; i++) {
        // Use modulo to cycle through sample texts if count > samples
        const text = sampleTexts[i % sampleTexts.length]

        // Wait for the specified interval
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, interval))
        }

        console.log(`\nStreaming item ${i + 1}/${count}: "${text}"`)

        // Process the data
        handler(text)
      }

      console.log('\nSimulated stream complete. Some processing may still be ongoing.')
      console.log('In a real WebSocket scenario, the connection would remain open for continuous data.')
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program
  .command('augmentation-info')
  .description('Get detailed information about a specific augmentation type')
  .argument('<type>', 'Augmentation type (sense, memory, cognition, conduit, activation, perception, dialog, websocket)')
  .action(async (typeArg) => {
    try {
      // Initialize the pipeline
      await augmentationPipeline.initialize()

      // Resolve the augmentation type
      let augType: AugmentationType | undefined

      // Convert input to proper enum value
      const normalizedType = typeArg.toLowerCase()
      switch (normalizedType) {
        case 'sense':
          augType = AugmentationType.SENSE
          break
        case 'memory':
          augType = AugmentationType.MEMORY
          break
        case 'cognition':
          augType = AugmentationType.COGNITION
          break
        case 'conduit':
          augType = AugmentationType.CONDUIT
          break
        case 'activation':
          augType = AugmentationType.ACTIVATION
          break
        case 'perception':
          augType = AugmentationType.PERCEPTION
          break
        case 'dialog':
          augType = AugmentationType.DIALOG
          break
        case 'websocket':
          augType = AugmentationType.WEBSOCKET
          break
        default:
          console.error(`Unknown augmentation type: ${typeArg}`)
          console.log('Available types: sense, memory, cognition, conduit, activation, perception, dialog, websocket')
          process.exit(1)
      }

      // Get augmentations of the specified type
      const augmentations = augmentationPipeline.getAugmentationsByType(augType)

      console.log(`\n${augType.toUpperCase()} Augmentation Details:`)

      if (augmentations.length === 0) {
        console.log('  No augmentations registered for this type')
      } else {
        // Display information about each augmentation
        augmentations.forEach((aug, index) => {
          console.log(`\n${index + 1}. ${aug.name}`)
          console.log(`   Description: ${aug.description}`)
          console.log(`   Status: ${aug.enabled ? 'Enabled' : 'Disabled'}`)

          // List available methods
          console.log('   Available Methods:')

          // Get all methods that aren't from Object.prototype
          const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(aug))
            .filter(method => 
              method !== 'constructor' && 
              typeof (aug as any)[method] === 'function' &&
              !['initialize', 'shutDown', 'getStatus'].includes(method)
            )

          if (methods.length === 0) {
            console.log('     No custom methods available')
          } else {
            methods.forEach(method => {
              console.log(`     - ${method}`)
            })
          }
        })
      }

      // Show pipeline order information
      console.log('\nPipeline Execution Order:')
      console.log('  1. SENSE - Process raw data into structured nouns and verbs')
      console.log('  2. MEMORY - Store and retrieve data')
      console.log('  3. COGNITION - Analyze and reason about data')
      console.log('  4. CONDUIT - Exchange data with external systems')
      console.log('  5. ACTIVATION - Trigger actions based on data')
      console.log('  6. PERCEPTION - Interpret and visualize data')
      console.log('  7. DIALOG - Process natural language interactions')
      console.log('  * WEBSOCKET - Enable real-time communication (can be combined with other types)')
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

// Add a command for setting up autocomplete
program
  .command('completion-setup')
  .description('Setup shell autocomplete for the Brainy CLI')
  .action(() => {
    completion.setupShellInitFile()
    console.log('Autocomplete setup complete. Please restart your shell.')
  })

// Parse command line arguments
program.parse()
