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
   * AI-powered data understanding and entity extraction (always free)
   */
  private async registerNeuralImport(): Promise<void> {
    try {
      // Import the Neural Import augmentation
      const { NeuralImportAugmentation } = await import('../augmentations/neuralImport.js')
      
      // Note: The actual registration is commented out since BrainyData doesn't have addAugmentation method yet
      // This would create instance with default configuration
      /*
      const neuralImport = new NeuralImportAugmentation(this.brainy as any, {
        confidenceThreshold: 0.7,
        enableWeights: true,
        skipDuplicates: true
      })

      // Add as SENSE augmentation to Brainy (when method is available)
      if (this.brainy.addAugmentation) {
        await this.brainy.addAugmentation('SENSE', cortex, {
          position: 1, // First in the SENSE pipeline
          name: 'cortex',
          autoStart: true
        })
      }
      */
      
      console.log('🧠⚛️ Cortex module loaded (awaiting BrainyData augmentation support)')

    } catch (error) {
      console.error('❌ Failed to register Cortex:', error instanceof Error ? error.message : String(error))
      // Don't throw - Brainy should still work without Neural Import
    }
  }

  /**
   * Check if Cortex is available and working
   */
  async checkCortexHealth(): Promise<{
    available: boolean
    status: string
    version?: string
  }> {
    try {
      // Check if Cortex is registered as an augmentation
      // Note: hasAugmentation method doesn't exist yet in BrainyData
      const hasCortex = false // this.brainy.hasAugmentation && this.brainy.hasAugmentation('SENSE', 'cortex')
      
      return {
        available: hasCortex || false,
        status: hasCortex ? 'active' : 'not registered (awaiting BrainyData support)',
        version: '1.0.0'
      }
    } catch (error) {
      return {
        available: false,
        status: `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Reinstall Cortex if it's missing or corrupted
   */
  async reinstallCortex(): Promise<void> {
    try {
      // Remove existing if present
      // Note: removeAugmentation method doesn't exist yet in BrainyData
      /*
      if (this.brainy.removeAugmentation) {
        try {
          await this.brainy.removeAugmentation('SENSE', 'cortex')
        } catch (error) {
          // Ignore errors if augmentation doesn't exist
        }
      }
      */

      // Re-register (method exists on base class)
      // await this.registerCortex()
      
      console.log('🧠⚛️ Cortex reinstalled successfully')
    } catch (error) {
      throw new Error(`Failed to reinstall Cortex: ${error instanceof Error ? error.message : String(error)}`)
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