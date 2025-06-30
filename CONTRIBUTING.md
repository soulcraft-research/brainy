<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>

# Contributing to Brainy

</div>

Thank you for your interest in contributing to Brainy! This document provides guidelines and instructions for
contributing to the project.

We welcome contributions of all kinds, including bug fixes, feature additions, documentation improvements, and more.
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Commit Message Guidelines

When contributing to this project, please write clear and descriptive commit messages that explain the purpose of your
changes. Good commit messages help maintainers understand your contributions and make the review process smoother.

### Best Practices

- Keep the first line concise (ideally under 50 characters)
- Use the imperative mood ("Add feature" not "Added feature")
- Reference issues and pull requests where appropriate
- When necessary, provide more detailed explanations in the commit body

### Examples

```
Add vector normalization option
Fix distance calculation in HNSW search
Update API documentation
Add support for IndexedDB storage
Change API parameter order
Simplify vector comparison logic
Update build dependencies
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the documentation if necessary
3. Use conventional commit messages in your PR
4. Your PR will be reviewed by maintainers and merged if approved

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Code Style

This project uses ESLint and Prettier for code formatting and style checking. The configuration can be found in the `package.json` file. Please ensure your code follows these standards:

- Use 2 spaces for indentation
- Use single quotes for strings
- No semicolons
- Trailing commas are not used
- Maximum line length is 80 characters

You can check your code style by running:
```bash
npm run check-style
```

This will run all code style checks, including a specific check for semicolons.

You can also run individual checks:

```bash
npm run lint         # Run ESLint to check for code issues
npm run lint:fix     # Automatically fix linting issues
npm run format       # Format your code with Prettier
npm run check-format # Check if your code is properly formatted
```

## Branching Strategy

- `main` - The main branch contains the latest stable release
- `develop` - The development branch contains the latest development changes
- Feature branches - Create a branch from `develop` for your feature or fix

When working on a new feature or fix:
1. Create a new branch from `develop` with a descriptive name (e.g., `feature/add-vector-normalization` or `fix/distance-calculation`)
2. Make your changes in that branch
3. Submit a pull request to merge your branch into `develop`

## Issue Reporting

Before submitting a new issue, please search existing issues to avoid duplicates.

- For bugs, use the bug report template
- For feature requests, use the feature request template
- Be as detailed as possible in your description
- Include code examples, error messages, and screenshots if applicable

Thank you for contributing to Brainy!
