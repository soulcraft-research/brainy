/**
 * Example webpack configuration for using the Brainy augmentation registry
 * 
 * This example shows how to configure webpack to automatically discover and register
 * augmentations at build time.
 */

const path = require('path');
const { createAugmentationRegistryPlugin } = require('../dist/index.js');

module.exports = {
  // Entry point for the application
  entry: './src/index.js',
  
  // Output configuration
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  
  // Module rules for processing different file types
  module: {
    rules: [
      // Process JavaScript files with babel
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      
      // Process TypeScript files
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },
  
  // Resolve file extensions
  resolve: {
    extensions: ['.js', '.ts']
  },
  
  // Plugins
  plugins: [
    // Augmentation Registry Plugin
    // This plugin will automatically discover and register augmentations
    // from files that match the specified pattern
    createAugmentationRegistryPlugin({
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
  
  // Development server configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
  }
};
