# Contributing to Soulcraft Brainy

Thank you for your interest in contributing to Soulcraft Brainy! This document provides guidelines and instructions for contributing to the project.

## Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic semantic versioning. Your commit messages determine how the version number is incremented.

### Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The **header** is mandatory and must conform to the following format:

- **type**: What kind of change is this commit making? (required)
- **scope**: What part of the codebase does this change affect? (optional)
- **description**: A short description of the change (required)

### Types

- **feat**: A new feature (triggers a minor version bump)
- **fix**: A bug fix (triggers a patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

### Breaking Changes

Breaking changes should be indicated by:
1. Adding an exclamation mark after the type/scope: `feat!: remove deprecated API`
2. Adding a `BREAKING CHANGE:` footer: 
   ```
   feat: change API parameter order
   
   BREAKING CHANGE: The order of parameters in the API has changed.
   ```

Both methods will trigger a major version bump.

### Examples

```
feat: add vector normalization option
fix: correct distance calculation in HNSW search
docs: update API documentation
feat(storage): add support for IndexedDB
fix!: change API parameter order
refactor: simplify vector comparison logic
test: add tests for metadata filtering
chore: update build dependencies
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the documentation if necessary
3. Make sure all tests pass
4. Use conventional commit messages in your PR
5. Your PR will be reviewed by maintainers and merged if approved

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

Thank you for contributing to Soulcraft Brainy!
