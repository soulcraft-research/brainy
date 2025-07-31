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

This project now uses [standard-version](https://github.com/conventional-changelog/standard-version) to automatically generate the changelog from commit messages.

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for your commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Where `<type>` is one of:
- `feat`: A new feature (maps to **Added** section)
- `fix`: A bug fix (maps to **Fixed** section)
- `chore`: Regular maintenance tasks (maps to **Changed** section)
- `docs`: Documentation changes (maps to **Documentation** section)
- `refactor`: Code changes that neither fix bugs nor add features (maps to **Changed** section)
- `perf`: Performance improvements (maps to **Changed** section)

### Examples:

```
feat(storage): add new file system adapter
fix(hnsw): resolve index corruption on large datasets
docs(readme): update installation instructions
refactor(core): simplify graph traversal algorithm
```

### Releasing a New Version

To release a new version:
1. Ensure all changes are committed
2. Run one of:
   - `npm run release` (for patch version)
   - `npm run release:patch` (same as above)
   - `npm run release:minor` (for minor version)
   - `npm run release:major` (for major version)
3. Push changes with tags: `git push --follow-tags origin main`

The changelog will be automatically updated based on your commit messages.
