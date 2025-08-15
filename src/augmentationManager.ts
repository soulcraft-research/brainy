/**
 * Type-safe augmentation management system for Brainy
 * Provides a clean API for managing augmentations without string literals
 */

import { IAugmentation, AugmentationType } from './types/augmentations.js'
import { augmentationPipeline } from './augmentationPipeline.js'

export interface AugmentationInfo {
  name: string
  type: string
  enabled: boolean
  description: string
}

/**
 * Type-safe augmentation manager
 * Accessed via brain.augmentations for all management operations
 */
export class AugmentationManager {
  private pipeline = augmentationPipeline

  /**
   * List all registered augmentations with their status
   * @returns Array of augmentation information
   */
  list(): AugmentationInfo[] {
    return this.pipeline.listAugmentationsWithStatus()
  }

  /**
   * Get information about a specific augmentation
   * @param name The augmentation name
   * @returns Augmentation info or undefined if not found
   */
  get(name: string): AugmentationInfo | undefined {
    const all = this.list()
    return all.find(a => a.name === name)
  }

  /**
   * Check if an augmentation is enabled
   * @param name The augmentation name
   * @returns True if enabled, false otherwise
   */
  isEnabled(name: string): boolean {
    const aug = this.get(name)
    return aug?.enabled ?? false
  }

  /**
   * Enable a specific augmentation
   * @param name The augmentation name
   * @returns True if successfully enabled
   */
  enable(name: string): boolean {
    return this.pipeline.enableAugmentation(name)
  }

  /**
   * Disable a specific augmentation
   * @param name The augmentation name
   * @returns True if successfully disabled
   */
  disable(name: string): boolean {
    return this.pipeline.disableAugmentation(name)
  }

  /**
   * Remove an augmentation from the pipeline
   * @param name The augmentation name
   * @returns True if successfully removed
   */
  remove(name: string): boolean {
    this.pipeline.unregister(name)
    return true
  }

  /**
   * Enable all augmentations of a specific type
   * @param type The augmentation type
   * @returns Number of augmentations enabled
   */
  enableType(type: AugmentationType): number {
    return this.pipeline.enableAugmentationType(type as any)
  }

  /**
   * Disable all augmentations of a specific type
   * @param type The augmentation type
   * @returns Number of augmentations disabled
   */
  disableType(type: AugmentationType): number {
    return this.pipeline.disableAugmentationType(type as any)
  }

  /**
   * Get all augmentations of a specific type
   * @param type The augmentation type
   * @returns Array of augmentations of that type
   */
  listByType(type: AugmentationType): AugmentationInfo[] {
    return this.list().filter(a => a.type === type)
  }

  /**
   * Get all enabled augmentations
   * @returns Array of enabled augmentations
   */
  listEnabled(): AugmentationInfo[] {
    return this.list().filter(a => a.enabled)
  }

  /**
   * Get all disabled augmentations
   * @returns Array of disabled augmentations
   */
  listDisabled(): AugmentationInfo[] {
    return this.list().filter(a => !a.enabled)
  }

  /**
   * Register a new augmentation (internal use)
   * @param augmentation The augmentation to register
   */
  register(augmentation: IAugmentation): void {
    this.pipeline.register(augmentation)
  }
}

// Export types for external use
export { AugmentationType } from './types/augmentations.js'