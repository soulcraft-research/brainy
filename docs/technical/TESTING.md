# Brainy Testing Guide

<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
</div>

This document provides comprehensive information about testing in the Brainy project, including test configuration, expected messages, reporting tools, and testing strategies.

## Table of Contents

- [Vitest Configuration](#vitest-configuration)
- [Test Scripts](#test-scripts)
- [Pretty Test Reporter](#pretty-test-reporter)
- [Expected Messages During Test Execution](#expected-messages-during-test-execution)
- [Storage Testing](#storage-testing)
- [Test Matrix](#test-matrix)
- [API Integration Test Troubleshooting](#api-integration-test-troubleshooting)
- [Testing Best Practices](#testing-best-practices)

## Vitest Configuration

The Vitest configuration has been updated to provide cleaner, more focused test output that shows only successes, failures, and a nice summary report at the end.

### Reporter Configuration

- Multiple reporters configured for different levels of detail:
  - Default reporter for basic progress and summary
  - JSON reporter for machine-readable output
  - Pretty reporter for visually appealing summaries

```javascript
reporters: [
  // Default reporter for basic progress and summary
  [
    'default',
    {
      summary: true,
      reportSummary: true,
      successfulTestOnly: false,
      outputFile: false
    }
  ],
  // JSON reporter for machine-readable output
  [
    'json',
    {
      outputFile: './test-results.json'
    }
  ]
]
```

### Output Settings

- Set `hideSkippedTests: true` to reduce noise from skipped tests
- Set `printConsoleTrace: false` to only show stack traces for failed tests
- Added output formatting options:
  ```javascript
  outputDiffLines: 5;      // Limit diff output lines for cleaner error reports
  outputFileMaxLines: 40;  // Limit file output lines for cleaner error reports
  outputTruncateLength: 80; // Truncate long output lines
  ```

### Console Output Filtering

Enhanced console output filtering to be more aggressive:

- Added a whitelist approach for stdout, only allowing specific test-related patterns
- Enhanced stderr filtering to only show actual errors
- Expanded the list of noise patterns to filter out common debug messages

### Recent Improvements

The Vitest configuration has been further enhanced to provide more detailed reporting and better console output suppression:

1. **Multiple Reporters**
   - Default reporter for basic progress and summary
   - Verbose reporter for detailed information about failures
   - JSON reporter for machine-readable output

2. **Enhanced Console Output Suppression**
   - Added a whitelist approach for stdout, only allowing specific test-related patterns
   - Enhanced stderr filtering to only show actual errors
   - Expanded the list of noise patterns to filter out common debug messages

3. **Fixed Duplicate Summary Output**
   - The test output was showing duplicate summary information at the end of test runs
   - Fixed by simplifying the reporters configuration to use only the necessary reporters
   - Removed the verbose reporter which was causing duplicate summary output

## Test Scripts

Brainy provides several test scripts for different testing scenarios:

```bash
# Run all tests
npm test

# Run tests with comprehensive reporting
npm run test:report

# Run tests in watch mode
npm test:watch

# Run tests with UI
npm test:ui

# Run specific test suites
npm run test:node
npm run test:browser
npm run test:core

# Run tests with coverage
npm run test:coverage

# Detailed report with verbose output
npm run test:report:detailed

# Generate JSON report for machine processing
npm run test:report:json

# Run tests in silent mode (minimal output)
npm run test:silent

# Show only progress and errors
npm run test:progress-only

# Run tests with pretty reporter
npm run test:report:pretty
```

## Pretty Test Reporter

The Pretty Test Reporter provides a visually appealing summary of test results with colors, symbols, and formatted output. It enhances the standard Vitest output with a clear, easy-to-read summary at the end of test runs.

### Features

- 🎨 **Colorful Output**: Uses colors to distinguish between passed, failed, and skipped tests
- 📊 **Tabular Format**: Displays test results in a clean, tabular format
- 📝 **Detailed Summary**: Shows overall test statistics and file-by-file breakdown
- ❌ **Error Reporting**: Clearly lists any failed tests with their error messages
- ⏱️ **Timing Information**: Displays test duration in a human-readable format

### Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Run Completed in: 7.9s
Date: 7/28/2025, 11:22:54 AM
Total Test Files: 1
Total Tests: 19

Results:
  ✓ Passed: 19
  ✗ Failed: 0
  ○ Skipped: 0

Test Files:
┌──────────────────────────────────────────────────┬──────────┬──────────┬──────────┐
│ File                                              │ Passed    │ Failed    │ Skipped   │
├──────────────────────────────────────────────────┼──────────┼──────────┼──────────┤
│ core.test.ts                                      │ 19        │ 0         │ 0         │
└──────────────────────────────────────────────────┴──────────┴──────────┴──────────┘

 PASSED  All tests passed successfully!
```

### Implementation Details

The pretty reporter is implemented as a custom Vitest reporter in `src/testing/prettySummaryReporter.ts`. It:

1. Collects test information during the test run
2. Tracks passed, failed, and skipped tests
3. Organizes results by test file
4. Generates a formatted summary at the end of the test run

### Usage

To run tests with the pretty reporter, use the following npm script:

```bash
npm run test:report:pretty
```

You can also specify specific test files:

```bash
npm run test:report:pretty -- tests/core.test.ts
```

### Customization

If you need to modify the reporter's appearance or behavior, you can edit the `prettySummaryReporter.ts` file. The main visual elements are in the `printSummary` method.

## Expected Messages During Test Execution

This section explains the various messages and errors that appear during test execution and why they are expected.

### Fixed Issues

#### Duplicate Summary Output
- **Issue**: Previously, test summaries were appearing twice at the end of test runs
- **Fix**: Removed the verbose reporter from the configuration, keeping only the default and JSON reporters
- **Status**: Resolved

### Expected Error Messages

The following error messages appear during test runs and are expected as part of the test suite:

#### S3 Storage Tests
- **Error**: `[MOCK S3] Error processing command: Error: NoSuchKey: The specified key does not exist.`
- **Source**: `tests/s3-storage.test.ts`
- **Explanation**: This error is expected and is part of the test for the S3 storage adapter. The test intentionally deletes a noun and then tries to retrieve it to verify it was properly deleted.

#### Dimension Mismatch Errors
- **Error**: `Failed to add vector: Error: Vector dimension mismatch: expected 512, got X`
- **Source**: `tests/dimension-standardization.test.ts` and `tests/core.test.ts`
- **Explanation**: These tests specifically verify that the system correctly rejects vectors with incorrect dimensions. The error messages confirm that the validation is working as expected.

#### API Integration Test Failure
- **Error**: `expected 500 to be 200 // Object.is equality`
- **Source**: `tests/api-integration.test.ts`
- **Explanation**: This appears to be an actual test failure that should be investigated separately. The test expects a 200 status code but is receiving a 500 error.

### Conclusion

Most of the error messages seen during test execution are expected and are part of testing error handling paths. These messages confirm that the system is correctly handling error conditions as designed.

## Storage Testing

This section describes the testing approach for the storage system in Brainy, including the different storage types and the environment detection logic that determines which type is used.

### Storage Architecture

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

### Test Coverage

The storage system is now tested with the following test cases:

#### Storage Adapters

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

#### Environment Detection

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

### Mock Implementations for Testing

To facilitate testing of storage adapters in different environments, we've created mock implementations for both OPFS and S3 compatible storage:

#### OPFS Mock

The OPFS (Origin Private File System) mock implementation provides a simulated file system environment for testing OPFS storage in a Node.js environment without requiring actual browser APIs. It's located in `/tests/mocks/opfs-mock.ts` and includes:

- A mock file system using Maps to store directories and files
- Mock implementations of FileSystemDirectoryHandle and FileSystemFileHandle
- Functions to set up and clean up the mock environment
- Support for all OPFS operations used by the OPFSStorage adapter

#### S3 Mock

The S3 compatible storage mock implementation provides a simulated S3 bucket environment for testing S3 compatible storage in a Node.js environment without requiring actual S3 credentials. It's located in `/tests/mocks/s3-mock.ts` and includes:

- A mock S3 storage using Maps to store buckets and objects
- Mock implementations of S3 commands (CreateBucketCommand, PutObjectCommand, etc.)
- Functions to set up and clean up the mock environment
- Support for basic S3 operations used by the S3CompatibleStorage adapter

### Running the Tests

The storage tests can be run with:

```bash
# Run all storage tests
npx vitest run tests/storage-adapters.test.ts

# Run OPFS storage tests
npx vitest run tests/opfs-storage.test.ts

# Run S3 storage tests
npx vitest run tests/s3-storage.test.ts
```

### Future Improvements

1. **Increase Test Coverage**: Add more tests for specific methods of each storage adapter
2. **Improve OPFS Testing**: Continue to enhance the OPFS mock implementation to better simulate browser environments
3. **Enhance S3 Testing**: Improve the S3 mock implementation to fully support all operations used by the S3CompatibleStorage adapter
4. **Integration Tests**: Add integration tests that test the storage system with real data
5. **Browser Environment Testing**: Add tests that run in actual browser environments for OPFS storage
6. **Real S3 Testing**: Add optional tests that can run against real S3 compatible services when credentials are provided

## Test Matrix

This section outlines a comprehensive testing strategy for the Brainy vector database, ensuring all functionality works correctly across different environments and configurations.

### Test Dimensions

The test matrix covers the following dimensions:

1. **Public Methods**: All public methods of the BrainyData class
2. **Storage Adapters**: All supported storage types
3. **Environments**: All supported runtime environments
4. **Test Types**: Happy path, error handling, edge cases, performance

### Storage Adapters

- Memory Storage
- File System Storage
- OPFS (Origin Private File System) Storage
- S3-Compatible Storage (including R2)

### Environments

- Node.js
- Browser
- Web Worker
- Worker Threads

### Test Types

- **Happy Path**: Tests with valid inputs and expected behavior
- **Error Handling**: Tests with invalid inputs, error conditions
- **Edge Cases**: Tests with boundary values, empty inputs, etc.
- **Performance**: Tests measuring execution time with various dataset sizes

### Core Method Test Matrix

| Method | Memory | FileSystem | OPFS | S3 | Error Handling | Edge Cases | Performance |
|--------|--------|------------|------|----|--------------------|------------|-------------|
| init() | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| add() | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ |
| addBatch() | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| search() | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ |
| searchText() | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| get() | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| delete() | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| updateMetadata() | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| relate() | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| findSimilar() | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| clear() | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| isReadOnly()/setReadOnly() | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| getStatistics() | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| backup()/restore() | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |

Legend:
- ✅ Well tested
- ⚠️ Partially tested
- ❌ Not tested

### Environment Test Matrix

| Environment | Memory | FileSystem | OPFS | S3 |
|-------------|--------|------------|------|-----|
| Node.js | ✅ | ✅ | N/A | ⚠️ |
| Browser | ⚠️ | N/A | ⚠️ | ❌ |
| Web Worker | ❌ | N/A | ❌ | ❌ |
| Worker Threads | ❌ | ⚠️ | N/A | ❌ |

### Testing Gaps to Address

1. **Error handling scenarios** for each method
   - Invalid inputs
   - Network failures
   - Storage failures
   - Concurrent operation conflicts

2. **Edge cases**
   - Empty queries
   - Invalid IDs
   - Maximum size datasets
   - Zero-length vectors
   - Dimension mismatches

3. **Different storage adapters**
   - Complete OPFS testing
   - Complete S3 testing
   - Test adapter switching/fallback

4. **Multi-environment behavior**
   - Browser-specific tests
   - Web Worker tests
   - Worker Threads tests

5. **Read-only mode enforcement**
   - Test all write operations in read-only mode

6. **Relationship operations**
   - Complete testing for relate()
   - Complete testing for findSimilar()

7. **Metadata handling**
   - Test metadata in add/relate operations
   - Test updateMetadata edge cases

8. **Large dataset operations**
   - Performance with 10k+ vectors
   - Memory usage optimization

9. **Concurrent operations**
   - Thread safety
   - Race condition handling

10. **Statistics and monitoring**
    - Accuracy of statistics
    - Performance impact of statistics tracking

### Implementation Plan

1. Create error handling tests for core methods
2. Create edge case tests for core methods
3. Complete storage adapter tests for OPFS and S3
4. Create environment-specific test suites
5. Implement read-only mode tests
6. Complete relationship operation tests
7. Create metadata handling tests
8. Implement performance tests with various dataset sizes
9. Create concurrent operation tests
10. Complete statistics and monitoring tests

## API Integration Test Troubleshooting

This section describes a specific issue with the API integration test and how it was resolved.

### Issue Summary
The API integration test was failing because it was trying to insert data into Brainy and then search for it, but the data wasn't being properly embedded/vectorized or wasn't being found in the search results.

### Key Changes That Fixed the Issue

#### Test Modifications
1. Removed the explicit `dimensions: 512` parameter from BrainyData initialization
   - This allows it to use the default dimensions that match the embedding model

2. Changed from using `addItem()` to using `add()` with `forceEmbed: true`
   - This ensures proper embedding of the text data

3. Increased the wait time for indexing from 500ms to 2000ms
   - Gives the HNSW index more time to update before searching

4. Added more detailed logging to help diagnose issues

#### Embedding Functionality Improvements
1. Fixed how the Universal Sentence Encoder is loaded
   - Now ensures it uses the bundled model from the package

2. Improved type handling for TextDecoder to avoid potential compatibility issues

### Why It Works Now
The test is now passing because:
1. The data is being properly embedded through the `add()` method with forced embedding
2. The system has enough time to index the data before searching for it
3. The embedding model is being loaded correctly without dimension mismatches

These changes ensure that when data is inserted into Brainy, it's properly embedded and vectorized, and then can be successfully retrieved through semantic search without needing to run in Express or any other server environment.

## Testing Best Practices

When developing and debugging Brainy, follow these testing guidelines:

1. **Use Proper Test Files**: All tests should be written as vitest test files in the `tests/` directory with `.test.ts` or `.spec.ts` extensions.

2. **Avoid Temporary Debug Files**: Do not create temporary debug files like `debug_test.js`, `reproduce_issue.js`, or similar files in the root directory. These files:
   - Clutter the repository
   - Are excluded by vitest configuration but remain in the codebase
   - Often duplicate functionality already covered by proper tests

3. **Debugging Approach**: When debugging issues:
   - Add temporary test cases to existing test files in the `tests/` directory
   - Use `it.only()` or `describe.only()` to focus on specific tests during debugging
   - Remove or convert temporary test cases to permanent tests before committing
   - Use the existing test setup and utilities in `tests/setup.ts`

4. **Test Organization**: 
   - Core functionality tests go in `tests/core.test.ts`
   - Environment-specific tests go in `tests/environment.*.test.ts`
   - Utility function tests go in `tests/vector-operations.test.ts`
   - New feature tests should follow the existing naming convention

5. **Cleanup**: Always clean up temporary files before committing. The vitest configuration already excludes `*.js` files in the root directory, but they should be deleted rather than left in the repository.

6. **Test Reporting**: Use the comprehensive test reporting feature when you need detailed information about test execution:
   - Run `npm run test:report` to get a verbose report of all tests
   - The report includes test names, execution time, and pass/fail status
   - This is especially useful for CI/CD pipelines and debugging test failures
