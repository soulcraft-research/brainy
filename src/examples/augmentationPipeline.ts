/**
 * Augmentation Pipeline Example
 * 
 * This example demonstrates how to use the augmentation pipeline to register
 * and execute multiple augmentations of each type.
 */

import {
  augmentationPipeline,
  ExecutionMode,
  PipelineOptions,
  IAugmentation,
  AugmentationResponse,
  BrainyAugmentations
} from '../index.js'

/**
 * Example Cognition Augmentation
 */
class SimpleCognitionAugmentation implements BrainyAugmentations.ICognitionAugmentation {
  readonly name = 'simple-cognition'
  readonly description = 'A simple cognition augmentation for demonstration'

  async initialize(): Promise<void> {
    console.log('Initializing SimpleCognitionAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down SimpleCognitionAugmentation')
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async reason(
    query: string,
    context?: Record<string, unknown>
  ): Promise<AugmentationResponse<{ inference: string; confidence: number }>> {
    console.log(`SimpleCognitionAugmentation reasoning about: ${query}`)
    console.log('Context:', context)

    return {
      success: true,
      data: {
        inference: `Simple inference about: ${query}`,
        confidence: 0.7
      }
    }
  }

  async infer(
    dataSubset: Record<string, unknown>
  ): Promise<AugmentationResponse<Record<string, unknown>>> {
    return {
      success: true,
      data: {
        result: `Inferred from data: ${JSON.stringify(dataSubset)}`
      }
    }
  }

  async executeLogic(
    ruleId: string,
    input: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    return {
      success: true,
      data: true
    }
  }
}

/**
 * Another Example Cognition Augmentation
 */
class AdvancedCognitionAugmentation implements BrainyAugmentations.ICognitionAugmentation {
  readonly name = 'advanced-cognition'
  readonly description = 'A more advanced cognition augmentation for demonstration'

  async initialize(): Promise<void> {
    console.log('Initializing AdvancedCognitionAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down AdvancedCognitionAugmentation')
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async reason(
    query: string,
    context?: Record<string, unknown>
  ): Promise<AugmentationResponse<{ inference: string; confidence: number }>> {
    console.log(`AdvancedCognitionAugmentation reasoning about: ${query}`)
    console.log('Context:', context)

    return {
      success: true,
      data: {
        inference: `Advanced inference about: ${query} with detailed analysis`,
        confidence: 0.9
      }
    }
  }

  async infer(
    dataSubset: Record<string, unknown>
  ): Promise<AugmentationResponse<Record<string, unknown>>> {
    return {
      success: true,
      data: {
        result: `Advanced inference from data: ${JSON.stringify(dataSubset)}`,
        additionalInsights: ['insight1', 'insight2']
      }
    }
  }

  async executeLogic(
    ruleId: string,
    input: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    return {
      success: true,
      data: true
    }
  }
}

/**
 * Example Sense Augmentation
 */
class SimpleSenseAugmentation implements BrainyAugmentations.ISenseAugmentation {
  readonly name = 'simple-sense'
  readonly description = 'A simple sense augmentation for demonstration'

  async initialize(): Promise<void> {
    console.log('Initializing SimpleSenseAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down SimpleSenseAugmentation')
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async processRawData(
    rawData: Buffer | string,
    dataType: string
  ): Promise<AugmentationResponse<{ nouns: string[]; verbs: string[] }>> {
    console.log(`SimpleSenseAugmentation processing ${dataType} data:`, 
      typeof rawData === 'string' ? rawData : 'Buffer data')

    return {
      success: true,
      data: {
        nouns: ['example', 'data', 'processing'],
        verbs: ['process', 'analyze', 'extract']
      }
    }
  }

  async listenToFeed(
    feedUrl: string,
    callback: (data: { nouns: string[]; verbs: string[] }) => void
  ): Promise<void> {
    console.log(`SimpleSenseAugmentation listening to feed: ${feedUrl}`)
    // In a real implementation, this would set up a listener
  }
}

/**
 * Main function to demonstrate the augmentation pipeline
 */
async function main() {
  try {
    console.log('=== Augmentation Pipeline Example ===')

    // Create augmentation instances
    const simpleCognition = new SimpleCognitionAugmentation()
    const advancedCognition = new AdvancedCognitionAugmentation()
    const simpleSense = new SimpleSenseAugmentation()

    // Register augmentations with the pipeline
    augmentationPipeline
      .register(simpleCognition)
      .register(advancedCognition)
      .register(simpleSense)

    // Initialize all registered augmentations
    console.log('\n=== Initializing Augmentations ===')
    await augmentationPipeline.initialize()

    // Execute a cognition pipeline in sequential mode (default)
    console.log('\n=== Executing Cognition Pipeline (Sequential) ===')
    const reasoningResults = await augmentationPipeline.executeCognitionPipeline(
      'reason',
      ['What is the capital of France?', { additionalContext: 'geography' }]
    )

    console.log('\nReasoning Results:')
    reasoningResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Inference: ${result.data.inference}`)
        console.log(`  Confidence: ${result.data.confidence}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Execute a cognition pipeline in parallel mode
    console.log('\n=== Executing Cognition Pipeline (Parallel) ===')
    const inferResults = await augmentationPipeline.executeCognitionPipeline(
      'infer',
      [{ topic: 'climate change', data: [1, 2, 3] }],
      { mode: ExecutionMode.PARALLEL }
    )

    console.log('\nInference Results:')
    inferResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Data: ${JSON.stringify(result.data)}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Execute a sense pipeline
    console.log('\n=== Executing Sense Pipeline ===')
    const processingResults = await augmentationPipeline.executeSensePipeline(
      'processRawData',
      ['This is some example text to process', 'text']
    )

    console.log('\nProcessing Results:')
    processingResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Nouns: ${result.data.nouns.join(', ')}`)
        console.log(`  Verbs: ${result.data.verbs.join(', ')}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Shut down all registered augmentations
    console.log('\n=== Shutting Down Augmentations ===')
    await augmentationPipeline.shutDown()

    console.log('\n=== Example Complete ===')
  } catch (error) {
    console.error('Error in augmentation pipeline example:', error)
  }
}

// Run the example
main()
