# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/soulcraft-research/brainy/compare/brainy-models-v0.7.0...brainy-models-v1.0.0) (2025-08-05)


### Features

* add verb and noun metadata handling in storage adapters ([9778f1b](https://github.com/soulcraft-research/brainy/commit/9778f1bbf46de06bb71d87333f3861210558024e))
* **auto-configuration:** implement automatic configuration system for optimal settings ([aa64f49](https://github.com/soulcraft-research/brainy/commit/aa64f490cbad98bc6c95c1f212b8f049d41aa32f))
* **distributed:** add distributed mode with multi-instance coordination ([8e4b0ef](https://github.com/soulcraft-research/brainy/commit/8e4b0ef7d8b9c3a4de2b776adc25da3c0a7fc971))
* **docs:** add comprehensive user guides and installation instructions for Brainy ([d4dafbf](https://github.com/soulcraft-research/brainy/commit/d4dafbf598a49c7b1b005f7773f14b47fe65bffa))
* **docs:** add S3 migration guide for optimized data transfer strategies ([7b4c779](https://github.com/soulcraft-research/brainy/commit/7b4c7794f3a587e2038452ab0d2c908272cf9556))
* **docs:** update README and add large-scale optimizations guide for v0.36.0 ([ae01bea](https://github.com/soulcraft-research/brainy/commit/ae01bea1aa5d7f3a042f67fa6123c17e59310d68))
* **hnsw:** implement comprehensive large-scale search optimizations ([c39eee6](https://github.com/soulcraft-research/brainy/commit/c39eee624d40c4ee4d5112c26283c17b133dc3e1))
* **pagination:** implement cursor-based pagination and enhance search caching ([0f538f3](https://github.com/soulcraft-research/brainy/commit/0f538f39ba7897d2efb0fadd39fc7218b1bbe72d))
* **partitioning:** simplify partition strategies and enable auto-tuning of semantic clusters ([1015c33](https://github.com/soulcraft-research/brainy/commit/1015c33004c248dd45fdb9c37edc6b15ad95a5f8))
* refactor verb storage to use HNSWVerb for improved performance ([75ccf0f](https://github.com/soulcraft-research/brainy/commit/75ccf0f7472f94cc7a76a9b64b377fb7bdc02624))
* **safety:** enhance claude-commit with mandatory review and safety features ([c20cc39](https://github.com/soulcraft-research/brainy/commit/c20cc392620ebded69732c62a07295dc212de001))
* **tools:** add claude-commit AI-powered git commit tool ([d05e320](https://github.com/soulcraft-research/brainy/commit/d05e320a52486c5b5620869940df5b7330fa1067))
* **tools:** propagate safety features to all projects ([8854b37](https://github.com/soulcraft-research/brainy/commit/8854b3735fac75e695e76ec62edde2160c065f55))
* **tools:** update feature description for clarity ([5e15dab](https://github.com/soulcraft-research/brainy/commit/5e15dabb54e9e5616cf49b759222a24734c58fbc))


### Bug Fixes

* **build:** resolve TypeScript compilation errors in optimization modules ([0e2bce1](https://github.com/soulcraft-research/brainy/commit/0e2bce19251f7ea5008695f058272ca4271805f8))
* **core:** resolve TypeScript compilation errors and test failures ([67db734](https://github.com/soulcraft-research/brainy/commit/67db73461124c33bb6fc11cb5f8daf3ddbfd9f09))
* **security:** resolve critical vulnerability in form-data dependency ([8450af5](https://github.com/soulcraft-research/brainy/commit/8450af5d9289391dd516d23779fb675ae81bf5f6))
* **storage:** resolve pagination warnings and improve S3 adapter performance ([d7a1c1b](https://github.com/soulcraft-research/brainy/commit/d7a1c1bd27257522e0986e2e882eb169bc7e1d14))
* **types:** add explicit ArrayBuffer type assertions for compression ([7196fe2](https://github.com/soulcraft-research/brainy/commit/7196fe2d6b756a4e9401cf87585db688145e46fe))
* **types:** resolve remaining ArrayBuffer type issues in compression methods ([eb8c95e](https://github.com/soulcraft-research/brainy/commit/eb8c95ef3720afa52acc45af2c3dcc896d67decc))


### Documentation

* add comprehensive performance docs and rebrand to Zero-to-Smart™ ([80ca8e3](https://github.com/soulcraft-research/brainy/commit/80ca8e35d257723853d0f9d6c95f49937b71aceb))
* add distributed deployment architecture and enhancement proposals ([4bb7a9f](https://github.com/soulcraft-research/brainy/commit/4bb7a9f431edaf85e782144057d77b4b20b16b44))
* add guidelines for Conventional Commit format and structured commit messages ([f9a8595](https://github.com/soulcraft-research/brainy/commit/f9a859587802dfd294b2eaeefcf251f75a460db4))
* add revised distributed implementation plan with practical phases ([e3978e5](https://github.com/soulcraft-research/brainy/commit/e3978e570dcee9b9c7757e75d3fe2c2f55cd99e4))
* streamline README for better readability and user engagement ([2492fe4](https://github.com/soulcraft-research/brainy/commit/2492fe4f30099dc1b9f9cf0e435b83d5ffc34dce))

## [0.7.0](https://github.com/soulcraft-research/brainy/compare/brainy-models-v0.6.0...brainy-models-v0.7.0) (2025-08-02)

## [0.6.0](https://github.com/soulcraft-research/brainy/compare/brainy-models-v0.5.0...brainy-models-v0.6.0) (2025-08-01)

## 0.5.0 (2025-08-01)


### Features

* **core, tests:** add standalone getStatistics function and improve storage configuration ([e5a9ede](https://github.com/soulcraft-research/brainy/commit/e5a9edea1b292e2b87d1ad043bb917f01f6366d9))
* **core:** enhance addVerb functionality with auto-creation of missing nouns ([a0c4d48](https://github.com/soulcraft-research/brainy/commit/a0c4d48b4aa0b8e236c18f1b7afdc2e54801a142))
* **demo, docs:** introduce threading test demos for browser and fallback, enhance threading documentation ([de627c5](https://github.com/soulcraft-research/brainy/commit/de627c5dfaff57a0abba6a4dc3b68bd52cb150e1))
* **demo/CNAME:** add CNAME files for domain configuration ([a681ab7](https://github.com/soulcraft-research/brainy/commit/a681ab7cdd08d318111977cecd2ae7ef7262a3da))
* **docs:** add WebSocket augmentation examples in README ([d7ff1b2](https://github.com/soulcraft-research/brainy/commit/d7ff1b2053779265521894d351a950f7903a5e64))
* **docs:** update README to highlight new consolidated storage structure ([fbfcaeb](https://github.com/soulcraft-research/brainy/commit/fbfcaeb8d097c58a3127e68e9a7c06421cf5f468))
* enhance `cli.ts` with updated typings and improved search interface ([4a23c97](https://github.com/soulcraft-research/brainy/commit/4a23c97d2a5f33a2d34f622014cf03e8350f8781))
* **README:** add GPU acceleration and detailed performance optimizations ([da1fe27](https://github.com/soulcraft-research/brainy/commit/da1fe27e25851233a2a49eaaeec1dac9f9882d59))
* reformat imports and exports for consistency and readability ([7de62f4](https://github.com/soulcraft-research/brainy/commit/7de62f4bbcdc91c88bb22e39e64c624219df8be4))
* **scripts, project:** add comprehensive code style enforcement script and update style-related workflows ([5052bbc](https://github.com/soulcraft-research/brainy/commit/5052bbc0b713f2294b3e15de43e696b575320ae0))
* **src/brainyData, src/utils:** enhance embedding efficiency with batch processing and initialize safeguards ([bba9a0c](https://github.com/soulcraft-research/brainy/commit/bba9a0c219c308f82821e46c44c49ef560ca2e39))
* **src/hnsw:** add GPU acceleration for distance calculations and improve fallback handling ([a2ad5fa](https://github.com/soulcraft-research/brainy/commit/a2ad5fabdfe8e5de545c2a07cef2f08a667ebf5e))
* **src/utils:** add GPU acceleration and improve threading for embeddings and distance calculations ([6a8d044](https://github.com/soulcraft-research/brainy/commit/6a8d044970b36976fc3ed5712d61bdbf774f7716))
* **storage:** implement base, file system, and memory storage adapters ([8c5f17b](https://github.com/soulcraft-research/brainy/commit/8c5f17b1d96a84f996ad62ec4b1e1e56893dfcbc))
* **tests:** add robust mock implementations and expand test coverage for S3 and OPFS storage ([f01a355](https://github.com/soulcraft-research/brainy/commit/f01a35598788b53a0294ecf9b91e47d166363846))
* **tests:** replace old test scripts with updated test suite for storage and reporting ([68680db](https://github.com/soulcraft-research/brainy/commit/68680db2c660b34d5b4e4ee86d163f7723d328a4))
* **types:** extend FileSystemHandle and optimize imports for consistency ([aff1483](https://github.com/soulcraft-research/brainy/commit/aff1483d4d84406039e301fa594889f99e19c9db))


### Bug Fixes

* handle optional `loggingConfig` in `getDefaultEmbeddingFunction` initialization ([d42596a](https://github.com/soulcraft-research/brainy/commit/d42596ad4730943cea60081ca71fea6ad2babd37))
* **package.json:** update TensorFlow dependencies for optimized backend usage ([e000661](https://github.com/soulcraft-research/brainy/commit/e00066119ebeb336e4564d38b4ef67d9bfbefeb6))
* prevent duplication of `ROOT_DIR` in file system storage initialization ([d495b95](https://github.com/soulcraft-research/brainy/commit/d495b95af836c124685f5cff8a59ed74a82b3dca))
* **README, src/utils:** bump version to 0.9.11 ([fe4de2f](https://github.com/soulcraft-research/brainy/commit/fe4de2f7a00b3f1ec1dd0edd2deb434d510096c2))
* **README:** correct formatting in custom domain configuration steps ([bba846a](https://github.com/soulcraft-research/brainy/commit/bba846ae230e86235b1321851eb06f298ca09170))
* **src/augmentationPipeline:** remove redundant semicolons and enforce consistent formatting ([47ba4f4](https://github.com/soulcraft-research/brainy/commit/47ba4f4093a8a3ecc8f7fa28638322d7ee4ae740))
* **src/augmentationPipeline:** remove unnecessary whitespace for formatting consistency ([99a8cbf](https://github.com/soulcraft-research/brainy/commit/99a8cbfe2c036a29076f1ebaf4e92b320a0cf427))
* **src/augmentations:** enforce consistent formatting and improve code readability ([cacd179](https://github.com/soulcraft-research/brainy/commit/cacd1790dc6b29096187dac53309b83d89b2242d))
* **src/brainyData:** enforce consistent formatting and improve code readability ([e884c58](https://github.com/soulcraft-research/brainy/commit/e884c5831003c7e0cae8260cd0d3d8cf72e7ef07))
* **src/brainyData:** enforce consistent formatting and improve fallback mechanisms ([cabe0a3](https://github.com/soulcraft-research/brainy/commit/cabe0a3a08e4bfd5fddfe19a7dfb0f382d347103))
* **src/index:** enforce consistent formatting and adjust code structure ([95be233](https://github.com/soulcraft-research/brainy/commit/95be23362af2665f4d2fed2657599980381434f2))
* **src/storage:** enforce consistent formatting and improve code readability ([cbf025d](https://github.com/soulcraft-research/brainy/commit/cbf025dffb0ab5e8af211d7daadc057b5771d567))
* **src/utils:** enforce consistent formatting and enhance worker script initialization ([bd123c4](https://github.com/soulcraft-research/brainy/commit/bd123c4bb91ddb6d30ee5ef240e1872affb5f795))
* **src/utils:** enhance type definition and improve load function detection ([ef83af4](https://github.com/soulcraft-research/brainy/commit/ef83af4b556966949e9df24cdf524a49b1ccab29))
* **src/utils:** improve readability of `findUSELoadFunction` parameters ([f946328](https://github.com/soulcraft-research/brainy/commit/f9463288234ff9cf6220db8443423df37651dc72))
* **src/utils:** remove unused `sentenceEncoderModule` for cleanup ([e81979d](https://github.com/soulcraft-research/brainy/commit/e81979dc849d7c1cdb70eb02697d1ad76db31196))


### Documentation

* update Node.js version requirement to 23.0.0 in documentation ([920439f](https://github.com/soulcraft-research/brainy/commit/920439f611d1dba45e7bcb3915eea0df5507ac20))

## [0.4.0](https://github.com/soulcraft-research/brainy/compare/v0.1.0...v0.4.0) (2025-08-01)


### Changed

* **release:** 0.2.0 [skip ci] ([c9ca141](https://github.com/soulcraft-research/brainy/commit/c9ca14146ba5376812823185e55fc8b38be3785c))
* **release:** 0.3.0 [skip ci] ([437360c](https://github.com/soulcraft-research/brainy/commit/437360c2570632204cf951001aa7a0228479255d))

## [0.3.0](https://github.com/soulcraft-research/brainy/compare/v0.1.0...v0.3.0) (2025-08-01)


### Changed

* **release:** 0.2.0 [skip ci] ([c9ca141](https://github.com/soulcraft-research/brainy/commit/c9ca14146ba5376812823185e55fc8b38be3785c))

## [0.2.0](https://github.com/soulcraft-research/brainy/compare/v0.1.0...v0.2.0) (2025-08-01)

## [0.1.0](https://github.com/soulcraft-research/brainy/compare/v0.33.0...v0.1.0) (2025-08-01)
