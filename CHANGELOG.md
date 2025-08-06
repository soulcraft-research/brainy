# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.46.0](https://github.com/soulcraft-research/brainy/compare/v0.45.0...v0.46.0) (2025-08-06)


### Fixed

* improve local model loading with USE-lite tokenizer support ([5eaf306](https://github.com/soulcraft-research/brainy/commit/5eaf306e76743096d1ad959e5459e0c8a886db57))


### Added

* add brainy-models-package v0.8.0 with USE-lite model ([334b469](https://github.com/soulcraft-research/brainy/commit/334b46927b8c867a751da2a536017ab09f187161))


### Changed

* add models-download to gitignore ([6e31a3c](https://github.com/soulcraft-research/brainy/commit/6e31a3c4d4d7d2bc2953b940588fc68f433530b7))

## [0.45.0](https://github.com/soulcraft-research/brainy/compare/v0.44.0...v0.45.0) (2025-08-06)


### Fixed

* improve model loading reliability with better error handling and updated fallback URLs ([933f305](https://github.com/soulcraft-research/brainy/commit/933f30543784458f340c9b867263bc4cec6e7973))

## [0.44.0](https://github.com/soulcraft-research/brainy/compare/v0.43.0...v0.44.0) (2025-08-05)


### Fixed

* include all JavaScript modules in npm package ([b37debb](https://github.com/soulcraft-research/brainy/commit/b37debb33c45e8ca50c70434bfdc5ae75c7c7797))

## [0.43.0](https://github.com/soulcraft-research/brainy/compare/v0.41.0...v0.43.0) (2025-08-05)


### ⚠ BREAKING CHANGES

* Models are no longer bundled with the package. They are now loaded dynamically from CDN or custom paths.

### Added

* **package:** add initial package.json for test consumer setup ([f50e220](https://github.com/soulcraft-research/brainy/commit/f50e220263a7bdfa050fcb265e244a097f7a0088))
* **reliability:** implement automatic offline model detection for production ([042a545](https://github.com/soulcraft-research/brainy/commit/042a5454a27e7d023fb97a363f51f10d537d02d5))
* **test:** add test script for BrainyData functionality ([b7859e4](https://github.com/soulcraft-research/brainy/commit/b7859e4ab7e5680b801323c9eea90d088ad5c967))


### Documentation

* **readme:** add security and enterprise benefits for offline models ([5b022cf](https://github.com/soulcraft-research/brainy/commit/5b022cf4c97228f79500a4e0c7086f7e73d869dd))
* **readme:** improve user engagement flow and add advanced features ([2acd2e0](https://github.com/soulcraft-research/brainy/commit/2acd2e08331b75d4bee703918ba25b6c352d3542))


### Changed

* clean up deprecated functions and unused code ([0214168](https://github.com/soulcraft-research/brainy/commit/02141682804ab36efa56b4fbdbfad72cda2a8d43))
* clean up project for release ([d429a62](https://github.com/soulcraft-research/brainy/commit/d429a623e3af53d041306734e332608e3f23a8c1))
* **gitignore:** add node_modules directory for test consumer to .gitignore ([45eef34](https://github.com/soulcraft-research/brainy/commit/45eef34067a1667b6891ba63c231a428ba5e7daf))
* **gitignore:** ignore npm package artifacts ([6ed3ac5](https://github.com/soulcraft-research/brainy/commit/6ed3ac56fe94d4ab92e1ba2fc829769fbdf4e668))
* **release:** 1.0.0 ([53edf16](https://github.com/soulcraft-research/brainy/commit/53edf16166f45b3be80c1aab48f9c3be3916ed9d))
* simplify build system and improve model loading flexibility ([3d4c759](https://github.com/soulcraft-research/brainy/commit/3d4c7596938316d1046e9bf7eb97f1e2ec712523))

## [0.41.0](https://github.com/soulcraft-research/brainy/compare/v0.40.0...v0.41.0) (2025-08-05)


### Added

* **tools:** update feature description for clarity ([5e15dab](https://github.com/soulcraft-research/brainy/commit/5e15dabb54e9e5616cf49b759222a24734c58fbc))


### Fixed

* **security:** resolve critical vulnerability in form-data dependency ([8450af5](https://github.com/soulcraft-research/brainy/commit/8450af5d9289391dd516d23779fb675ae81bf5f6))
* **storage:** resolve pagination warnings and improve S3 adapter performance ([d7a1c1b](https://github.com/soulcraft-research/brainy/commit/d7a1c1bd27257522e0986e2e882eb169bc7e1d14))

## [0.40.0](https://github.com/soulcraft-research/brainy/compare/v0.39.0...v0.40.0) (2025-08-05)


### Fixed

* **core:** resolve TypeScript compilation errors and test failures ([67db734](https://github.com/soulcraft-research/brainy/commit/67db73461124c33bb6fc11cb5f8daf3ddbfd9f09))

## [0.39.0](https://github.com/soulcraft-research/brainy/compare/v0.38.0...v0.39.0) (2025-08-04)


### Added

* **pagination:** implement cursor-based pagination and enhance search caching ([0f538f3](https://github.com/soulcraft-research/brainy/commit/0f538f39ba7897d2efb0fadd39fc7218b1bbe72d))


### Documentation

* add comprehensive performance docs and rebrand to Zero-to-Smart™ ([80ca8e3](https://github.com/soulcraft-research/brainy/commit/80ca8e35d257723853d0f9d6c95f49937b71aceb))

## [0.38.0](https://github.com/soulcraft-research/brainy/compare/v0.37.0...v0.38.0) (2025-08-04)


### Documentation

* add distributed deployment architecture and enhancement proposals ([4bb7a9f](https://github.com/soulcraft-research/brainy/commit/4bb7a9f431edaf85e782144057d77b4b20b16b44))
* add revised distributed implementation plan with practical phases ([e3978e5](https://github.com/soulcraft-research/brainy/commit/e3978e570dcee9b9c7757e75d3fe2c2f55cd99e4))
* streamline README for better readability and user engagement ([2492fe4](https://github.com/soulcraft-research/brainy/commit/2492fe4f30099dc1b9f9cf0e435b83d5ffc34dce))


### Added

* **distributed:** add distributed mode with multi-instance coordination ([8e4b0ef](https://github.com/soulcraft-research/brainy/commit/8e4b0ef7d8b9c3a4de2b776adc25da3c0a7fc971))
* **docs:** add S3 migration guide for optimized data transfer strategies ([7b4c779](https://github.com/soulcraft-research/brainy/commit/7b4c7794f3a587e2038452ab0d2c908272cf9556))
* **safety:** enhance claude-commit with mandatory review and safety features ([c20cc39](https://github.com/soulcraft-research/brainy/commit/c20cc392620ebded69732c62a07295dc212de001))
* **tools:** add claude-commit AI-powered git commit tool ([d05e320](https://github.com/soulcraft-research/brainy/commit/d05e320a52486c5b5620869940df5b7330fa1067))
* **tools:** propagate safety features to all projects ([8854b37](https://github.com/soulcraft-research/brainy/commit/8854b3735fac75e695e76ec62edde2160c065f55))

## [0.37.0](https://github.com/soulcraft-research/brainy/compare/v0.36.0...v0.37.0) (2025-08-04)


### Fixed

* **build:** resolve TypeScript compilation errors in optimization modules ([0e2bce1](https://github.com/soulcraft-research/brainy/commit/0e2bce19251f7ea5008695f058272ca4271805f8))
* **types:** add explicit ArrayBuffer type assertions for compression ([7196fe2](https://github.com/soulcraft-research/brainy/commit/7196fe2d6b756a4e9401cf87585db688145e46fe))
* **types:** resolve remaining ArrayBuffer type issues in compression methods ([eb8c95e](https://github.com/soulcraft-research/brainy/commit/eb8c95ef3720afa52acc45af2c3dcc896d67decc))


### Added

* **auto-configuration:** implement automatic configuration system for optimal settings ([aa64f49](https://github.com/soulcraft-research/brainy/commit/aa64f490cbad98bc6c95c1f212b8f049d41aa32f))
* **docs:** add comprehensive user guides and installation instructions for Brainy ([d4dafbf](https://github.com/soulcraft-research/brainy/commit/d4dafbf598a49c7b1b005f7773f14b47fe65bffa))
* **docs:** update README and add large-scale optimizations guide for v0.36.0 ([ae01bea](https://github.com/soulcraft-research/brainy/commit/ae01bea1aa5d7f3a042f67fa6123c17e59310d68))
* **hnsw:** implement comprehensive large-scale search optimizations ([c39eee6](https://github.com/soulcraft-research/brainy/commit/c39eee624d40c4ee4d5112c26283c17b133dc3e1))
* **partitioning:** simplify partition strategies and enable auto-tuning of semantic clusters ([1015c33](https://github.com/soulcraft-research/brainy/commit/1015c33004c248dd45fdb9c37edc6b15ad95a5f8))

## [0.36.0](https://github.com/soulcraft-research/brainy/compare/v0.35.0...v0.36.0) (2025-08-03)


### Changed

* add CLAUDE.md to .gitignore ([4c0b920](https://github.com/soulcraft-research/brainy/commit/4c0b9200c5304cb5bb4c888bf057927095012c55))


### Documentation

* add guidelines for Conventional Commit format and structured commit messages ([f9a8595](https://github.com/soulcraft-research/brainy/commit/f9a859587802dfd294b2eaeefcf251f75a460db4))


### Added

* add verb and noun metadata handling in storage adapters ([9778f1b](https://github.com/soulcraft-research/brainy/commit/9778f1bbf46de06bb71d87333f3861210558024e))
* refactor verb storage to use HNSWVerb for improved performance ([75ccf0f](https://github.com/soulcraft-research/brainy/commit/75ccf0f7472f94cc7a76a9b64b377fb7bdc02624))

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
