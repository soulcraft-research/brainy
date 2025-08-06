/**
 * OPFS (Origin Private File System) Mock for Testing
 * 
 * This module provides a comprehensive mock implementation of the OPFS API
 * for testing OPFS-based storage in a Node.js environment.
 */

import { vi } from 'vitest'

// In-memory storage to simulate file system
const mockFileSystem: Map<string, Map<string, any>> = new Map()

// Mock file data
interface MockFileData {
  content: string
  type: string
}

/**
 * Create a mock FileSystemFileHandle
 */
export function createMockFileHandle(fileName: string, content: string = '{}') {
  return {
    kind: 'file',
    name: fileName,
    getFile: vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue(content),
      arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer),
      size: content.length
    }),
    createWritable: vi.fn().mockImplementation(() => {
      const writable = {
        write: vi.fn().mockImplementation((data: string | ArrayBuffer) => {
          // Store the data in our mock file system
          const path = mockFileSystem.get('currentPath') || '/'
          const dirMap = mockFileSystem.get(path) || new Map()
          
          let content: string
          if (typeof data === 'string') {
            content = data
          } else if (data instanceof ArrayBuffer) {
            content = new TextDecoder().decode(data)
          } else if (data && typeof data === 'object' && 'type' in data && data.type === 'write') {
            // Handle FileSystemWriteChunkType
            const chunk = data as { type: 'write', position?: number, data: string | ArrayBuffer }
            if (typeof chunk.data === 'string') {
              content = chunk.data
            } else {
              content = new TextDecoder().decode(chunk.data)
            }
          } else {
            content = JSON.stringify(data)
          }
          
          dirMap.set(fileName, { content, type: 'file' })
          mockFileSystem.set(path, dirMap)
          return Promise.resolve()
        }),
        close: vi.fn().mockResolvedValue(undefined)
      }
      return Promise.resolve(writable)
    })
  }
}

/**
 * Create a mock FileSystemDirectoryHandle
 */
export function createMockDirectoryHandle(dirName: string, entries: Map<string, any> = new Map()) {
  const dirPath = mockFileSystem.get('currentPath') || '/'
  const fullPath = dirPath === '/' ? `/${dirName}` : `${dirPath}/${dirName}`
  
  // Store the directory in our mock file system
  mockFileSystem.set(fullPath, entries)
  
  return {
    kind: 'directory',
    name: dirName,
    getDirectoryHandle: vi.fn().mockImplementation((name: string, options: { create?: boolean } = {}) => {
      mockFileSystem.set('currentPath', fullPath)
      
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      const entry = dirEntries.get(name)
      
      if (entry && entry.type === 'directory') {
        return Promise.resolve(createMockDirectoryHandle(name, entry.content))
      }
      
      if (!entry && options.create) {
        const newDir = new Map()
        dirEntries.set(name, { content: newDir, type: 'directory' })
        mockFileSystem.set(fullPath, dirEntries)
        return Promise.resolve(createMockDirectoryHandle(name, newDir))
      }
      
      return Promise.reject(new Error(`Directory not found: ${name}`))
    }),
    getFileHandle: vi.fn().mockImplementation((name: string, options: { create?: boolean } = {}) => {
      mockFileSystem.set('currentPath', fullPath)
      
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      const entry = dirEntries.get(name)
      
      if (entry && entry.type === 'file') {
        return Promise.resolve(createMockFileHandle(name, entry.content))
      }
      
      if (!entry && options.create) {
        return Promise.resolve(createMockFileHandle(name))
      }
      
      return Promise.reject(new Error(`File not found: ${name}`))
    }),
    removeEntry: vi.fn().mockImplementation((name: string, options: { recursive?: boolean } = {}) => {
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      
      if (!dirEntries.has(name)) {
        return Promise.reject(new Error(`Entry not found: ${name}`))
      }
      
      const entry = dirEntries.get(name)
      
      if (entry.type === 'directory' && !options.recursive) {
        const subDirPath = fullPath === '/' ? `/${name}` : `${fullPath}/${name}`
        const subDirEntries = mockFileSystem.get(subDirPath) || new Map()
        
        if (subDirEntries.size > 0) {
          return Promise.reject(new Error(`Directory not empty: ${name}`))
        }
      }
      
      dirEntries.delete(name)
      
      if (entry.type === 'directory') {
        const subDirPath = fullPath === '/' ? `/${name}` : `${fullPath}/${name}`
        mockFileSystem.delete(subDirPath)
      }
      
      return Promise.resolve()
    }),
    entries: vi.fn().mockImplementation(async function* () {
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      
      for (const [name, entry] of dirEntries.entries()) {
        if (entry.type === 'file') {
          yield [name, createMockFileHandle(name, entry.content)]
        } else {
          yield [name, createMockDirectoryHandle(name, entry.content)]
        }
      }
    }),
    values: vi.fn().mockImplementation(async function* () {
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      
      for (const [name, entry] of dirEntries.entries()) {
        if (entry.type === 'file') {
          yield createMockFileHandle(name, entry.content)
        } else {
          yield createMockDirectoryHandle(name, entry.content)
        }
      }
    }),
    keys: vi.fn().mockImplementation(async function* () {
      const dirEntries = mockFileSystem.get(fullPath) || new Map()
      
      for (const name of dirEntries.keys()) {
        yield name
      }
    })
  }
}

/**
 * Setup OPFS mock environment
 */
export function setupOPFSMock() {
  // Clear the mock file system
  mockFileSystem.clear()
  mockFileSystem.set('/', new Map())
  mockFileSystem.set('currentPath', '/')
  
  // Create root directory handle
  const rootDirectoryHandle = createMockDirectoryHandle('root')
  
  // Mock navigator.storage if it doesn't exist
  if (typeof global.navigator === 'undefined') {
    // @ts-expect-error - Mocking global
    global.navigator = {}
  }
  
  // Define storage if it doesn't exist
  if (typeof global.navigator.storage === 'undefined') {
    Object.defineProperty(global.navigator, 'storage', {
      value: {},
      writable: true,
      configurable: true
    })
  }
  
  // Mock storage methods
  global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(rootDirectoryHandle)
  global.navigator.storage.persisted = vi.fn().mockResolvedValue(true)
  global.navigator.storage.persist = vi.fn().mockResolvedValue(true)
  global.navigator.storage.estimate = vi.fn().mockImplementation(() => {
    // Calculate total size of all files in the mock file system
    let totalSize = 0
    
    for (const [path, entries] of mockFileSystem.entries()) {
      if (path === 'currentPath') continue
      
      for (const [_, entry] of entries.entries()) {
        if (entry.type === 'file') {
          totalSize += entry.content.length
        }
      }
    }
    
    return Promise.resolve({ usage: totalSize, quota: 10 * 1024 * 1024 }) // 10MB quota
  })
  
  return {
    rootDirectoryHandle,
    mockFileSystem,
    reset: () => {
      mockFileSystem.clear()
      mockFileSystem.set('/', new Map())
      mockFileSystem.set('currentPath', '/')
    }
  }
}

/**
 * Cleanup OPFS mock environment
 */
export function cleanupOPFSMock() {
  // Reset mocks
  vi.restoreAllMocks()
  
  // Clear the mock file system
  mockFileSystem.clear()
}