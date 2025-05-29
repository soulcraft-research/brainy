/**
 * Basic usage example for the Soulcraft Brainy database
 */

import { BrainyData } from '../brainyData.ts'

// Example data - word embeddings
const wordEmbeddings = {
  cat: [0.2, 0.3, 0.4, 0.1],
  dog: [0.3, 0.2, 0.4, 0.2],
  fish: [0.1, 0.1, 0.8, 0.2],
  bird: [0.1, 0.4, 0.2, 0.5],
  tiger: [0.3, 0.4, 0.3, 0.1],
  lion: [0.4, 0.3, 0.2, 0.1],
  shark: [0.2, 0.1, 0.7, 0.3],
  eagle: [0.2, 0.5, 0.1, 0.4]
}

// Example metadata
const metadata = {
  cat: { type: 'mammal', domesticated: true },
  dog: { type: 'mammal', domesticated: true },
  fish: { type: 'fish', domesticated: false },
  bird: { type: 'bird', domesticated: false },
  tiger: { type: 'mammal', domesticated: false },
  lion: { type: 'mammal', domesticated: false },
  shark: { type: 'fish', domesticated: false },
  eagle: { type: 'bird', domesticated: false }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('Initializing vector database...')

  // Create a new vector database
  const db = new BrainyData()
  await db.init()

  console.log('Adding vectors to the database...')

  // Add vectors to the database
  const ids: Record<string, string> = {}
  const metadata: Record<string, { type: string; domesticated: boolean }> = {
    cat: { type: 'mammal', domesticated: true },
    dog: { type: 'mammal', domesticated: true },
    fish: { type: 'fish', domesticated: false },
    bird: { type: 'bird', domesticated: false },
    tiger: { type: 'mammal', domesticated: false },
    lion: { type: 'mammal', domesticated: false },
    shark: { type: 'fish', domesticated: false },
    eagle: { type: 'bird', domesticated: false }
  }
  for (const [word, vector] of Object.entries(wordEmbeddings)) {
    ids[word] = await db.add(vector, metadata[word])

    console.log(`Added "${word}" with ID: ${ids[word]}`)
  }

  console.log('\nDatabase size:', db.size())

  // Search for similar vectors
  console.log('\nSearching for vectors similar to "cat"...')
  const catResults = await db.search(wordEmbeddings['cat'], 3)
  console.log('Results:')
  for (const result of catResults) {
    const word =
      Object.entries(ids).find(([_, id]) => id === result.id)?.[0] || 'unknown'
    console.log(
      `- ${word} (score: ${result.score.toFixed(4)}, metadata:`,
      result.metadata,
      ')'
    )
  }

  // Search for similar vectors
  console.log('\nSearching for vectors similar to "fish"...')
  const fishResults = await db.search(wordEmbeddings['fish'], 3)
  console.log('Results:')
  for (const result of fishResults) {
    const word =
      Object.entries(ids).find(([_, id]) => id === result.id)?.[0] || 'unknown'
    console.log(
      `- ${word} (score: ${result.score.toFixed(4)}, metadata:`,
      result.metadata,
      ')'
    )
  }

  // Update metadata
  console.log('\nUpdating metadata for "bird"...')
  await db.updateMetadata(ids['bird'], {
    ...metadata['bird'],
    notes: 'Can fly'
  })

  // Get the updated document
  const birdDoc = await db.get(ids['bird'])
  console.log('Updated bird document:', birdDoc)

  // Delete a vector
  console.log('\nDeleting "shark"...')
  await db.delete(ids['shark'])
  console.log('Database size after deletion:', db.size())

  // Search again to verify shark is gone
  console.log('\nSearching for vectors similar to "fish" after deletion...')
  const fishResultsAfterDeletion = await db.search(wordEmbeddings['fish'], 3)
  console.log('Results:')
  for (const result of fishResultsAfterDeletion) {
    const word =
      Object.entries(ids).find(([_, id]) => id === result.id)?.[0] || 'unknown'
    console.log(
      `- ${word} (score: ${result.score.toFixed(4)}, metadata:`,
      result.metadata,
      ')'
    )
  }

  console.log('\nExample completed successfully!')
}

// Check if we're in a browser or Node.js environment
if (typeof window !== 'undefined') {
  // Browser environment
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button')
    button.textContent = 'Run BrainyData Example'
    button.addEventListener('click', async () => {
      const output = document.createElement('pre')
      document.body.appendChild(output)

      // Redirect console.log to the output element
      const originalLog = console.log
      console.log = (...args) => {
        originalLog(...args)
        output.textContent +=
          args
            .map((arg) =>
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
            )
            .join(' ') + '\n'
      }

      try {
        await runExample()
      } catch (error) {
        console.error('Error running example:', error)
      }

      // Restore console.log
      console.log = originalLog
    })

    document.body.appendChild(button)
  })
} else {
  // Node.js environment
  runExample().catch((error) => {
    console.error('Error running example:', error)
  })
}
