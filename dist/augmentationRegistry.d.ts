/**
 * Augmentation Registry
 *
 * This module provides a registry for augmentations that are loaded at build time.
 * It replaces the dynamic loading mechanism in pluginLoader.ts.
 */
import { IPipeline } from './types/pipelineTypes.js';
import { AugmentationType, IAugmentation } from './types/augmentations.js';
/**
 * Sets the default pipeline instance
 * This function should be called from pipeline.ts after the pipeline is created
 */
export declare function setDefaultPipeline(pipeline: IPipeline): void;
/**
 * Registry of all available augmentations
 */
export declare const availableAugmentations: IAugmentation[];
/**
 * Registers an augmentation with the registry
 *
 * @param augmentation The augmentation to register
 * @returns The augmentation that was registered
 */
export declare function registerAugmentation<T extends IAugmentation>(augmentation: T): T;
/**
 * Initializes the augmentation pipeline with all registered augmentations
 *
 * @param pipeline Optional custom pipeline to use instead of the default
 * @returns The pipeline that was initialized
 * @throws Error if no pipeline is provided and the default pipeline hasn't been set
 */
export declare function initializeAugmentationPipeline(pipelineInstance?: IPipeline): IPipeline;
/**
 * Enables or disables an augmentation by name
 *
 * @param name The name of the augmentation to enable/disable
 * @param enabled Whether to enable or disable the augmentation
 * @returns True if the augmentation was found and updated, false otherwise
 */
export declare function setAugmentationEnabled(name: string, enabled: boolean): boolean;
/**
 * Gets all augmentations of a specific type
 *
 * @param type The type of augmentation to get
 * @returns An array of all augmentations of the specified type
 */
export declare function getAugmentationsByType(type: AugmentationType): IAugmentation[];
//# sourceMappingURL=augmentationRegistry.d.ts.map