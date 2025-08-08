/**
 * Universal adapters for cross-environment compatibility
 * Provides consistent APIs across Browser, Node.js, and Serverless environments
 */

// UUID adapter
export * from './uuid.js'
export { default as uuid } from './uuid.js'

// Crypto adapter  
export * from './crypto.js'
export { default as crypto } from './crypto.js'

// File system adapter
export * from './fs.js'
export { default as fs } from './fs.js'

// Path adapter
export * from './path.js'
export { default as path } from './path.js'

// Events adapter
export * from './events.js'
export { default as events } from './events.js'

// Convenience re-exports for common patterns
export { v4 as uuidv4 } from './uuid.js'
export { EventEmitter } from './events.js'