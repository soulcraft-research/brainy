/**
 * Plugin Loader for Brainy Augmentations
 * 
 * This module provides functionality for loading and configuring augmentation plugins
 * from external npm packages. It allows consumers of the library to easily integrate
 * externally installed augmentation plugins into the Brainy system.
 */

import { AugmentationPipeline, augmentationPipeline, ExecutionMode } from './augmentationPipeline.js';
import { AugmentationType, IAugmentation, ISenseAugmentation, IConduitAugmentation } from './types/augmentations.js';

/**
 * Configuration options for loading plugins
 */
export interface PluginLoaderOptions {
  /**
   * Whether to use the default augmentation pipeline instance
   * If false, a new pipeline instance will be created
   * @default true
   */
  useDefaultPipeline?: boolean;

  /**
   * Whether to initialize the augmentations after loading
   * @default true
   */
  initializeAfterLoading?: boolean;

  /**
   * Order of augmentation types to load
   * By default, sense augmentations are loaded first
   * @default [AugmentationType.SENSE, AugmentationType.CONDUIT, ...]
   */
  augmentationOrder?: AugmentationType[];
}

/**
 * Default options for the plugin loader
 */
const DEFAULT_OPTIONS: PluginLoaderOptions = {
  useDefaultPipeline: true,
  initializeAfterLoading: true,
  augmentationOrder: [
    AugmentationType.SENSE,
    AugmentationType.CONDUIT,
    AugmentationType.COGNITION,
    AugmentationType.MEMORY,
    AugmentationType.PERCEPTION,
    AugmentationType.DIALOG,
    AugmentationType.ACTIVATION,
    AugmentationType.WEBSOCKET
  ]
};

/**
 * Plugin configuration for a specific augmentation
 */
export interface PluginConfig {
  /**
   * The plugin module name or path
   * This can be an npm package name or a relative path
   */
  plugin: string;

  /**
   * Optional configuration to pass to the plugin
   */
  config?: Record<string, any>;

  /**
   * Optional type of the augmentation
   * If not provided, it will be determined automatically
   */
  type?: AugmentationType;
}

/**
 * Result of loading plugins
 */
export interface PluginLoadResult {
  /**
   * The augmentation pipeline instance
   */
  pipeline: AugmentationPipeline;

  /**
   * Map of loaded augmentations by type
   */
  augmentations: Map<AugmentationType, IAugmentation[]>;

  /**
   * Any errors that occurred during loading
   */
  errors: Error[];
}

/**
 * Loads augmentation plugins from external npm packages
 * 
 * @param plugins Array of plugin configurations
 * @param options Options for loading plugins
 * @returns Promise that resolves to the plugin load result
 */
export async function loadPlugins(
  plugins: PluginConfig[],
  options: PluginLoaderOptions = {}
): Promise<PluginLoadResult> {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Use the default pipeline or create a new one
  const pipeline = opts.useDefaultPipeline ? augmentationPipeline : new AugmentationPipeline();
  
  // Track loaded augmentations by type
  const loadedAugmentations = new Map<AugmentationType, IAugmentation[]>();
  const errors: Error[] = [];

  // Group plugins by type according to the specified order
  const pluginsByType = new Map<AugmentationType, PluginConfig[]>();
  
  // Initialize the map with empty arrays for each type
  for (const type of opts.augmentationOrder!) {
    pluginsByType.set(type, []);
    loadedAugmentations.set(type, []);
  }
  
  // Group plugins by type
  for (const pluginConfig of plugins) {
    const type = pluginConfig.type || AugmentationType.SENSE; // Default to SENSE if not specified
    const typePlugins = pluginsByType.get(type) || [];
    typePlugins.push(pluginConfig);
    pluginsByType.set(type, typePlugins);
  }
  
  // Load plugins in the specified order
  for (const type of opts.augmentationOrder!) {
    const typePlugins = pluginsByType.get(type) || [];
    
    for (const pluginConfig of typePlugins) {
      try {
        // Import the plugin module
        const pluginModule = await import(pluginConfig.plugin);
        
        // Get the default export or the named export that matches the plugin name
        const PluginClass = pluginModule.default || pluginModule[pluginConfig.plugin.split('/').pop()!];
        
        if (!PluginClass) {
          throw new Error(`Could not find a valid export in plugin ${pluginConfig.plugin}`);
        }
        
        // Instantiate the plugin with the provided configuration
        const plugin = new PluginClass(pluginConfig.config);
        
        // Register the plugin with the pipeline
        pipeline.register(plugin);
        
        // Add to the loaded augmentations map
        const typeAugmentations = loadedAugmentations.get(type) || [];
        typeAugmentations.push(plugin);
        loadedAugmentations.set(type, typeAugmentations);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        console.error(`Error loading plugin ${pluginConfig.plugin}:`, err);
      }
    }
  }
  
  // Initialize the augmentations if requested
  if (opts.initializeAfterLoading) {
    try {
      await pipeline.initialize();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      console.error('Error initializing augmentations:', err);
    }
  }
  
  return {
    pipeline,
    augmentations: loadedAugmentations,
    errors
  };
}

/**
 * Configures and starts the augmentation pipeline with the specified plugins
 * 
 * @param plugins Array of plugin configurations
 * @param options Options for loading plugins
 * @returns Promise that resolves to the plugin load result
 */
export async function configureAndStartPipeline(
  plugins: PluginConfig[],
  options: PluginLoaderOptions = {}
): Promise<PluginLoadResult> {
  // Load the plugins
  const result = await loadPlugins(plugins, {
    ...options,
    initializeAfterLoading: true
  });
  
  return result;
}

/**
 * Creates a plugin configuration for a sense augmentation
 * 
 * @param plugin The plugin module name or path
 * @param config Optional configuration to pass to the plugin
 * @returns Plugin configuration
 */
export function createSensePluginConfig(
  plugin: string,
  config?: Record<string, any>
): PluginConfig {
  return {
    plugin,
    config,
    type: AugmentationType.SENSE
  };
}

/**
 * Creates a plugin configuration for a conduit augmentation
 * 
 * @param plugin The plugin module name or path
 * @param config Optional configuration to pass to the plugin
 * @returns Plugin configuration
 */
export function createConduitPluginConfig(
  plugin: string,
  config?: Record<string, any>
): PluginConfig {
  return {
    plugin,
    config,
    type: AugmentationType.CONDUIT
  };
}
