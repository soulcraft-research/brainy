/**
 * Augmentation Registry Loader
 *
 * This module provides functionality for loading augmentation registrations
 * at build time. It's designed to be used with build tools like webpack or rollup
 * to automatically discover and register augmentations.
 */
import { IAugmentation } from './types/augmentations.js';
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
export declare function loadAugmentationsFromModules(modules: Record<string, any>, options?: AugmentationRegistryLoaderOptions): Promise<AugmentationLoadResult>;
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
export declare function createAugmentationRegistryPlugin(options: {
    /**
     * Pattern to match files containing augmentations
     */
    pattern: RegExp;
    /**
     * Options for the loader
     */
    options?: AugmentationRegistryLoaderOptions;
}): {
    name: string;
    pattern: RegExp;
    options: AugmentationRegistryLoaderOptions;
};
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
export declare function createAugmentationRegistryRollupPlugin(options: {
    /**
     * Pattern to match files containing augmentations
     */
    pattern: RegExp;
    /**
     * Options for the loader
     */
    options?: AugmentationRegistryLoaderOptions;
}): {
    name: string;
    pattern: RegExp;
    options: AugmentationRegistryLoaderOptions;
};
//# sourceMappingURL=augmentationRegistryLoader.d.ts.map