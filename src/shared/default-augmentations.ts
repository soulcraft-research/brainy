/**
 * Default Augmentation Registry
 * 
 * 🧠⚛️ Pre-installed augmentations that come with every Brainy installation
 * These are the core "sensory organs" of the atomic age brain-in-jar system
 */

import { BrainyDataInterface } from '../types/brainyDataInterface.js'

/**
 * Default augmentations that ship with Brainy
 * These are automatically registered on startup
 */
export class DefaultAugmentationRegistry {
  private brainy: BrainyDataInterface

  constructor(brainy: BrainyDataInterface) {
    this.brainy = brainy
  }

  /**
   * Initialize all default augmentations
   * Called during Brainy startup to register core functionality
   */
  async initializeDefaults(): Promise<void> {
    console.log('🧠⚛️ Initializing default augmentations...')

    // Register Neural Import as default SENSE augmentation
    await this.registerNeuralImport()

    console.log('🧠⚛️ Default augmentations initialized')
  }

  /**
   * Neural Import - Default SENSE Augmentation
   * AI-powered data understanding and entity extraction
   */
  private async registerNeuralImport(): Promise<void> {
    try {
      // Import the Neural Import augmentation
      const { NeuralImportSenseAugmentation } = await import('../augmentations/neuralImportSense.js')
      
      // Create instance with default configuration
      const neuralImport = new NeuralImportSenseAugmentation({
        enableEntityDetection: true,
        enableRelationshipMapping: true,
        enableInsightGeneration: true,
        enableConfidenceScoring: true,
        confidenceThreshold: 0.7,
        maxEntitiesPerData: 50,
        maxRelationshipsPerEntity: 10,
        enableBatchProcessing: true,
        batchSize: 100,
        enableCache: true,
        cacheMaxSize: 1000,
        apiEndpoint: 'local', // Use local processing by default
        modelType: 'local',
        enableDebugLogging: false
      })

      // Add as SENSE augmentation to Brainy
      await this.brainy.addAugmentation('SENSE', neuralImport, {
        position: 1, // First in the SENSE pipeline
        name: 'neural-import',
        autoStart: true
      })
      
      console.log('🧠⚛️ Neural Import registered as default SENSE augmentation')

    } catch (error) {
      console.error('❌ Failed to register Neural Import:', error.message)
      // Don't throw - Brainy should still work without Neural Import
    }
  }

  /**
   * Check if Neural Import is available and working
   */
  async checkNeuralImportHealth(): Promise<{
    available: boolean
    status: string
    version?: string
  }> {
    try {
      // Check if Neural Import is registered as an augmentation
      const hasNeuralImport = this.brainy.hasAugmentation && this.brainy.hasAugmentation('SENSE', 'neural-import')
      
      return {
        available: hasNeuralImport || false,
        status: hasNeuralImport ? 'active' : 'not registered',
        version: '1.0.0'
      }
    } catch (error) {
      return {
        available: false,
        status: `Error: ${error.message}`
      }
    }
  }

  /**
   * Reinstall Neural Import if it's missing or corrupted
   */
  async reinstallNeuralImport(): Promise<void> {
    try {
      // Remove existing if present
      if (this.brainy.removeAugmentation) {
        try {
          await this.brainy.removeAugmentation('SENSE', 'neural-import')
        } catch (error) {
          // Ignore errors if augmentation doesn't exist
        }
      }

      // Re-register
      await this.registerNeuralImport()
      
      console.log('🧠⚛️ Neural Import reinstalled successfully')
    } catch (error) {
      throw new Error(`Failed to reinstall Neural Import: ${error.message}`)
    }
  }
}

/**
 * Helper function to initialize default augmentations for any Brainy instance
 */
export async function initializeDefaultAugmentations(brainy: BrainyDataInterface): Promise<DefaultAugmentationRegistry> {
  const registry = new DefaultAugmentationRegistry(brainy)
  await registry.initializeDefaults()
  return registry
}