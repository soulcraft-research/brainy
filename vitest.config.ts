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
    // Use a comprehensive reporter that shows detailed test results
    reporters: [
      [
        'default',
        {
          summary: true,
          reportSummary: true
        }
      ],
      'verbose'
    ],
    // Configure output for better visibility
    silent: false,
    // Configure error display for better readability
    bail: 0,
    // Disable coverage reports by default to reduce noise
    coverage: {
      enabled: false
    },
    // Show test statistics
    logHeapUsage: false,
    // Show all tests for comprehensive reporting
    hideSkippedTests: false,
    // Show stack traces for better debugging
    printConsoleTrace: true,
    // Show test timing information
    showTimer: true,
    // Filter out noisy console output more aggressively
    onConsoleLog: (log: string, type: 'stdout' | 'stderr'): false | void => {
      // Filter out all TensorFlow.js, model loading, and setup noise
      const noisePatterns: string[] = [
        'Brainy: Successfully patched TensorFlow.js PlatformNode',
        'Applied TensorFlow.js patch via ES modules',
        'Brainy running in Node.js environment',
        'Pre-loading Universal Sentence Encoder model',
        'Universal Sentence Encoder module structure',
        'No default export',
        'Using sentenceEncoderModule.load',
        'Loading Universal Sentence Encoder model',
        'Universal Sentence Encoder model loaded successfully',
        'Using file system storage for Node.js environment',
        'Using WebGL backend for TensorFlow.js',
        'Platform node has already been set',
        'Overwriting the platform with node',
        'Brainy: Applying TensorFlow.js platform patch',
        'The kernel',
        'for backend',
        'is already registered',
        'Hi there 👋. Looks like you are running TensorFlow.js',
        'backend registration',
        'webgl',
        'cpu',
        'Could not get context for WebGL version',
        'Retrying Universal Sentence Encoder initialization',
        'Skipping noun',
        'due to dimension mismatch',
        'Retrying Universal Sentence Encoder model loading',
        'Successfully loaded Universal Sentence Encoder with fallback method'
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
  // Define different configurations for different environments
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})
