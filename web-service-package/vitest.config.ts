import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Global test utilities
    globals: true,
    // Longer timeout for server startup/shutdown and HTTP requests
    testTimeout: 30000, // 30 seconds for web service operations
    hookTimeout: 30000,
    // Include test files in tests directory
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    // Node environment for server testing
    environment: 'node',
    // Exclude unnecessary files
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/**',
      '*.js' // Exclude old JS test files
    ],
    // Use default reporter with summary
    reporters: ['default'],
    // Enable console output for debugging
    silent: false,
    // Don't bail on first failure to see all test results
    bail: 0,
    // Disable coverage by default
    coverage: {
      enabled: false
    },
    // Show detailed output for web service testing
    logHeapUsage: false,
    hideSkippedTests: false,
    printConsoleTrace: true,
    // Filter out server startup noise but keep important messages
    onConsoleLog: (log: string, type: 'stdout' | 'stderr'): false | void => {
      const noisePatterns: string[] = [
        'Brainy running in Node.js environment',
        'Using file system storage for Node.js environment',
        'Platform node has already been set',
        'Hi there 👋. Looks like you are running TensorFlow.js'
      ]

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
  // Define test environment
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})
