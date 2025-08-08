/**
 * Universal Events implementation
 * Browser: Uses EventTarget API
 * Node.js: Uses built-in events module
 */

import { isBrowser, isNode } from '../utils/environment.js'

let nodeEvents: any = null

// Dynamic import for Node.js events (only in Node.js environment)
if (isNode()) {
  try {
    nodeEvents = await import('events')
  } catch {
    // Ignore import errors in non-Node environments
  }
}

/**
 * Universal EventEmitter interface
 */
export interface UniversalEventEmitter {
  on(event: string, listener: (...args: any[]) => void): this
  off(event: string, listener: (...args: any[]) => void): this
  emit(event: string, ...args: any[]): boolean
  once(event: string, listener: (...args: any[]) => void): this
  removeAllListeners(event?: string): this
  listenerCount(event: string): number
}

/**
 * Browser implementation using EventTarget
 */
class BrowserEventEmitter extends EventTarget implements UniversalEventEmitter {
  private listeners = new Map<string, Set<(...args: any[]) => void>>()

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
    
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      listener(...(customEvent.detail || []))
    }
    
    // Store original listener reference for removal
    ;(listener as any).__handler = handler
    this.addEventListener(event, handler)
    
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      
      const handler = (listener as any).__handler
      if (handler) {
        this.removeEventListener(event, handler)
        delete (listener as any).__handler
      }
    }
    
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    const customEvent = new CustomEvent(event, { detail: args })
    this.dispatchEvent(customEvent)
    
    const eventListeners = this.listeners.get(event)
    return eventListeners ? eventListeners.size > 0 : false
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const onceListener = (...args: any[]) => {
      this.off(event, onceListener)
      listener(...args)
    }
    
    return this.on(event, onceListener)
  }

  removeAllListeners(event?: string): this {
    if (event) {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        for (const listener of eventListeners) {
          this.off(event, listener)
        }
      }
    } else {
      for (const [eventName] of this.listeners) {
        this.removeAllListeners(eventName)
      }
    }
    
    return this
  }

  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event)
    return eventListeners ? eventListeners.size : 0
  }
}

/**
 * Node.js implementation using events.EventEmitter
 */
class NodeEventEmitter implements UniversalEventEmitter {
  private emitter: any

  constructor() {
    this.emitter = new nodeEvents.EventEmitter()
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.emitter.on(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.emitter.off(event, listener)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args)
  }

  once(event: string, listener: (...args: any[]) => void): this {
    this.emitter.once(event, listener)
    return this
  }

  removeAllListeners(event?: string): this {
    this.emitter.removeAllListeners(event)
    return this
  }

  listenerCount(event: string): number {
    return this.emitter.listenerCount(event)
  }
}

/**
 * Universal EventEmitter class
 */
export class EventEmitter implements UniversalEventEmitter {
  private emitter: UniversalEventEmitter

  constructor() {
    if (isBrowser()) {
      this.emitter = new BrowserEventEmitter()
    } else if (isNode() && nodeEvents) {
      this.emitter = new NodeEventEmitter()
    } else {
      this.emitter = new BrowserEventEmitter()
    }
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.emitter.on(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.emitter.off(event, listener)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args)
  }

  once(event: string, listener: (...args: any[]) => void): this {
    this.emitter.once(event, listener)
    return this
  }

  removeAllListeners(event?: string): this {
    this.emitter.removeAllListeners(event)
    return this
  }

  listenerCount(event: string): number {
    return this.emitter.listenerCount(event)
  }
}

// Named export for compatibility
export { EventEmitter as default }

// Re-export Node.js EventEmitter class if available
export const NodeEventEmitterClass = nodeEvents?.EventEmitter || null