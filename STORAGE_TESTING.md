# Storage Testing in Brainy

This document describes the testing approach for the storage system in Brainy, including the different storage types and the environment detection logic that determines which type is used.

## Storage Architecture

Brainy supports multiple storage types:

1. **MemoryStorage**: In-memory storage for temporary data
2. **FileSystemStorage**: File system storage for Node.js environments
3. **OPFSStorage**: Origin Private File System storage for browser environments
4. **S3CompatibleStorage**: Storage for Amazon S3, Google Cloud Storage, and custom S3-compatible services
5. **R2Storage**: Storage for Cloudflare R2 (an alias for S3CompatibleStorage)

The storage type is determined by the `createStorage` function in `src/storage/storageFactory.ts`, which uses the following logic:

1. If `forceMemoryStorage` is true, use MemoryStorage
2. If `forceFileSystemStorage` is true, use FileSystemStorage
3. If a specific storage type is specified, use that type
4. Otherwise, auto-detect the best storage type based on the environment:
   - In a browser environment, try OPFS first
   - In a Node.js environment, use FileSystemStorage
   - Fall back to MemoryStorage if neither is available

## Test Coverage

The storage system is now tested with the following test cases:

### Storage Adapters

- **MemoryStorage**
  - Creating and initializing MemoryStorage
  - Basic operations (saving and retrieving metadata)

- **FileSystemStorage**
  - Creating and initializing FileSystemStorage in Node.js environment
  - Basic operations (saving and retrieving metadata)
  - Handling file system operations correctly

- **OPFSStorage**
  - Detecting OPFS availability correctly
  - (Note: Complex OPFS operations are skipped due to the difficulty of mocking the OPFS API)

- **S3CompatibleStorage and R2Storage**
  - Basic structure for testing is provided but skipped by default as they require actual credentials
  - These tests serve as documentation for how to test these storage types if needed

### Environment Detection

- **Forced Storage Types**
  - Selecting MemoryStorage when forceMemoryStorage is true
  - Selecting FileSystemStorage when forceFileSystemStorage is true

- **Specific Storage Types**
  - Selecting MemoryStorage when type is memory
  - Selecting FileSystemStorage when type is filesystem

- **Auto-detection**
  - Selecting FileSystemStorage in Node.js environment
  - Selecting OPFS in browser environment if available
  - Falling back to MemoryStorage when OPFS is not available in browser

## Running the Tests

The storage tests can be run with:

```bash
npx vitest run tests/storage-adapters.test.ts
```

## Future Improvements

1. **Increase Test Coverage**: Add more tests for specific methods of each storage adapter
2. **Improve OPFS Testing**: Develop better mocking for the OPFS API to test operations in browser environments
3. **Add S3 Testing**: Add tests for S3CompatibleStorage and R2Storage using mock S3 services
4. **Integration Tests**: Add integration tests that test the storage system with real data

## Conclusion

The storage system in Brainy now has test coverage for the different storage types and the environment detection logic that determines which type is used. This ensures that the storage system works correctly in different environments and with different configurations.