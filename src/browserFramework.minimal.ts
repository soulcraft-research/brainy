/**
 * Minimal Browser Framework Entry Point for Brainy
 * Core MIT open source functionality only - no enterprise features
 * Optimized for browser usage with all dependencies bundled
 */

import { BrainyData } from './brainyData.js'
import { VerbType, NounType } from './types/graphTypes.js'

/**
 * Create a BrainyData instance optimized for browser usage
 * Auto-detects environment and selects optimal storage and settings
 */
export async function createBrowserBrainyData(config = {}) {
    // BrainyData already has environment detection and will automatically:
    // - Use OPFS storage in browsers with fallback to Memory
    // - Use FileSystem storage in Node.js
    // - Request persistent storage when appropriate
    const browserConfig = {
        storage: {
            requestPersistentStorage: true // Request persistent storage for better performance
        },
        ...config
    }

    const brainyData = new BrainyData(browserConfig)
    await brainyData.init()
    return brainyData
}

// Re-export core types and classes for browser use
export { VerbType, NounType, BrainyData }

// Default export for easy importing
export default createBrowserBrainyData