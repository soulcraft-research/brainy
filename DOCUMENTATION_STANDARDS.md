# Documentation Standards for Brainy

<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
</div>

This document outlines the documentation standards and conventions for the Brainy project, including markdown file naming conventions and troubleshooting information for common documentation issues.

## Table of Contents

- [Markdown File Naming Conventions](#markdown-file-naming-conventions)
- [Documentation Troubleshooting](#documentation-troubleshooting)

## Markdown File Naming Conventions

Based on the current project structure, we follow these conventions for markdown files:

### Uppercase Naming

Use uppercase filenames for project-level documentation:

- README.md - Project overview and main documentation
- CONTRIBUTING.md - Contribution guidelines
- LICENSE.md - License information
- CHANGES.md - Changelog
- CODE_OF_CONDUCT.md - Code of conduct
- Other project-level documentation files

Examples: `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

### Lowercase Naming

Use lowercase filenames for technical documentation and implementation details:

- Technical guides
- Implementation details
- Architecture documentation
- Specific feature documentation

Examples: `scalingStrategy.md`, `statistics.md`

## Rationale

This convention makes it easy to distinguish between:

1. Project-level documentation that applies to the entire project and is relevant to all contributors and users (uppercase)
2. Technical documentation that focuses on specific implementation details and is primarily relevant to developers working on those features (lowercase)

## Recommendations

1. Continue using uppercase names for project-level documentation files
2. Continue using lowercase names for technical documentation files
3. Be consistent within each category
4. Always use `README.md` (uppercase) for directory-level documentation

## Examples

### Project-Level Documentation (Uppercase)

- README.md
- CONTRIBUTING.md
- LICENSE.md
- CHANGES.md
- CODE_OF_CONDUCT.md
- DEVELOPERS.md
- STORAGE_TESTING.md
- THREADING.md

### Technical Documentation (Lowercase)

- scalingStrategy.md
- statistics.md
- architecture.md
- implementation-details.md

By following these conventions, we maintain consistency and make it easier for contributors to find the right documentation.

## Documentation Troubleshooting

This section covers common documentation-related issues and their solutions.

### Fix for "process.memoryUsage is not a function" Error in Vitest

#### Issue
During test runs with Vitest, the following error was occurring:

```
TypeError: process.memoryUsage is not a function
 ❯ VitestTestRunner.onAfterRunSuite node_modules/vitest/dist/runners.js:150:95
```

This error was happening because Vitest was trying to use `process.memoryUsage()` to log heap usage statistics, but this function was not available in the current environment.

#### Solution
The issue was fixed by disabling the heap usage logging in the Vitest configuration:

In `vitest.config.ts`, changed:
```typescript
// Show test statistics
logHeapUsage: true,
```

To:
```typescript
// Show test statistics
logHeapUsage: false,
```

#### Explanation
The `logHeapUsage` option in Vitest attempts to use Node.js's `process.memoryUsage()` function to track and report memory usage during test runs. However, this function might not be available in all environments, particularly in certain browser-like environments or when using specific Node.js versions or configurations.

By setting `logHeapUsage: false`, we prevent Vitest from attempting to call this function, which resolves the error while still allowing tests to run successfully.

#### Verification
After making this change, the tests run without any unhandled errors, confirming that the issue has been resolved.

### Common Documentation Issues and Solutions

#### Issue: Inconsistent Markdown Formatting

**Symptoms**: Inconsistent heading levels, list formatting, or code block syntax across documentation files.

**Solution**: 
- Use a markdown linter to enforce consistent formatting
- Follow the project's markdown style guide
- Use the same heading structure across similar documents

#### Issue: Broken Links in Documentation

**Symptoms**: Links to other documentation files or sections within files don't work.

**Solution**:
- Use relative links for references to other files in the repository
- Use anchor links for references to sections within the same file
- Regularly check for broken links, especially after moving or renaming files

#### Issue: Outdated Documentation

**Symptoms**: Documentation describes features or APIs that have changed or been removed.

**Solution**:
- Update documentation as part of the same PR that changes the code
- Add a "Last Updated" date to documentation files
- Regularly review and update documentation

#### Issue: Missing Documentation

**Symptoms**: Features or APIs lack documentation, making them difficult to use.

**Solution**:
- Require documentation for new features as part of the PR review process
- Create documentation templates for common types of documentation
- Identify and prioritize documentation gaps
