# Markdown File Management Guidelines

## Overview

This document establishes standards for managing .md files in the Brainy project to maintain a clean, organized, and professional documentation structure.

## Root Directory Standards

The project root should contain **only** these essential .md files:

### Required Files (GitHub/NPM Standards)
- `README.md` - Main project documentation and entry point
- `CHANGELOG.md` - Version history and release notes
- `CODE_OF_CONDUCT.md` - Community guidelines
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` - Legal license file (not .md but related)

### Prohibited in Root
❌ **Never place these in root:**
- Temporary summary files (e.g., `IMPLEMENTATION_SUMMARY.md`)
- Fix-related documentation (e.g., `RELIABILITY_IMPROVEMENTS_SUMMARY.md`)
- Organizational notes (e.g., `SCRIPT_ORGANIZATION_SOLUTION.md`)
- Update logs (e.g., `README_updates.md`, `changes-summary.md`)
- Environment-specific guides (should go in docs/)

## Documentation Organization Structure

```
docs/
├── COMPATIBILITY.md              # Cross-platform compatibility info
├── DOCUMENTATION_ORGANIZATION.md # This file's organization guide
├── development/                  # Developer-focused documentation
│   ├── DEVELOPERS.md
│   ├── DOCUMENTATION_STANDARDS.md
│   └── MARKDOWN_CONVENTIONS.md
├── guides/                       # User guides and tutorials
│   ├── cache-configuration.md
│   ├── model-management.md
│   └── production-migration-guide.md
└── technical/                    # Technical implementation details
    ├── TESTING.md               # Comprehensive testing guide
    ├── ENVIRONMENT_TESTING.md   # Environment-specific testing
    ├── CONCURRENCY_ANALYSIS.md
    └── STORAGE_TESTING.md
```

## File Naming Conventions

### Use UPPERCASE for Major Documents
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `TESTING.md`, `COMPATIBILITY.md`

### Use lowercase-with-hyphens for Specific Guides
- `cache-configuration.md`
- `model-management.md`
- `production-migration-guide.md`

### Use Descriptive Names
✅ **Good:**
- `ENVIRONMENT_TESTING.md` (specific purpose)
- `cache-configuration.md` (clear topic)
- `production-migration-guide.md` (clear audience and purpose)

❌ **Bad:**
- `IMPLEMENTATION_SUMMARY.md` (temporary)
- `changes-summary.md` (temporary)
- `notes.md` (vague)

## File Lifecycle Management

### Temporary Files
**Rule: Temporary files should be deleted immediately after their purpose is fulfilled.**

Examples of temporary files that should be deleted:
- Implementation summaries after feature completion
- Fix documentation after issues are resolved
- Organizational notes after reorganization is complete
- Update logs after updates are integrated

### Permanent Documentation
Files that should be maintained long-term:
- User guides and tutorials
- Technical reference documentation
- API documentation
- Testing guides
- Development standards

## Where to Place Different Types of Documentation

### Root Directory
- Only essential project files (README, CHANGELOG, etc.)

### docs/development/
- Developer setup guides
- Build instructions
- Code standards
- Documentation standards

### docs/guides/
- User tutorials
- Configuration guides
- Migration guides
- How-to documentation

### docs/technical/
- Technical implementation details
- Architecture documentation
- Testing documentation
- Performance analysis

### Package-Specific
- Each package (cli-package/, web-service-package/, etc.) should have its own README.md
- Package-specific documentation stays with the package

## Review Process

### Before Adding New .md Files
1. **Determine if it's temporary or permanent**
   - Temporary: Consider using issues, PRs, or comments instead
   - Permanent: Proceed with proper placement

2. **Choose the correct location**
   - Root: Only for essential project files
   - docs/: For all other documentation

3. **Use proper naming conventions**
   - Descriptive names that indicate purpose
   - Consistent with existing patterns

### Regular Cleanup
- Review .md files quarterly
- Delete temporary files that have served their purpose
- Consolidate duplicate or overlapping documentation
- Update links when files are moved

## Migration Guidelines

When reorganizing existing documentation:

1. **Categorize existing files**
   - Essential (keep in root)
   - Useful (move to docs/)
   - Temporary (delete)

2. **Update references**
   - Search for links to moved files
   - Update README.md and other documentation
   - Test that all links work

3. **Maintain backward compatibility when possible**
   - Consider redirects for important moved files
   - Update package.json scripts if they reference moved files

## Enforcement

### Code Review Checklist
- [ ] New .md files are in appropriate locations
- [ ] Temporary files are not being committed
- [ ] Links to documentation are correct
- [ ] File names follow conventions

### Automated Checks (Future)
Consider implementing:
- Linting rules for .md file placement
- Link checking in CI/CD
- Automated cleanup of temporary files

## Examples

### ✅ Good Documentation Structure
```
README.md                    # Main project docs
CHANGELOG.md                 # Version history
docs/guides/setup.md         # User guide
docs/technical/api.md        # Technical reference
```

### ❌ Bad Documentation Structure
```
README.md
IMPLEMENTATION_SUMMARY.md    # Temporary - should be deleted
FIX_NOTES.md                # Temporary - should be deleted
setup.md                    # Should be in docs/guides/
```

## Summary

Following these guidelines ensures:
- Clean, professional project structure
- Easy navigation for users and contributors
- Reduced maintenance overhead
- Consistent documentation organization
- Better discoverability of information

**Remember: When in doubt, ask "Is this temporary or permanent?" and "Who is the audience?" to determine the right approach.**
