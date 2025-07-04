# Brainy Developer Guide

<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
</div>

This document contains detailed information for developers working with Brainy, including building, testing, and publishing instructions.

## Table of Contents

- [Build System](#build-system)
- [Testing](#testing)
  - [Testing All Environments](#testing-all-environments)
  - [Testing the CLI Package Locally](#testing-the-cli-package-locally)
- [Publishing](#publishing)
  - [Publishing the CLI Package](#publishing-the-cli-package)
- [Development Usage](#development-usage)
- [Node.js 24 Optimizations](#nodejs-24-optimizations)
- [Development Workflow](#development-workflow)
- [Reporting Issues](#reporting-issues)
- [Code Style Guidelines](#code-style-guidelines)
- [Badge Maintenance](#badge-maintenance)

## Build System

Brainy uses a modern build system that optimizes for both Node.js and browser environments:

1. **ES Modules**
    - Built as ES modules for maximum compatibility
    - Works in modern browsers and Node.js environments
    - Separate optimized builds for browser and Node.js

2. **Environment-Specific Builds**
    - **Node.js Build**: Optimized for server environments with full functionality
    - **Browser Build**: Optimized for browser environments with reduced bundle size
    - **CLI Build**: Separate build for command-line interface functionality
    - Conditional exports in package.json for automatic environment detection

3. **Modular Architecture**
    - Core functionality and CLI are built separately
    - CLI (4MB) is only included when explicitly imported or used from command line
    - Reduced bundle size for browser and Node.js applications

4. **Environment Detection**
    - Automatically detects whether it's running in a browser or Node.js
    - Loads appropriate dependencies and functionality based on the environment
    - Provides consistent API across all environments

5. **TypeScript**
    - Written in TypeScript for type safety and better developer experience
    - Generates type definitions for TypeScript users
    - Compiled to ES2020 for modern JavaScript environments

6. **Build Scripts**
    - `npm run build`: Builds the core library without CLI
    - `npm run build:browser`: Builds the browser-optimized version
    - `npm run build:cli`: Builds the CLI version (only needed for CLI usage)
    - `npm run prepare:cli`: Builds the CLI for command-line usage
    - `npm run demo`: Builds both core library and browser versions and starts a demo server
    - GitHub Actions workflow: Automatically deploys the demo directory to GitHub Pages when pushing to the main branch

## Testing

### Testing All Environments

Brainy provides a comprehensive test script that verifies the library works correctly in all supported environments (browser, Node.js, and CLI):

```bash
# Test the library in all environments
npm run test-all
```

This script:
1. Builds all packages (main, browser, CLI)
2. Runs Node.js tests (worker tests and unified text encoding test)
3. Starts a local HTTP server and runs browser tests using Puppeteer (headless browser)
4. Runs CLI tests by installing the CLI package locally and testing basic commands

The test results are displayed with color-coded output for better readability.

### Testing the CLI Package Locally

Before publishing the CLI package to npm, you can test it locally to ensure it works as expected:

```bash
# Test the CLI package locally
npm run test-cli
```

This script:
1. Builds the main package
2. Creates a local tarball of the main package
3. Builds the CLI package
4. Updates the CLI package to use the local main package
5. Creates a local tarball of the CLI package
6. Installs the CLI package globally for testing

After running this script, you can use the CLI commands as if you had installed the package from npm:

```bash
# Test the CLI
brainy --version
brainy init
brainy add "Test data" '{"noun":"Thing"}'
brainy search "test"
```

When you're done testing, you can uninstall the CLI package:

```bash
npm uninstall -g @soulcraft/brainy-cli
```

## Publishing

### Publishing the CLI Package

If you need to publish the CLI package to npm, please refer to the [CLI Publishing Guide](docs/publishing-cli.md) for detailed instructions.

## Development Usage

```bash
# Run the CLI directly from the source
npm run cli help

# Generate a random graph for testing
npm run cli generate-random-graph --noun-count 20 --verb-count 40
```

## Node.js 24 Optimizations

Brainy takes advantage of several optimizations available in Node.js 24:

1. **Improved Worker Threads Performance**: The multithreading system has been completely rewritten to leverage Node.js 24's enhanced Worker Threads API, resulting in better performance for compute-intensive operations like embedding generation and vector similarity calculations.

2. **Worker Pool Management**: A sophisticated worker pool system reuses worker threads to minimize the overhead of creating and destroying threads, leading to more efficient resource utilization.

3. **Dynamic Module Imports**: Uses the new `node:` protocol prefix for importing core modules, which provides better performance and more reliable module resolution.

4. **ES Modules Optimizations**: Takes advantage of Node.js 24's improved ESM implementation for faster module loading and execution.

5. **Enhanced Error Handling**: Implements more robust error handling patterns available in Node.js 24 for better stability and debugging.

These optimizations are particularly beneficial for:

- Large-scale vector operations
- Batch processing of embeddings
- Real-time data processing pipelines
- High-throughput search operations

## Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Reporting Issues

We use GitHub issues to track bugs and feature requests. Please use the provided issue templates when creating a new issue:

- [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

## Code Style Guidelines

Brainy follows a specific code style to maintain consistency throughout the codebase:

1. **No Semicolons**: All code in the project should avoid using semicolons wherever possible
2. **Formatting**: The project uses Prettier for code formatting
3. **Linting**: ESLint is configured with specific rules for the project
4. **TypeScript Configuration**: Strict type checking enabled with ES2020 target
5. **Commit Messages**: Use the imperative mood and keep the first line concise

## Badge Maintenance

The README badges are automatically updated during the build process:

1. **npm Version Badge**: The npm version badge is automatically updated to match the version in package.json when:
    - Running `npm run build` (via the prebuild script)
    - Running `npm version` commands (patch, minor, major)
    - Manually running `node scripts/generate-version.js`

This ensures that the badge always reflects the current version in package.json, even before publishing to npm.
