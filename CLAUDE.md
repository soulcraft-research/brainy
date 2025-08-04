# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Build and Development
- `npm run build` - Build the unified bundle using Rollup
- `npm run build:browser` - Build browser-specific bundle
- `npm test` - Run all tests using Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:core` - Run core functionality tests only
- `npm run demo` - Build and serve the demo page

### Test Variations
- `npm run test:node` - Node.js environment tests
- `npm run test:browser` - Browser environment tests (jsdom)
- `npm run test:comprehensive` - All test suites (error handling, edge cases, storage, environments)
- `npm run test:performance` - Performance-specific tests

### Code Quality
The project uses ESLint and Prettier configurations defined in package.json. No separate lint commands are exposed, but the configurations are:
- ESLint: TypeScript with recommended rules, semicolons disabled
- Prettier: Single quotes, no semicolons, 2-space tabs

### Git Commit Conventions

The project uses **Conventional Commits** format. When working with Claude Code, follow this process:

**COMMIT WORKFLOW FOR CLAUDE CODE:**

1. **User Request**: When the user says "commit these changes" or similar
2. **Claude Generates**: I will create a Conventional Commit message by analyzing the diff
3. **Show for Review**: I will ALWAYS show you the complete commit message first
4. **User Approval**: You review and either:
   - Say "approved" / "yes" / "go ahead" → I commit and push
   - Say "edit: [changes]" → I modify and show again
   - Say "cancel" → I stop the process
5. **Execute**: Only after explicit approval, I will:
   - Run `git add -A` (if needed)
   - Run `git commit -m "message"`
   - Run `git push` (if approved)

**Example Flow:**
```
User: "Please commit these changes"
Claude: "Here's the commit message I'll use:
        
        feat(tools): add claude-commit AI tool
        
        [detailed description]
        
        Do you approve this commit message?"
User: "Yes, go ahead"
Claude: [Commits and pushes]
```

**Manual Usage (git cc):**
- `git cc` - Generate commit with interactive review
- The script will NEVER auto-push (manual `git push` required)

**Conventional Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code restructuring (no functional changes)
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks
- `revert`: Revert previous commit

## Architecture Overview

Brainy is a vector graph database with HNSW indexing that works across multiple environments (browser, Node.js, serverless). The architecture follows a modular design with clear separation of concerns:

### Core Components

**Main Entry Points:**
- `src/unified.ts` - Universal entry point that adapts to any environment
- `src/index.ts` - Standard exports without environment detection
- `src/brainyData.ts` - Main database class

**Key Architectural Patterns:**

1. **Environment Adaptation**: Automatically detects and adapts to browser, Node.js, or serverless environments
2. **Storage Abstraction**: Uses different storage backends (OPFS, FileSystem, S3, Memory) based on environment
3. **Pipeline Architecture**: Augmentation system with 8 types (SENSE, MEMORY, COGNITION, CONDUIT, ACTIVATION, PERCEPTION, DIALOG, WEBSOCKET)
4. **Multi-Threading Support**: Web Workers (browser) and Worker Threads (Node.js) for performance

### Directory Structure

- `src/storage/` - Storage adapters for different environments
- `src/hnsw/` - HNSW index implementations (standard and optimized)
- `src/augmentations/` - Pluggable augmentation system
- `src/utils/` - Utilities (embedding, distance functions, environment detection)
- `src/types/` - TypeScript type definitions
- `src/mcp/` - Model Control Protocol implementation
- `tests/` - Comprehensive test suite with environment-specific tests

### Build System

**Rollup Configuration** (`rollup.config.js`):
- Dual build targets: unified (cross-platform) and browser-specific
- Custom plugins for Node.js module shimming in browser environments
- Buffer polyfill injection for browser compatibility
- Worker bundling as separate output

**Critical Build Dependencies:**
- TypeScript compilation with multiple tsconfig files
- Environment-specific module resolution
- TensorFlow.js patching for cross-platform compatibility

### Testing Strategy

**Vitest Configuration** (`vitest.config.ts`):
- 60-second timeout for TensorFlow operations
- Environment-specific test suites
- Console filtering to reduce noise from TensorFlow logs
- JSON reporting for CI/CD integration

**Test Categories:**
- Core functionality (`tests/core.test.ts`)
- Environment compatibility (`tests/environment.*.test.ts`)
- Storage adapters (`tests/storage-*.test.ts`)
- Performance benchmarks (`tests/performance.test.ts`)

## Development Patterns

### Environment Detection
The codebase heavily relies on runtime environment detection. Key files:
- `src/utils/environment.ts` - Environment detection utilities
- `src/setup.ts` - TensorFlow.js environment patching

### Storage Pattern
Storage is abstracted through the StorageAdapter interface with automatic selection:
- Browser: OPFS (Origin Private File System) → Memory fallback
- Node.js: FileSystem → S3-compatible → Memory fallback
- Serverless: Memory → S3-compatible if configured

### Augmentation System
Extensible plugin architecture with type-safe interfaces in `src/types/augmentations.ts`. Augmentations process data through a pipeline with 8 categories, each with specific responsibilities.

### Error Handling
Centralized error types in `src/errors/brainyError.ts` with environment-aware error handling patterns.

## Important Implementation Notes

1. **TensorFlow.js Patching**: Critical startup sequence in `setup.ts` must execute before any TensorFlow imports
2. **Worker Management**: Automatic worker pool cleanup in browser/Node.js environments
3. **Memory Management**: Multi-level caching with LRU eviction for large datasets
4. **Cross-Platform Compatibility**: Rollup shimming ensures Node.js modules work in browsers
5. **Version Compatibility**: Package supports Node.js >=24.4.0 with ES modules

## Special Considerations

- All distance functions and embedding operations are optimized for batch processing
- HNSW index supports both in-memory and disk-based storage for large datasets
- WebSocket and WebRTC augmentations enable real-time syncing between instances
- MCP (Model Control Protocol) allows external AI models to access Brainy data
- Write-only and read-only modes available for specialized deployment scenarios