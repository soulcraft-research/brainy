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
    // Configure reporters for different output formats
    reporters: [
      // Default reporter for basic progress during test run
      [
        'default',
        {
          summary: true,
          reportSummary: true,
          // Show test titles for all tests
          successfulTestOnly: false,
          // Show a compact output
          outputFile: false
        }
      ],
      // JSON reporter for machine-readable output (can be used for CI/CD)
      [
        'json',
        {
          outputFile: './test-results.json'
        }
      ]
    ],
    // Configure output for better visibility
    silent: false,
    // Configure error display for better readability
    bail: 0,
    // Disable coverage reports by default to reduce noise
    coverage: {
      enabled: false
    },
    // Don't show test statistics to reduce noise
    logHeapUsage: false,
    // Hide skipped tests to reduce noise
    hideSkippedTests: true,
    // Only show stack traces for failed tests
    printConsoleTrace: false,
    // Show test timing information in the summary
    // showTimer: true,
    // Aggressively filter out console output to only show test progress
    onConsoleLog: (log: string, type: 'stdout' | 'stderr'): false | void => {
      // For stdout, only allow critical error messages and test progress indicators
      if (type === 'stdout') {
        // Only allow through explicit test-related messages and critical errors
        const allowedPatterns = [
          'Error:',
          'FAIL',
          'PASS',
          'WARNING:',
          'test result',
          'Test Files',
          'Tests',
          'Start at',
          'Duration',
          '✓',
          '✗',
          'running',
          'suite'
        ]

        // If the log doesn't contain any allowed pattern, filter it out
        if (!allowedPatterns.some((pattern) => log.includes(pattern))) {
          return false
        }
      }

      // For stderr, only show actual errors
      if (
        type === 'stderr' &&
        !log.includes('Error:') &&
        !log.includes('FAIL')
      ) {
        return false
      }

      // Expanded list of noise patterns to filter out
      const noisePatterns: string[] = [
        // Original patterns
        'Brainy:',
        'TensorFlow',
        'Universal Sentence Encoder',
        'Using file system storage',
        'Using WebGL backend',
        'Platform node',
        'The kernel',
        'for backend',
        'is already registered',
        'Hi there 👋',
        'backend registration',
        'webgl',
        'cpu',
        'Could not get context',
        'Retrying',
        'Skipping noun',
        'due to dimension mismatch',
        'Successfully loaded',
        'model loaded',
        'module structure',
        'No default export',
        'Using sentenceEncoderModule',
        'Loading',
        'Applying',
        'Overwriting',
        'Applied',
        'running in Node.js environment',
        'Pre-loading',
        'has already been set',
        // Additional patterns to filter out common console.log statements from tests
        'Attempting to add',
        'Successfully added',
        'Test API server running',
        'Text content not found',
        'Searching for text',
        'Expected ID:',
        'Search returned',
        'First result ID:',
        'All result IDs:',
        'Could not find result',
        'Found result with matching ID:',
        'console.log',
        'console.info',
        'console.debug'
      ]

      // Return false (don't show) if log contains any noise pattern
      if (noisePatterns.some((pattern) => log.includes(pattern))) {
        return false
      }

      // Additional filtering for common debug output patterns
      if (
        log.includes('Searching') ||
        log.includes('Found') ||
        log.includes('Created') ||
        log.includes('Loaded') ||
        log.includes('Processing') ||
        log.includes('Initializing') ||
        log.includes('Starting') ||
        log.includes('Completed') ||
        log.includes('Finished')
      ) {
        return false
      }

      return undefined // Show the log if it passes all filters
    }

    // Add a custom reporter configuration for a cleaner output
    // outputDiffLines: 5, // Limit diff output lines for cleaner error reports
    // outputFileMaxLines: 40, // Limit file output lines for cleaner error reports
    // outputTruncateLength: 80 // Truncate long output lines
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
