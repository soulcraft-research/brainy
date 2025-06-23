/**
 * Type declarations for the File System Access API
 * Extends the FileSystemDirectoryHandle interface to include the [Symbol.asyncIterator] method
 */

// Extend the FileSystemDirectoryHandle interface
interface FileSystemDirectoryHandle {
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
  keys(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

// Export something to make this a module
export const fileSystemTypesLoaded = true;
