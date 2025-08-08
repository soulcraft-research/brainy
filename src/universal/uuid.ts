/**
 * Universal UUID implementation
 * Works in all environments: Browser, Node.js, Serverless
 */

import { isBrowser, isNode } from '../utils/environment.js'

export function v4(): string {
  // Use crypto.randomUUID if available (Node.js 19+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Named export to match uuid package API
export { v4 as uuidv4 }

// Default export for convenience
export default { v4 }