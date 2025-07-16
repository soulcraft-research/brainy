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
    // Default environment
    environment: 'node',
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
    },
    // Reduce noise in output
    silent: false,
    // Configure error display for better readability
    bail: 0,
    // Disable coverage reports by default to reduce noise
    coverage: {
      enabled: false
    },
    // Reduce verbosity of test output
    logHeapUsage: false,
    // Only show failed tests in detail
    hideSkippedTests: true,
    // Reduce stack trace noise
    printConsoleTrace: false,
    // Filter out noisy console output more aggressively
    onConsoleLog: (log: string, type: 'stdout' | 'stderr'): false | void => {
      // Filter out all TensorFlow.js, model loading, and setup noise
      const noisePatterns: string[] = []

      // Return false (don't show) if log contains any noise pattern
      if (noisePatterns.some((pattern) => log.includes(pattern))) {
        return false
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
