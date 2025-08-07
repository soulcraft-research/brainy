import { beforeAll, afterAll } from 'vitest'
import config from 'config'

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'error'
  
  // Suppress console output during tests
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  
  console.log = (...args) => {
    if (!args[0]?.includes?.('Model loaded') && !args[0]?.includes?.('Brainy')) {
      originalConsoleLog.apply(console, args)
    }
  }
  
  console.warn = (...args) => {
    if (!args[0]?.includes?.('Model') && !args[0]?.includes?.('TensorFlow')) {
      originalConsoleWarn.apply(console, args)
    }
  }
})

afterAll(async () => {
  // Cleanup any global resources
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
})