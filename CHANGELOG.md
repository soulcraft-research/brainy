# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.35.0](https://github.com/soulcraft-research/brainy/compare/v0.34.0...v0.35.0) (2025-08-02)

## [0.34.0](https://github.com/soulcraft-research/brainy/compare/v0.1.0...v0.34.0) (2025-08-02)


### Changed

* **release:** 0.2.0 [skip ci] ([c9ca141](https://github.com/soulcraft-research/brainy/commit/c9ca14146ba5376812823185e55fc8b38be3785c))
* **release:** 0.3.0 [skip ci] ([437360c](https://github.com/soulcraft-research/brainy/commit/437360c2570632204cf951001aa7a0228479255d))
* **release:** 0.4.0 [skip ci] ([be3a108](https://github.com/soulcraft-research/brainy/commit/be3a108971f0407dd526e355bd9b8e6083575f50))
* **release:** 0.5.0 ([a05ebb5](https://github.com/soulcraft-research/brainy/commit/a05ebb5ef44084974d544e84b67f37b1ac26a1de))
* **release:** 0.6.0 ([26cb41a](https://github.com/soulcraft-research/brainy/commit/26cb41ae9459555ec1f16d672f514d0dd2f41a85))
* **release:** 0.7.0 ([153abe8](https://github.com/soulcraft-research/brainy/commit/153abe8fcda1559f7ee796184e4d5e4f3c2fc833))

## [0.33.0](https://github.com/soulcraft-research/brainy/compare/v0.32.0...v0.33.0) (2025-08-01)

## [0.32.0](https://github.com/soulcraft-research/brainy/compare/v0.31.0...v0.32.0) (2025-08-01)

## [0.31.0](https://github.com/soulcraft-research/brainy/compare/v0.30.0...v0.31.0) (2025-07-31)

## [0.30.0](https://github.com/soulcraft-research/brainy/compare/v0.29.0...v0.30.0) (2025-07-31)

## [0.29.0](https://github.com/soulcraft-research/brainy/compare/v0.28.0...v0.29.0) (2025-07-31)

## [0.28.0](https://github.com/soulcraft-research/brainy/compare/v0.27.1...v0.28.0) (2025-07-31)

### [0.27.1](https://github.com/soulcraft-research/brainy/compare/v0.27.0...v0.27.1) (2025-07-31)


### Changed

* **changelog:** remove manual changelog update script ([72a649e](https://github.com/soulcraft-research/brainy/commit/72a649e174e7ada6ec7fee8c046bf233835cd8d8))
* **versioning:** switch to standard-version for automated changelog generation ([1f6a70d](https://github.com/soulcraft-research/brainy/commit/1f6a70dbc52547aafe5761d9e03878d485c1ec26))

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
