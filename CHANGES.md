# Brainy Changes Log

## 2025-07-25

### Changed

- **BREAKING CHANGE**: Standardized vector dimensions to 512 throughout the codebase. The `dimensions` configuration
  option has been removed from `BrainyDataConfig`. All vectors are now required to have exactly 512 dimensions, matching
  the Universal Sentence Encoder's output. This change ensures consistency between data insertion, storage, and search
  operations, eliminating potential dimension mismatch issues. See `VECTOR_DIMENSION_STANDARDIZATION.md` for details and
  migration instructions.
- Updated all tests to expect 512 dimensions and use 512-dimensional test vectors. This includes tests in core.test.ts,
  vector-operations.test.ts, environment.browser.test.ts, environment.node.test.ts, and statistics.test.ts.

## 2025-07-23

### Fixed

- Fixed an issue in the web service where tests were failing with "Cannot read properties of undefined (reading 'join')"
  error. The problem was a race condition in the FileSystemStorage constructor, where the path module was being used
  before it was fully loaded. The fix ensures that the path module is properly imported and initialized before creating
  the FileSystemStorage instance.

## Previous Changes

(Previous changes would be listed here)