/**
 * Browser Framework Entry Point for Brainy
 * Optimized for modern frameworks like Angular, React, Vue, etc.
 * Auto-detects environment and uses optimal storage (OPFS in browsers)
 */

import { BrainyData, BrainyDataConfig } from './brainyData.js'
import { VerbType, NounType } from './types/graphTypes.js'

/**
 * Create a BrainyData instance optimized for browser frameworks
 * Auto-detects environment and selects optimal storage and settings
 */
export async function createBrowserBrainyData(config: Partial<BrainyDataConfig> = {}): Promise<BrainyData> {
  // BrainyData already has environment detection and will automatically:
  // - Use OPFS storage in browsers with fallback to Memory
  // - Use FileSystem storage in Node.js
  // - Request persistent storage when appropriate
  const browserConfig: BrainyDataConfig = {
    storage: {
      requestPersistentStorage: true // Request persistent storage for better performance
    },
    ...config
  }

  const brainyData = new BrainyData(browserConfig)
  await brainyData.init()
  
  return brainyData
}

// Re-export types and constants for framework use
export { VerbType, NounType, BrainyData }
export type { BrainyDataConfig }

// Default export for easy importing
export default createBrowserBrainyData