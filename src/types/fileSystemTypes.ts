/**
 * Type declarations for the File System Access API
 * Extends the FileSystemDirectoryHandle interface to include the [Symbol.asyncIterator] method
 * and FileSystemHandle to include getFile() method for TypeScript compatibility
 */

// Extend the FileSystemDirectoryHandle interface
interface FileSystemDirectoryHandle {
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;

    keys(): AsyncIterableIterator<string>;

    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

// Extend the FileSystemHandle interface to include getFile method
// This is needed because TypeScript doesn't recognize that a FileSystemHandle
// can be a FileSystemFileHandle which has the getFile method
interface FileSystemHandle {
    getFile?(): Promise<File>;
}

// Export something to make this a module
export const fileSystemTypesLoaded = true
