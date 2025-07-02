# Publishing @soulcraft/brainy and @soulcraft/brainy-cli to npm

This document explains how to publish both the @soulcraft/brainy and @soulcraft/brainy-cli packages to npm.

## Prerequisites

Before publishing, ensure you have:

1. Node.js >= 24.0.0 installed
2. An npm account with access to the @soulcraft organization
3. Logged in to npm using `npm login`

## Publishing Process

The repository is set up to publish both packages together with synchronized versions. To publish the packages, follow these steps:

### 1. Ensure you're in the root directory of the project

```bash
cd /path/to/brainy
```

### 2. Make sure you have the latest version of the code

```bash
git pull
```

### 3. Build and publish both packages

```bash
npm run deploy:both
```

This command will:
- Ensure versions are in sync between both packages
- Build the main package
- Build the CLI
- Verify the CLI was built successfully
- Publish the main package to npm
- Publish the CLI package to npm

### 4. Verify the packages were published successfully

After publishing, you can verify that the packages were published successfully by checking the npm registry:

```bash
npm view @soulcraft/brainy
npm view @soulcraft/brainy-cli
```

## How It Works

The publishing process uses the `scripts/publish-cli.js` script, which:

1. Ensures versions are in sync by running `scripts/generate-version.js`
2. Builds the main package with `npm run build`
3. Builds the CLI with `npm run build:cli`
4. Verifies the CLI was built successfully
5. Publishes the main package with `npm publish` from the root directory
6. Publishes the CLI package with `npm publish` from the cli-package directory

The version synchronization ensures that:
- Both packages always have the same version number
- The CLI package's dependency on the main package is exact (not using the ^ prefix)
- The README.md file is updated with the current version

The CLI package is configured in `cli-package/package.json` with:
- The correct package name: `@soulcraft/brainy-cli`
- `"private": false` to allow publishing
- `"publishConfig": { "access": "public" }` to ensure the scoped package is public
- The necessary files in the `"files"` array
- The correct bin configuration to make the CLI available as `brainy`

## Troubleshooting

If you encounter any issues during the publishing process:

1. Make sure you're logged in to npm with an account that has access to the @soulcraft organization
2. Ensure that the `dist/cli.js` file exists and has been built correctly
3. If you get an error about the package already existing, you may need to update the version in both package.json files:
   ```bash
   npm version patch  # This will update both package.json files via the version script
   ```
