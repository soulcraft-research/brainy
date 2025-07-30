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
│   ├── concurrency-analysis.md
│   ├── storage-concurrency-analysis.md
│   ├── threading.md
│   ├── statistics.md
│   ├── testing.md
│   ├── vitest-improvements.md
│   ├── realtime-updates.md
│   ├── metadata-handling.md
│   ├── vector-dimension-standardization.md
│   ├── use-model-loading-explanation.md
│   ├── dimension-mismatch-summary.md
│   ├── storage-testing.md
│   ├── technical-guides.md
│   └── concurrency-implementation-summary.md
├── development/         # Development and contributor documentation
│   ├── developers.md
│   ├── documentation-standards.md
│   ├── markdown-conventions.md
│   ├── expected-test-messages.md
│   └── pretty-test-reporter.md
└── guides/             # User guides and migration documentation
    └── production-migration-guide.md
```

### Archive Directory
```
archive/                # Archived and temporary files
├── changes.md          # Old detailed changelog
├── changes-summary.md  # Old changelog summary
├── demo.md            # Demo documentation
├── fix-documentation.md # Temporary fix notes
└── test-issue-summary.md # Test issue summary
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

1. **Clean Root Directory**: Reduced from 29 to 4 essential markdown files
2. **Better Organization**: Logical categorization of documentation
3. **GitHub Compliance**: Follows GitHub and NPM best practices
4. **Automated Maintenance**: Changelog updates are automated
5. **Easy Navigation**: Clear directory structure for different doc types
6. **Historical Preservation**: Old documentation archived, not lost

## Workflow for Contributors

### Adding Documentation
1. **Technical docs** → `docs/technical/`
2. **Development docs** → `docs/development/`
3. **User guides** → `docs/guides/`
4. **Temporary files** → `archive/` (if needed)

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

- All technical documentation moved to `docs/technical/`
- Development documentation moved to `docs/development/`
- Old changelog files archived in `archive/`
- Links in existing documentation may need updates
- New automation ensures changelog stays current

This reorganization provides a sustainable, scalable approach to documentation management that follows industry best practices and integrates seamlessly with GitHub and NPM workflows.
