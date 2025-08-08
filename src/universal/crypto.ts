/**
 * Universal Crypto implementation
 * Works in all environments: Browser, Node.js, Serverless
 */

import { isBrowser, isNode } from '../utils/environment.js'

let nodeCrypto: any = null

// Dynamic import for Node.js crypto (only in Node.js environment)
if (isNode()) {
  try {
    nodeCrypto = await import('crypto')
  } catch {
    // Ignore import errors in non-Node environments
  }
}

/**
 * Generate random bytes
 */
export function randomBytes(size: number): Uint8Array {
  if (isBrowser() || typeof crypto !== 'undefined') {
    // Use Web Crypto API (available in browsers and modern Node.js)
    const array = new Uint8Array(size)
    crypto.getRandomValues(array)
    return array
  } else if (nodeCrypto) {
    // Use Node.js crypto as fallback
    return new Uint8Array(nodeCrypto.randomBytes(size))
  } else {
    // Fallback for environments without crypto
    const array = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }
}

/**
 * Generate random UUID
 */
export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  } else if (nodeCrypto && nodeCrypto.randomUUID) {
    return nodeCrypto.randomUUID()
  } else {
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

/**
 * Create hash (simplified interface)
 */
export function createHash(algorithm: string): {
  update: (data: string | Uint8Array) => any
  digest: (encoding: string) => string
} {
  if (nodeCrypto && nodeCrypto.createHash) {
    return nodeCrypto.createHash(algorithm)
  } else {
    // Simple fallback hash for browsers (not cryptographically secure)
    let hash = 0
    const hashObj = {
      update: (data: string | Uint8Array) => {
        const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
        for (let i = 0; i < text.length; i++) {
          const char = text.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32-bit integer
        }
        return hashObj
      },
      digest: (encoding: string) => {
        return Math.abs(hash).toString(16)
      }
    }
    return hashObj
  }
}

/**
 * Create HMAC
 */
export function createHmac(algorithm: string, key: string | Uint8Array): {
  update: (data: string | Uint8Array) => any
  digest: (encoding: string) => string
} {
  if (nodeCrypto && nodeCrypto.createHmac) {
    return nodeCrypto.createHmac(algorithm, key)
  } else {
    // Fallback HMAC implementation (simplified)
    return createHash(algorithm)
  }
}

/**
 * PBKDF2 synchronous 
 */
export function pbkdf2Sync(password: string | Uint8Array, salt: string | Uint8Array, iterations: number, keylen: number, digest: string): Uint8Array {
  if (nodeCrypto && nodeCrypto.pbkdf2Sync) {
    return new Uint8Array(nodeCrypto.pbkdf2Sync(password, salt, iterations, keylen, digest))
  } else {
    // Simplified fallback (not cryptographically secure)
    const result = new Uint8Array(keylen)
    const passwordStr = typeof password === 'string' ? password : new TextDecoder().decode(password)
    const saltStr = typeof salt === 'string' ? salt : new TextDecoder().decode(salt)
    
    let hash = 0
    const combined = passwordStr + saltStr
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i)
      hash = hash & hash
    }
    
    for (let i = 0; i < keylen; i++) {
      result[i] = (Math.abs(hash + i) % 256)
    }
    return result
  }
}

/**
 * Scrypt synchronous
 */
export function scryptSync(password: string | Uint8Array, salt: string | Uint8Array, keylen: number, options?: any): Uint8Array {
  if (nodeCrypto && nodeCrypto.scryptSync) {
    return new Uint8Array(nodeCrypto.scryptSync(password, salt, keylen, options))
  } else {
    // Fallback to pbkdf2Sync
    return pbkdf2Sync(password, salt, 10000, keylen, 'sha256')
  }
}

/**
 * Create cipher
 */
export function createCipheriv(algorithm: string, key: Uint8Array, iv: Uint8Array): {
  update: (data: string, inputEncoding?: string, outputEncoding?: string) => string
  final: (outputEncoding?: string) => string
} {
  if (nodeCrypto && nodeCrypto.createCipheriv) {
    return nodeCrypto.createCipheriv(algorithm, key, iv)
  } else {
    // Fallback encryption (XOR-based, not secure)
    let encrypted = ''
    return {
      update: (data: string, inputEncoding?: string, outputEncoding?: string) => {
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i)
          const keyByte = key[i % key.length]
          const ivByte = iv[i % iv.length]
          encrypted += String.fromCharCode(char ^ keyByte ^ ivByte)
        }
        return outputEncoding === 'hex' ? Buffer.from(encrypted, 'binary').toString('hex') : encrypted
      },
      final: (outputEncoding?: string) => {
        return outputEncoding === 'hex' ? '' : ''
      }
    }
  }
}

/**
 * Create decipher
 */
export function createDecipheriv(algorithm: string, key: Uint8Array, iv: Uint8Array): {
  update: (data: string, inputEncoding?: string, outputEncoding?: string) => string
  final: (outputEncoding?: string) => string
} {
  if (nodeCrypto && nodeCrypto.createDecipheriv) {
    return nodeCrypto.createDecipheriv(algorithm, key, iv)
  } else {
    // Fallback decryption (XOR-based, matches createCipheriv)
    let decrypted = ''
    return {
      update: (data: string, inputEncoding?: string, outputEncoding?: string) => {
        const input = inputEncoding === 'hex' ? Buffer.from(data, 'hex').toString('binary') : data
        for (let i = 0; i < input.length; i++) {
          const char = input.charCodeAt(i)
          const keyByte = key[i % key.length]
          const ivByte = iv[i % iv.length]
          decrypted += String.fromCharCode(char ^ keyByte ^ ivByte)
        }
        return decrypted
      },
      final: (outputEncoding?: string) => {
        return ''
      }
    }
  }
}

/**
 * Timing safe equal
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (nodeCrypto && nodeCrypto.timingSafeEqual) {
    return nodeCrypto.timingSafeEqual(a, b)
  } else {
    // Fallback implementation
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  }
}

export default {
  randomBytes,
  randomUUID, 
  createHash,
  createHmac,
  pbkdf2Sync,
  scryptSync,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual
}