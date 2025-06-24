/**
 * Augmentation Registry Loader
 *
 * This module provides functionality for loading augmentation registrations
 * at build time. It's designed to be used with build tools like webpack or rollup
 * to automatically discover and register augmentations.
 */

import { IAugmentation } from './types/augmentations.js'
import { registerAugmentation } from './augmentationRegistry.js'

/**
 * Options for the augmentation registry loader
 */
export interface AugmentationRegistryLoaderOptions {
  /**
   * Whether to automatically initialize the augmentations after loading
   * @default false
   */
  autoInitialize?: boolean;

  /**
   * Whether to log debug information during loading
   * @default false
   */
  debug?: boolean;
}

/**
 * Default options for the augmentation registry loader
 */
const DEFAULT_OPTIONS: AugmentationRegistryLoaderOptions = {
  autoInitialize: false,
  debug: false
}

/**
 * Result of loading augmentations
 */
export interface AugmentationLoadResult {
  /**
   * The augmentations that were loaded
   */
  augmentations: IAugmentation[];

  /**
   * Any errors that occurred during loading
   */
  errors: Error[];
}

/**
 * Loads augmentations from the specified modules
 *
 * This function is designed to be used with build tools like webpack or rollup
 * to automatically discover and register augmentations.
 *
 * @param modules An object containing modules with augmentations to register
 * @param options Options for the loader
 * @returns A promise that resolves with the result of loading the augmentations
 *
 * @example
 * ```typescript
 * // webpack.config.js
 * const { AugmentationRegistryPlugin } = require('brainy/dist/webpack');
 *
 * module.exports = {
 *   // ... other webpack config
 *   plugins: [
 *     new AugmentationRegistryPlugin({
 *       // Pattern to match files containing augmentations
 *       pattern: /augmentation\.js$/,
 *       // Options for the loader
 *       options: {
 *         autoInitialize: true,
 *         debug: true
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export async function loadAugmentationsFromModules(
  modules: Record<string, any>,
  options: AugmentationRegistryLoaderOptions = {}
): Promise<AugmentationLoadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const result: AugmentationLoadResult = {
    augmentations: [],
    errors: []
  }

  if (opts.debug) {
    console.log(`[AugmentationRegistryLoader] Loading augmentations from ${Object.keys(modules).length} modules`)
  }

  // Process each module
  for (const [modulePath, module] of Object.entries(modules)) {
    try {
      if (opts.debug) {
        console.log(`[AugmentationRegistryLoader] Processing module: ${modulePath}`)
      }

      // Extract augmentations from the module
      const augmentations = extractAugmentationsFromModule(module)

      if (augmentations.length === 0) {
        if (opts.debug) {
          console.log(`[AugmentationRegistryLoader] No augmentations found in module: ${modulePath}`)
        }
        continue
      }

      // Register each augmentation
      for (const augmentation of augmentations) {
        try {
          const registered = registerAugmentation(augmentation)
          result.augmentations.push(registered)

          if (opts.debug) {
            console.log(`[AugmentationRegistryLoader] Registered augmentation: ${registered.name}`)
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          result.errors.push(err)

          if (opts.debug) {
            console.error(`[AugmentationRegistryLoader] Failed to register augmentation: ${err.message}`)
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      result.errors.push(err)

      if (opts.debug) {
        console.error(`[AugmentationRegistryLoader] Error processing module ${modulePath}: ${err.message}`)
      }
    }
  }

  if (opts.debug) {
    console.log(`[AugmentationRegistryLoader] Loaded ${result.augmentations.length} augmentations with ${result.errors.length} errors`)
  }

  return result
}

/**
 * Extracts augmentations from a module
 *
 * @param module The module to extract augmentations from
 * @returns An array of augmentations found in the module
 */
function extractAugmentationsFromModule(module: any): IAugmentation[] {
  const augmentations: IAugmentation[] = []

  // If the module itself is an augmentation, add it
  if (isAugmentation(module)) {
    augmentations.push(module)
  }

  // Check for exported augmentations
  if (module && typeof module === 'object') {
    for (const key of Object.keys(module)) {
      const exported = module[key]

      // Skip non-objects and null
      if (!exported || typeof exported !== 'object') {
        continue
      }

      // If the exported value is an augmentation, add it
      if (isAugmentation(exported)) {
        augmentations.push(exported)
      }

      // If the exported value is an array of augmentations, add them
      if (Array.isArray(exported) && exported.every(isAugmentation)) {
        augmentations.push(...exported)
      }
    }
  }

  return augmentations
}

/**
 * Checks if an object is an augmentation
 *
 * @param obj The object to check
 * @returns True if the object is an augmentation
 */
function isAugmentation(obj: any): obj is IAugmentation {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.initialize === 'function' &&
    typeof obj.shutDown === 'function' &&
    typeof obj.getStatus === 'function'
  )
}

/**
 * Creates a webpack plugin for automatically loading augmentations
 *
 * @param options Options for the plugin
 * @returns A webpack plugin
 *
 * @example
 * ```typescript
 * // webpack.config.js
 * const { createAugmentationRegistryPlugin } = require('brainy/dist/webpack');
 *
 * module.exports = {
 *   // ... other webpack config
 *   plugins: [
 *     createAugmentationRegistryPlugin({
 *       pattern: /augmentation\.js$/,
 *       options: {
 *         autoInitialize: true,
 *         debug: true
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export function createAugmentationRegistryPlugin(options: {
  /**
   * Pattern to match files containing augmentations
   */
  pattern: RegExp;

  /**
   * Options for the loader
   */
  options?: AugmentationRegistryLoaderOptions;
}) {
  // This is just a placeholder - the actual implementation would depend on the build tool
  return {
    name: 'AugmentationRegistryPlugin',
    pattern: options.pattern,
    options: options.options || {}
  }
}

/**
 * Creates a rollup plugin for automatically loading augmentations
 *
 * @param options Options for the plugin
 * @returns A rollup plugin
 *
 * @example
 * ```typescript
 * // rollup.config.js
 * import { createAugmentationRegistryRollupPlugin } from 'brainy/dist/rollup';
 *
 * export default {
 *   // ... other rollup config
 *   plugins: [
 *     createAugmentationRegistryRollupPlugin({
 *       pattern: /augmentation\.js$/,
 *       options: {
 *         autoInitialize: true,
 *         debug: true
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export function createAugmentationRegistryRollupPlugin(options: {
  /**
   * Pattern to match files containing augmentations
   */
  pattern: RegExp;

  /**
   * Options for the loader
   */
  options?: AugmentationRegistryLoaderOptions;
}) {
  // This is just a placeholder - the actual implementation would depend on the build tool
  return {
    name: 'augmentation-registry-rollup-plugin',
    pattern: options.pattern,
    options: options.options || {}
  }
}
