/**
 * Universal Path implementation
 * Browser: Manual path operations
 * Node.js: Uses built-in path module
 */

import { isNode } from '../utils/environment.js'

let nodePath: any = null

// Dynamic import for Node.js path (only in Node.js environment)
if (isNode()) {
  try {
    nodePath = await import('path')
  } catch {
    // Ignore import errors in non-Node environments
  }
}

/**
 * Universal path operations
 */
export function join(...paths: string[]): string {
  if (nodePath) {
    return nodePath.join(...paths)
  }
  
  // Browser fallback implementation
  const parts: string[] = []
  for (const path of paths) {
    if (path) {
      parts.push(...path.split('/').filter(p => p))
    }
  }
  return parts.join('/')
}

export function dirname(path: string): string {
  if (nodePath) {
    return nodePath.dirname(path)
  }
  
  // Browser fallback implementation
  const parts = path.split('/').filter(p => p)
  if (parts.length <= 1) return '.'
  return parts.slice(0, -1).join('/')
}

export function basename(path: string, ext?: string): string {
  if (nodePath) {
    return nodePath.basename(path, ext)
  }
  
  // Browser fallback implementation
  const parts = path.split('/')
  let name = parts[parts.length - 1]
  
  if (ext && name.endsWith(ext)) {
    name = name.slice(0, -ext.length)
  }
  
  return name
}

export function extname(path: string): string {
  if (nodePath) {
    return nodePath.extname(path)
  }
  
  // Browser fallback implementation
  const name = basename(path)
  const lastDot = name.lastIndexOf('.')
  return lastDot === -1 ? '' : name.slice(lastDot)
}

export function resolve(...paths: string[]): string {
  if (nodePath) {
    return nodePath.resolve(...paths)
  }
  
  // Browser fallback implementation
  let resolved = ''
  let resolvedAbsolute = false
  
  for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? paths[i] : '/'
    
    if (!path) continue
    
    resolved = path + '/' + resolved
    resolvedAbsolute = path.charAt(0) === '/'
  }
  
  // Normalize the path
  resolved = normalizeArray(resolved.split('/').filter(p => p), !resolvedAbsolute).join('/')
  
  return (resolvedAbsolute ? '/' : '') + resolved
}

export function relative(from: string, to: string): string {
  if (nodePath) {
    return nodePath.relative(from, to)
  }
  
  // Browser fallback implementation
  const fromParts = resolve(from).split('/').filter(p => p)
  const toParts = resolve(to).split('/').filter(p => p)
  
  let commonLength = 0
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++
    } else {
      break
    }
  }
  
  const upCount = fromParts.length - commonLength
  const upParts = new Array(upCount).fill('..')
  const downParts = toParts.slice(commonLength)
  
  return [...upParts, ...downParts].join('/')
}

export function isAbsolute(path: string): boolean {
  if (nodePath) {
    return nodePath.isAbsolute(path)
  }
  
  // Browser fallback implementation
  return path.charAt(0) === '/'
}

/**
 * Normalize array helper function
 */
function normalizeArray(parts: string[], allowAboveRoot: boolean): string[] {
  const res: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    
    if (!p || p === '.') continue
    
    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop()
      } else if (allowAboveRoot) {
        res.push('..')
      }
    } else {
      res.push(p)
    }
  }
  
  return res
}

// Path separator (always use forward slash for consistency)
export const sep = '/'
export const delimiter = ':'

// POSIX path object for compatibility
export const posix = {
  join,
  dirname,
  basename,
  extname,
  resolve,
  relative,
  isAbsolute,
  sep: '/',
  delimiter: ':'
}

// Default export
export default {
  join,
  dirname,
  basename,
  extname,
  resolve,
  relative,
  isAbsolute,
  sep,
  delimiter,
  posix
}