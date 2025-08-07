import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    timeout: 60000, // 60 seconds for model loading
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    reporters: process.env.CI ? ['json'] : ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.config.js',
        '**/*.config.ts',
        'tests/**'
      ]
    },
    setupFiles: ['./tests/setup.js'],
    globalSetup: ['./tests/globalSetup.js']
  }
})