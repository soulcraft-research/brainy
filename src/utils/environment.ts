/**
 * Utility functions for environment detection
 */

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  // If browser environment is detected, prioritize it over Node.js
  // This handles cases like jsdom where both window and process exist
  if (isBrowser()) {
    return false
  }

  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  )
}

/**
 * Check if code is running in a Web Worker environment
 */
export function isWebWorker(): boolean {
  return (
    typeof self === 'object' &&
    self.constructor &&
    self.constructor.name === 'DedicatedWorkerGlobalScope'
  )
}

/**
 * Check if Web Workers are available in the current environment
 */
export function areWebWorkersAvailable(): boolean {
  return isBrowser() && typeof Worker !== 'undefined'
}

/**
 * Check if Worker Threads are available in the current environment (Node.js)
 */
export async function areWorkerThreadsAvailable(): Promise<boolean> {
  if (!isNode()) return false

  try {
    // Use dynamic import to avoid errors in browser environments
    await import('worker_threads')
    return true
  } catch (e) {
    return false
  }
}

/**
 * Synchronous version that doesn't actually try to load the module
 * This is safer in ES module environments
 */
export function areWorkerThreadsAvailableSync(): boolean {
  if (!isNode()) return false

  // In Node.js 24.4.0+, worker_threads is always available
  return parseInt(process.versions.node.split('.')[0]) >= 24
}

/**
 * Determine if threading is available in the current environment
 * Returns true if either Web Workers (browser) or Worker Threads (Node.js) are available
 */
export function isThreadingAvailable(): boolean {
  return areWebWorkersAvailable() || areWorkerThreadsAvailableSync()
}

/**
 * Async version of isThreadingAvailable
 */
export async function isThreadingAvailableAsync(): Promise<boolean> {
  return areWebWorkersAvailable() || (await areWorkerThreadsAvailable())
}

/**
 * Auto-detect production environment to minimize logging costs
 */
export function isProductionEnvironment(): boolean {
  // Node.js environment detection
  if (isNode()) {
    // Check common production environment indicators
    const nodeEnv = process.env.NODE_ENV?.toLowerCase()
    if (nodeEnv === 'production' || nodeEnv === 'prod') return true
    
    // Google Cloud Run detection
    if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT) return true
    
    // AWS Lambda detection  
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) return true
    
    // Azure Functions detection
    if (process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.WEBSITE_SITE_NAME) return true
    
    // Vercel detection
    if (process.env.VERCEL || process.env.VERCEL_ENV === 'production') return true
    
    // Netlify detection
    if (process.env.NETLIFY && process.env.CONTEXT === 'production') return true
    
    // Heroku detection
    if (process.env.DYNO && process.env.NODE_ENV !== 'development') return true
    
    // Railway detection
    if (process.env.RAILWAY_ENVIRONMENT === 'production') return true
    
    // Fly.io detection
    if (process.env.FLY_APP_NAME && process.env.FLY_REGION) return true
    
    // Docker in production (common patterns)
    if (process.env.DOCKER_ENV === 'production' || process.env.ENVIRONMENT === 'production') return true
    
    // Generic production indicators
    if (process.env.PROD === 'true' || process.env.PRODUCTION === 'true') return true
  }
  
  // Browser environment - assume development unless explicitly production
  if (isBrowser()) {
    // Check for production domain patterns
    const hostname = window?.location?.hostname
    if (hostname) {
      // Avoid logging on production domains
      if (hostname.includes('.com') || hostname.includes('.org') || hostname.includes('.net')) {
        return !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('dev')
      }
    }
  }
  
  return false
}

/**
 * Get appropriate log level based on environment
 */
export function getLogLevel(): 'silent' | 'error' | 'warn' | 'info' | 'verbose' {
  // Explicit log level override
  const explicitLevel = process.env.BRAINY_LOG_LEVEL?.toLowerCase()
  if (explicitLevel && ['silent', 'error', 'warn', 'info', 'verbose'].includes(explicitLevel)) {
    return explicitLevel as 'silent' | 'error' | 'warn' | 'info' | 'verbose'
  }
  
  // Auto-detect based on environment
  if (isProductionEnvironment()) {
    return 'error' // Only log errors in production to minimize costs
  }
  
  // Development environments get more verbose logging
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
    return 'verbose'
  }
  
  // Test environments should be quieter
  if (process.env.NODE_ENV === 'test') {
    return 'warn'
  }
  
  // Default to info level
  return 'info'
}

/**
 * Check if logging should be enabled for a given level
 */
export function shouldLog(level: 'error' | 'warn' | 'info' | 'verbose'): boolean {
  const currentLevel = getLogLevel()
  
  if (currentLevel === 'silent') return false
  
  const levels = ['error', 'warn', 'info', 'verbose']
  const currentIndex = levels.indexOf(currentLevel)
  const messageIndex = levels.indexOf(level)
  
  return messageIndex <= currentIndex
}
