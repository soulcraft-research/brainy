# Documentation Organization

This document explains the new documentation structure and workflow for managing markdown files in the Brainy project.

## Overview

The documentation has been reorganized from 29 scattered markdown files at the root level to a clean, organized structure with only essential files at the root and categorized documentation in the `docs/` directory.

## New Structure

### Root Level Files (GitHub/NPM Standards)
- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines  
- `CODE_OF_CONDUCT.md` - Community standards
- `CHANGELOG.md` - Version history and release notes

### Documentation Directory Structure
```
docs/
├── technical/           # Technical documentation and analysis
│   ├── CONCURRENCY_ANALYSIS.md
│   ├── STORAGE_CONCURRENCY_ANALYSIS.md
│   ├── THREADING.md
│   ├── STATISTICS.md
│   ├── TESTING.md
│   ├── VITEST_IMPROVEMENTS.md
│   ├── REALTIME_UPDATES.md
│   ├── METADATA_HANDLING.md
│   ├── VECTOR_DIMENSION_STANDARDIZATION.md
│   ├── USE_MODEL_LOADING_EXPLANATION.md
│   ├── STORAGE_TESTING.md
│   ├── TECHNICAL_GUIDES.md
│   ├── ENVIRONMENT_TESTING.md
│   └── SCALING_STRATEGY.md
├── development/         # Development and contributor documentation
│   ├── DEVELOPERS.md
│   ├── DOCUMENTATION_STANDARDS.md
│   ├── MARKDOWN_CONVENTIONS.md
│   ├── EXPECTED_TEST_MESSAGES.md
│   └── PRETTY_TEST_REPORTER.md
└── guides/             # User guides and migration documentation
    ├── cache-configuration.md
    ├── hnsw-field-search.md
    ├── json-document-search.md
    ├── model-management.md
    ├── optional-model-bundling.md
    ├── production-migration-guide.md
    └── service-identification.md
```


## CHANGELOG.md Management

### Automated Workflow

The project now uses automated changelog management:

1. **Adding Changes**: Add entries to the `[Unreleased]` section in `CHANGELOG.md`
2. **Version Bumping**: Use npm scripts that automatically update the changelog:
   - `npm run version:patch` - Patch version bump + changelog update
   - `npm run version:minor` - Minor version bump + changelog update  
   - `npm run version:major` - Major version bump + changelog update

3. **Manual Updates**: Use `npm run changelog:update` to manually update the changelog

### Changelog Format

The changelog follows the [Keep a Changelog](https://keepachangelog.com/) standard:

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Now removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

### GitHub Integration

The CHANGELOG.md is automatically used for:
- GitHub releases (via `scripts/create-github-release.js`)
- NPM package release notes
- Version history tracking

## Benefits of New Structure

1. **Clean Root Directory**: Only 4 essential markdown files at root level
2. **Better Organization**: Logical categorization of documentation in docs/ subdirectories
3. **GitHub Compliance**: Follows GitHub and NPM best practices
4. **Automated Maintenance**: Changelog updates are automated
5. **Easy Navigation**: Clear directory structure for different doc types
6. **Reduced Clutter**: Temporary and outdated files have been removed

## Workflow for Contributors

### Adding Documentation
1. **Technical docs** → `docs/technical/`
2. **Development docs** → `docs/development/`
3. **User guides** → `docs/guides/`
4. **Temporary files** → Should be avoided; use issues or PRs for temporary documentation

### Making Changes
1. Add changes to `[Unreleased]` section in `CHANGELOG.md`
2. Use appropriate category (Added, Changed, Fixed, etc.)
3. When ready to release, use `npm run version:patch/minor/major`
4. The changelog will be automatically updated with version and date

### Release Process
1. Ensure `[Unreleased]` section has all changes
2. Run `npm run version:patch/minor/major`
3. Run `npm run deploy` to publish and create GitHub release
4. GitHub release will use CHANGELOG.md content

## Migration Notes

- All technical documentation organized in `docs/technical/`
- Development documentation organized in `docs/development/`
- User guides organized in `docs/guides/`
- Temporary summary files and archived content have been cleaned up
- Links in existing documentation may need updates
- New automation ensures changelog stays current

This reorganization provides a sustainable, scalable approach to documentation management that follows industry best practices and integrates seamlessly with GitHub and NPM workflows.
