# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Preferences (IMPORTANT)

### Monetization Philosophy
**David strongly prefers abundance over scarcity-based monetization:**
- ❌ NO freemium with limited functionality
- ❌ NO artificial restrictions to force upgrades  
- ❌ NO feature gating behind paywalls
- ✅ Core features should be unlimited and free
- ✅ Charge for services that cost money (cloud hosting, support)
- ✅ Add value through optional services, not restrictions
- ✅ See MONETIZATION_PHILOSOPHY.md for details

**Remember**: "We don't limit features to make money. We add value to earn it."

## Essential Commands

### Build and Development
- `npm run build` - Compile TypeScript to ES modules using tsc
- `npm test` - Run all tests using Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:core` - Run core functionality tests only
- `npm run demo` - Build and serve the demo page
- `npm run download-models` - Download models for offline/Docker use

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
        
        feat(tools): add new feature
        
        [detailed description]
        
        Do you approve this commit message?"
User: "Yes, go ahead"
Claude: [Commits and pushes]
```

**IMPORTANT COMMIT GUIDELINES:**
- **DO NOT include any Claude references in commit messages**
- **DO NOT add Co-Authored-By: Claude lines**
- **DO NOT include "Generated with Claude Code" or similar references**
- Keep commit messages professional and focused on the changes only

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

## Release and Publishing Workflow
- When publishing: always commit and push, then update version appropriately, then do github release, then publish
- **Always let me approve commit message before pushing, releasing or deploying**

## Architecture Overview

Brainy is a vector graph database with HNSW indexing that works across multiple environments (browser, Node.js, serverless). The architecture follows a modular design with clear separation of concerns:

### Major Migration: TensorFlow.js → Transformers.js (v0.46+)

**IMPORTANT**: As of v0.46, Brainy has completely replaced TensorFlow.js with Transformers.js + ONNX Runtime:

- **Package Size**: Reduced from 12.5MB to 643kB (95% reduction)
- **Model Size**: Reduced from 525MB to 87MB (84% reduction) 
- **Dependencies**: Reduced from 47+ to 5 (no more --legacy-peer-deps issues)
- **Network Calls**: True offline operation after initial model download
- **Performance**: ONNX Runtime often faster than TensorFlow.js
- **Dimensions**: Changed from 512 (USE) to 384 (all-MiniLM-L6-v2)

**Key Files for Migration:**
- `src/utils/embedding.ts` - Complete rewrite using Transformers.js
- `src/utils/distance.ts` - Removed TensorFlow GPU acceleration, pure JS now
- `src/brainyData.ts` - Updated default dimensions to 384
- `scripts/download-models.cjs` - Script for Docker/offline model bundling

**Offline Models Workflow:**
- **Default**: Models download automatically on first use
- **Docker**: Use `npm run download-models` during build for production containers without egress
- **Smart Detection**: Automatically finds cached, bundled, or downloads models as needed

### Core Components

**Main Entry Points:**
- `src/index.ts` - Main entry point with comprehensive exports for all environments
- `src/brainyData.ts` - Main database class
- `src/unified.ts` - Legacy compatibility (maintained for existing code)

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

**ES Modules Architecture:**
- Simple TypeScript compilation using `tsc`
- Individual module files for optimal tree-shaking by modern frameworks
- No complex bundling - frameworks handle optimization
- Faster development builds and better debugging experience

**Build Process:**
- TypeScript compilation with single tsconfig.json
- Direct ES module output to dist/
- Source maps for all files
- Modern framework compatibility (Angular, React, Vue bundlers handle the rest)

### Testing Strategy

**Vitest Configuration** (`vitest.config.ts`):
- 60-second timeout for model loading operations
- Environment-specific test suites
- Console filtering to reduce noise from model loading
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
- `src/utils/embedding.ts` - Smart model detection and caching

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

1. **Model Loading**: Smart detection system automatically finds cached, bundled, or downloads models as needed
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