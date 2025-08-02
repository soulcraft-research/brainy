# Contributing to @soulcraft/brainy-models

Thank you for your interest in contributing to the Brainy Models package! This package provides pre-bundled TensorFlow models for the Brainy vector database.

## Overview

The `@soulcraft/brainy-models` package is part of the larger Brainy ecosystem. For general contribution guidelines, please refer to the main [Brainy Contributing Guide](https://github.com/soulcraft-research/brainy/blob/main/CONTRIBUTING.md).

## Package-Specific Guidelines

### Model Contributions

When contributing to the models package, please consider:

- **Model Quality**: Ensure models are properly tested and validated
- **Model Size**: Be mindful of package size impact (current package is ~25MB)
- **Compatibility**: Ensure models work with the target TensorFlow.js versions
- **Documentation**: Update README.md with new model information

### Development Setup

1. Fork and clone the main repository
2. Navigate to the models package: `cd brainy-models-package`
3. Install dependencies: `npm install`
4. Download models: `npm run download-models`
5. Build the package: `npm run build`
6. Run tests: `npm test`

### Testing Models

Before submitting changes:

```bash
# Test model functionality
npm test

# Test model compression
npm run compress-models

# Verify package integrity
npm run pack
```

### Model Scripts

The package includes several utility scripts:

- `download-models` - Download the Universal Sentence Encoder model
- `compress-models` - Create optimized model variants
- `test` - Verify model functionality

### Commit Guidelines

Follow the same commit message conventions as the main Brainy project:

- Use conventional commit format
- Keep first line under 50 characters
- Use imperative mood ("Add model" not "Added model")
- Reference issues where appropriate

### Pull Request Process

1. Ensure your changes don't break existing functionality
2. Update documentation if you're adding new models or features
3. Test model loading and embedding generation
4. Verify package size impact is acceptable
5. Submit PR to the main Brainy repository

### Model Optimization

When working with models:

- **Float16**: For balanced performance and size
- **Int8**: For memory-constrained environments
- **Original**: For maximum accuracy

### File Structure

```
brainy-models-package/
├── models/                 # Model files
├── src/                   # TypeScript source
├── dist/                  # Compiled output
├── scripts/               # Utility scripts
└── test/                  # Test files
```

## Code of Conduct

This project follows the same [Code of Conduct](CODE_OF_CONDUCT.md) as the main Brainy project.

## Questions and Support

For questions specific to the models package:

- [GitHub Issues](https://github.com/soulcraft-research/brainy/issues) - Use the `brainy-models` label
- [Main Documentation](https://github.com/soulcraft-research/brainy)

For general Brainy questions, refer to the main repository.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
