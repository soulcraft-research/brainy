/**
 * Universal File System implementation
 * Browser: Uses OPFS (Origin Private File System)
 * Node.js: Uses built-in fs/promises
 * Serverless: Uses memory-based fallback
 */

import { isBrowser, isNode } from '../utils/environment.js'

let nodeFs: any = null

// Dynamic import for Node.js fs (only in Node.js environment)
if (isNode()) {
  try {
    nodeFs = await import('fs/promises')
  } catch {
    // Ignore import errors in non-Node environments
  }
}

/**
 * Universal file operations interface
 */
export interface UniversalFS {
  readFile(path: string): Promise<string>
  writeFile(path: string, data: string): Promise<void>
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  exists(path: string): Promise<boolean>
  readdir(path: string): Promise<string[]>
  unlink(path: string): Promise<void>
  stat(path: string): Promise<{ isFile(): boolean, isDirectory(): boolean }>
  access(path: string, mode?: number): Promise<void>
}

/**
 * Browser implementation using OPFS
 */
class BrowserFS implements UniversalFS {
  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      return await (navigator.storage as any).getDirectory()
    }
    throw new Error('OPFS not supported in this browser')
  }

  private async getFileHandle(path: string, create = false): Promise<FileSystemFileHandle> {
    const root = await this.getRoot()
    const parts = path.split('/').filter(p => p)
    
    let dir = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create })
    }
    
    const fileName = parts[parts.length - 1]
    return await dir.getFileHandle(fileName, { create })
  }

  private async getDirHandle(path: string, create = false): Promise<FileSystemDirectoryHandle> {
    const root = await this.getRoot()
    const parts = path.split('/').filter(p => p)
    
    let dir = root
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create })
    }
    
    return dir
  }

  async readFile(path: string): Promise<string> {
    try {
      const fileHandle = await this.getFileHandle(path)
      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      throw new Error(`File not found: ${path}`)
    }
  }

  async writeFile(path: string, data: string): Promise<void> {
    const fileHandle = await this.getFileHandle(path, true)
    const writable = await fileHandle.createWritable()
    await writable.write(data)
    await writable.close()
  }

  async mkdir(path: string, options = { recursive: true }): Promise<void> {
    await this.getDirHandle(path, true)
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.getFileHandle(path)
      return true
    } catch {
      try {
        await this.getDirHandle(path)
        return true
      } catch {
        return false
      }
    }
  }

  async readdir(path: string): Promise<string[]> {
    const dir = await this.getDirHandle(path)
    const entries: string[] = []
    for await (const [name] of dir.entries()) {
      entries.push(name)
    }
    return entries
  }

  async unlink(path: string): Promise<void> {
    const parts = path.split('/').filter(p => p)
    const fileName = parts.pop()!
    const dirPath = parts.join('/')
    
    if (dirPath) {
      const dir = await this.getDirHandle(dirPath)
      await dir.removeEntry(fileName)
    } else {
      const root = await this.getRoot()
      await root.removeEntry(fileName)
    }
  }

  async stat(path: string): Promise<{ isFile(): boolean, isDirectory(): boolean }> {
    try {
      await this.getFileHandle(path)
      return { isFile: () => true, isDirectory: () => false }
    } catch {
      try {
        await this.getDirHandle(path)
        return { isFile: () => false, isDirectory: () => true }
      } catch {
        throw new Error(`Path not found: ${path}`)
      }
    }
  }

  async access(path: string, mode?: number): Promise<void> {
    const exists = await this.exists(path)
    if (!exists) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`)
    }
  }
}

/**
 * Node.js implementation using fs/promises
 */
class NodeFS implements UniversalFS {
  async readFile(path: string): Promise<string> {
    return await nodeFs.readFile(path, 'utf-8')
  }

  async writeFile(path: string, data: string): Promise<void> {
    await nodeFs.writeFile(path, data, 'utf-8')
  }

  async mkdir(path: string, options = { recursive: true }): Promise<void> {
    await nodeFs.mkdir(path, options)
  }

  async exists(path: string): Promise<boolean> {
    try {
      await nodeFs.access(path)
      return true
    } catch {
      return false
    }
  }

  async readdir(path: string): Promise<string[]> {
    return await nodeFs.readdir(path)
  }

  async unlink(path: string): Promise<void> {
    await nodeFs.unlink(path)
  }

  async stat(path: string): Promise<{ isFile(): boolean, isDirectory(): boolean }> {
    const stats = await nodeFs.stat(path)
    return {
      isFile: () => stats.isFile(),
      isDirectory: () => stats.isDirectory()
    }
  }

  async access(path: string, mode?: number): Promise<void> {
    await nodeFs.access(path, mode)
  }
}

/**
 * Memory-based fallback for serverless/edge environments
 */
class MemoryFS implements UniversalFS {
  private files = new Map<string, string>()
  private dirs = new Set<string>()

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path)
    if (content === undefined) {
      throw new Error(`File not found: ${path}`)
    }
    return content
  }

  async writeFile(path: string, data: string): Promise<void> {
    this.files.set(path, data)
    // Ensure parent directories exist
    const parts = path.split('/').slice(0, -1)
    for (let i = 1; i <= parts.length; i++) {
      this.dirs.add(parts.slice(0, i).join('/'))
    }
  }

  async mkdir(path: string, options = { recursive: true }): Promise<void> {
    this.dirs.add(path)
    if (options.recursive) {
      const parts = path.split('/')
      for (let i = 1; i <= parts.length; i++) {
        this.dirs.add(parts.slice(0, i).join('/'))
      }
    }
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.dirs.has(path)
  }

  async readdir(path: string): Promise<string[]> {
    const entries = new Set<string>()
    const pathPrefix = path + '/'
    
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(pathPrefix)) {
        const relativePath = filePath.slice(pathPrefix.length)
        const firstSegment = relativePath.split('/')[0]
        entries.add(firstSegment)
      }
    }
    
    for (const dirPath of this.dirs) {
      if (dirPath.startsWith(pathPrefix)) {
        const relativePath = dirPath.slice(pathPrefix.length)
        const firstSegment = relativePath.split('/')[0]
        if (firstSegment) entries.add(firstSegment)
      }
    }
    
    return Array.from(entries)
  }

  async unlink(path: string): Promise<void> {
    this.files.delete(path)
  }

  async stat(path: string): Promise<{ isFile(): boolean, isDirectory(): boolean }> {
    const isFile = this.files.has(path)
    const isDir = this.dirs.has(path)
    
    if (!isFile && !isDir) {
      throw new Error(`Path not found: ${path}`)
    }
    
    return {
      isFile: () => isFile,
      isDirectory: () => isDir
    }
  }

  async access(path: string, mode?: number): Promise<void> {
    const exists = await this.exists(path)
    if (!exists) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`)
    }
  }
}

// Create the appropriate filesystem implementation
let fsImpl: UniversalFS

if (isBrowser()) {
  fsImpl = new BrowserFS()
} else if (isNode() && nodeFs) {
  fsImpl = new NodeFS()
} else {
  fsImpl = new MemoryFS()
}

// Export the filesystem operations
export const readFile = fsImpl.readFile.bind(fsImpl)
export const writeFile = fsImpl.writeFile.bind(fsImpl)
export const mkdir = fsImpl.mkdir.bind(fsImpl)
export const exists = fsImpl.exists.bind(fsImpl)
export const readdir = fsImpl.readdir.bind(fsImpl)
export const unlink = fsImpl.unlink.bind(fsImpl)
export const stat = fsImpl.stat.bind(fsImpl)
export const access = fsImpl.access.bind(fsImpl)

// Default export with promises namespace compatibility  
export default {
  readFile,
  writeFile,
  mkdir,
  exists,
  readdir,
  unlink,
  stat,
  access
}

// Named export for fs/promises compatibility
export const promises = {
  readFile,
  writeFile,
  mkdir,
  exists,
  readdir,
  unlink,
  stat,
  access
}