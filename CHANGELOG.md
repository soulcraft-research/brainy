# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed
- Unified getNouns and getVerbs methods to improve code consistency
- Removed deprecated warnings from getAllNouns, getAllVerbs, getVerbsBySource, getVerbsByTarget, and getVerbsByType
- Implemented getAllNouns and getAllVerbs to use the paginated versions internally
- Improved method documentation with clearer parameter and return type descriptions

### Fixed

## [0.26.0] - 2025-07-30

### Added
- Organized documentation structure with docs/ directory
- Proper CHANGELOG.md for release management
- Statistics optimizations implemented across all storage adapters
- In-memory caching of statistics data
- Batched updates with adaptive flush timing
- Time-based partitioning for statistics files
- Error handling and retry mechanisms for statistics operations

### Changed
- Moved technical documentation to docs/technical/
- Moved development documentation to docs/development/
- Moved guides to docs/guides/
- Archived temporary documentation files
- Refactored BaseStorageAdapter to include shared optimizations
- Updated FileSystemStorage, MemoryStorage, and OPFSStorage with new statistics handling
- Improved performance through reduced storage operations
- Enhanced scalability with time-based partitioning

### Fixed
- Fixed FileSystemStorage constructor path operations issue where path module was used before being fully loaded
- Deferred path operations to init() method when path module is guaranteed to be available
- Resolved "Cannot read properties of undefined (reading 'join')" error

### Technical Details
- Added `scheduleBatchUpdate()` and `flushStatistics()` methods to BaseStorageAdapter
- Updated core statistics methods: `saveStatistics()`, `getStatistics()`, `incrementStatistic()`, `decrementStatistic()`, and `updateHnswIndexSize()`
- Maintained backward compatibility with legacy statistics files
- Added fallback mechanisms for multiple storage locations

## [Previous Versions]

For detailed implementation notes and technical summaries of previous versions, see:
- `docs/technical/` - Technical documentation and analysis
- `archive/` - Archived change logs and summaries

---

## How to Update This Changelog

When making changes to the project:

1. Add new entries under `[Unreleased]` section
2. Use the following categories:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for vulnerability fixes

3. When releasing a new version:
   - Move unreleased changes to a new version section
   - Update the version number and date
   - Create a new empty `[Unreleased]` section

4. Link to GitHub releases: `[0.26.0] - 2025-07-28` format
5. Keep entries concise but informative for users
6. Include technical details in a separate subsection if needed
