/**
 * Augmentation Registry
 *
 * This module provides a registry for augmentations that are loaded at build time.
 * It replaces the dynamic loading mechanism in pluginLoader.ts.
 */

import { AugmentationPipeline, augmentationPipeline } from './augmentationPipeline.js'
import { AugmentationType, IAugmentation } from './types/augmentations.js'

/**
 * Registry of all available augmentations
 */
export const availableAugmentations: IAugmentation[] = []

/**
 * Registers an augmentation with the registry
 *
 * @param augmentation The augmentation to register
 * @returns The augmentation that was registered
 */
export function registerAugmentation<T extends IAugmentation>(augmentation: T): T {
  // Set enabled to true by default if not specified
  if (augmentation.enabled === undefined) {
    augmentation.enabled = true
  }

  // Add to the registry
  availableAugmentations.push(augmentation)

  return augmentation
}

/**
 * Initializes the augmentation pipeline with all registered augmentations
 *
 * @param pipeline Optional custom pipeline to use instead of the default
 * @returns The pipeline that was initialized
 */
export function initializeAugmentationPipeline(
  pipeline: AugmentationPipeline = augmentationPipeline
): AugmentationPipeline {
  // Register all augmentations with the pipeline
  for (const augmentation of availableAugmentations) {
    if (augmentation.enabled) {
      pipeline.register(augmentation)
    }
  }

  return pipeline
}

/**
 * Enables or disables an augmentation by name
 *
 * @param name The name of the augmentation to enable/disable
 * @param enabled Whether to enable or disable the augmentation
 * @returns True if the augmentation was found and updated, false otherwise
 */
export function setAugmentationEnabled(name: string, enabled: boolean): boolean {
  const augmentation = availableAugmentations.find(aug => aug.name === name)

  if (augmentation) {
    augmentation.enabled = enabled
    return true
  }

  return false
}

/**
 * Gets all augmentations of a specific type
 *
 * @param type The type of augmentation to get
 * @returns An array of all augmentations of the specified type
 */
export function getAugmentationsByType(type: AugmentationType): IAugmentation[] {
  return availableAugmentations.filter(aug => {
    // Check if the augmentation is of the specified type
    // This is a simplified check and may need to be updated based on how types are determined
    switch (type) {
      case AugmentationType.SENSE:
        return 'processRawData' in aug && 'listenToFeed' in aug
      case AugmentationType.CONDUIT:
        return 'establishConnection' in aug && 'readData' in aug && 'writeData' in aug
      case AugmentationType.COGNITION:
        return 'reason' in aug && 'infer' in aug && 'executeLogic' in aug
      case AugmentationType.MEMORY:
        return 'storeData' in aug && 'retrieveData' in aug && 'updateData' in aug
      case AugmentationType.PERCEPTION:
        return 'interpret' in aug && 'organize' in aug && 'generateVisualization' in aug
      case AugmentationType.DIALOG:
        return 'processUserInput' in aug && 'generateResponse' in aug && 'manageContext' in aug
      case AugmentationType.ACTIVATION:
        return 'triggerAction' in aug && 'generateOutput' in aug && 'interactExternal' in aug
      case AugmentationType.WEBSOCKET:
        return 'connectWebSocket' in aug && 'sendWebSocketMessage' in aug && 'onWebSocketMessage' in aug
      default:
        return false
    }
  })
}
