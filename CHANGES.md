# Changes

## 2025-07-28

### Bug Fixes

- Fixed an issue in FileSystemStorage constructor where path operations were performed before the path module was fully loaded. The fix defers path operations until the init() method is called, when the path module is guaranteed to be loaded.

### Details

The issue was in the FileSystemStorage constructor where it was using the path module synchronously:

```typescript
constructor(rootDirectory: string) {
  super()
  this.rootDir = rootDirectory
  this.nounsDir = path.join(this.rootDir, NOUNS_DIR)  // Error here - path could be undefined
  this.verbsDir = path.join(this.rootDir, VERBS_DIR)
  this.metadataDir = path.join(this.rootDir, METADATA_DIR)
  this.indexDir = path.join(this.rootDir, INDEX_DIR)
}
```

However, the path module was being loaded asynchronously via dynamic imports:

```typescript
try {
  // Using dynamic imports to avoid issues in browser environments
  const fsPromise = import('fs')
  const pathPromise = import('path')

  Promise.all([fsPromise, pathPromise]).then(([fsModule, pathModule]) => {
    fs = fsModule
    path = pathModule.default
  }).catch(error => {
    console.error('Failed to load Node.js modules:', error)
  })
} catch (error) {
  console.error(
    'FileSystemStorage: Failed to load Node.js modules. This adapter is not supported in this environment.',
    error
  )
}
```

The fix:
1. Modified the constructor to only store the rootDirectory and defer path operations
2. Updated the init() method to initialize directory paths when the path module is guaranteed to be loaded

This ensures that path operations are only performed when the path module is available, preventing the "Cannot read properties of undefined (reading 'join')" error.
