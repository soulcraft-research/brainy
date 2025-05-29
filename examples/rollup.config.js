/**
 * Example rollup configuration for using the Brainy augmentation registry
 * 
 * This example shows how to configure rollup to automatically discover and register
 * augmentations at build time.
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { createAugmentationRegistryRollupPlugin } from '../dist/index.js';

export default {
  // Entry point for the application
  input: 'src/index.js',
  
  // Output configuration
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true
  },
  
  // Plugins
  plugins: [
    // Resolve node modules
    resolve(),
    
    // Convert CommonJS modules to ES6
    commonjs(),
    
    // Process TypeScript files
    typescript(),
    
    // Augmentation Registry Plugin
    // This plugin will automatically discover and register augmentations
    // from files that match the specified pattern
    createAugmentationRegistryRollupPlugin({
      // Pattern to match files containing augmentations
      // This will match any file ending with 'augmentation.js' or 'augmentation.ts'
      pattern: /augmentation\.(js|ts)$/,
      
      // Options for the loader
      options: {
        // Automatically initialize augmentations after loading
        autoInitialize: true,
        
        // Log debug information during loading
        debug: true
      }
    })
  ],
  
  // External dependencies that should not be bundled
  external: [
    'brainy'
  ]
};
