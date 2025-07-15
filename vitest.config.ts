import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Default configuration
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60000, // 60 seconds for TensorFlow operations
    hookTimeout: 60000,
    // Include test files
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    // Exclude old test files
    exclude: [
      'node_modules/**',
      'dist/**',
      'scripts/**',
      'examples/**',
      'cli-package/**',
      '*.js' // Exclude old JS test files in root
    ],
    // Add environment options to help with TextEncoder issues
    environmentOptions: {
      env: {
        FORCE_PATCHED_PLATFORM: 'true'
      }
    }
  },
  // Resolve configuration for proper module handling
  resolve: {
    alias: {
      '@': './src',
      '@tests': './tests'
    }
  },
  // Define different configurations for different environments
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})
