<div align="center">
<img src="../brainy.png" alt="Brainy Logo" width="200"/>

# Build-Time Augmentation Registration
</div>

This document explains how to register custom augmentations at build time using the Brainy library's augmentation
registry system.

## Overview

Brainy provides a system for registering custom augmentations at build time, similar to Angular's pipeline. This allows
you to:

1. Define custom augmentations in your project
2. Register them with the Brainy library during the build process
3. Have them automatically available when your application runs

This approach has several advantages:

- Better performance as augmentations are available immediately at startup
- Improved tree-shaking and bundle optimization
- Type safety and better IDE support
- No need for dynamic imports or async loading

## Creating Custom Augmentations

To create a custom augmentation, you need to implement one of the augmentation interfaces provided by Brainy:

```typescript
// myTextSenseAugmentation.ts
import {
    registerAugmentation,
    AugmentationType,
    BrainyAugmentations
} from 'brainy';

// Define a custom sense augmentation
class MyTextSenseAugmentation implements BrainyAugmentations.ISenseAugmentation {
    name = 'MyTextSenseAugmentation';
    enabled = true;
    type = AugmentationType.SENSE;

    // Required IAugmentation methods
    async initialize() {
        console.log('Initializing MyTextSenseAugmentation');
        return true;
    }

    async shutDown() {
        console.log('Shutting down MyTextSenseAugmentation');
        return true;
    }

    getStatus() {
        return {
            name: this.name,
            enabled: this.enabled,
            type: this.type,
            status: 'ready'
        };
    }

    // ISenseAugmentation methods
    async processRawData(rawData, dataType) {
        console.log(`Processing ${dataType} data`);

        // Your implementation here

        return {
            success: true,
            data: { /* processed data */}
        };
    }

    async listenToFeed(feedUrl, callback) {
        console.log(`Listening to feed at ${feedUrl}`);

        // Your implementation here

        return {
            success: true,
            data: { /* feed info */}
        };
    }
}

// Register the augmentation with the registry
// This will make it available to the Brainy library at runtime
export const myTextSenseAugmentation = registerAugmentation(new MyTextSenseAugmentation());
```

## Registering Augmentations

There are two ways to register augmentations:

### 1. Manual Registration

You can manually register augmentations by calling `registerAugmentation()` in your code:

```typescript
import {registerAugmentation} from 'brainy';
import {MyCustomAugmentation} from './myCustomAugmentation';

// Register the augmentation
const myAugmentation = registerAugmentation(new MyCustomAugmentation());

// You can also export it for use elsewhere in your application
export {myAugmentation};
```

### 2. Automatic Registration with Build Tools

For larger projects, you can use build tools like webpack or rollup to automatically discover and register
augmentations:

#### With Webpack

```javascript
// webpack.config.js
const {createAugmentationRegistryPlugin} = require('brainy');

module.exports = {
    // ... other webpack config
    plugins: [
        createAugmentationRegistryPlugin({
            // Pattern to match files containing augmentations
            pattern: /augmentation\.(js|ts)$/,
            options: {
                autoInitialize: true,
                debug: true
            }
        })
    ]
};
```

#### With Rollup

```javascript
// rollup.config.js
import {createAugmentationRegistryRollupPlugin} from 'brainy';

export default {
    // ... other rollup config
    plugins: [
        createAugmentationRegistryRollupPlugin({
            pattern: /augmentation\.(js|ts)$/,
            options: {
                autoInitialize: true,
                debug: true
            }
        })
    ]
};
```

## Using Registered Augmentations

Once augmentations are registered, they are automatically available to the Brainy library. You can use them through the
augmentation pipeline:

```typescript
import {BrainyData, augmentationPipeline, initializeAugmentationPipeline} from 'brainy';

// Create a new BrainyData instance
const db = new BrainyData();
await db.init();

// Initialize the augmentation pipeline with all registered augmentations
initializeAugmentationPipeline();

// Use the pipeline to execute augmentations
const senseResults = await augmentationPipeline.executeSensePipeline(
    'processRawData',
    ['This is some example text to process', 'text']
);

// Process the results
for (const resultPromise of senseResults) {
    const result = await resultPromise;
    if (result.success) {
        console.log('Processed data:', result.data);
    }
}
```

## Best Practices

1. **Naming Convention**: Use a consistent naming convention for your augmentation files, such as ending them with
   `augmentation.ts` or `augmentation.js`.

2. **File Organization**: Keep your augmentations organized in a dedicated directory, such as `src/augmentations/`.

3. **Type Safety**: Implement the appropriate interfaces for your augmentations to ensure type safety.

4. **Documentation**: Document your augmentations with JSDoc comments to provide clear usage instructions.

5. **Testing**: Write tests for your augmentations to ensure they work correctly.

## Troubleshooting

If your augmentations are not being registered or are not working as expected, check the following:

1. Make sure your augmentation implements all required methods from the interface.
2. Verify that your augmentation is being registered with `registerAugmentation()`.
3. If using build tools, check that your file naming matches the pattern specified in the plugin configuration.
4. Enable debug logging in the plugin options to see detailed information about the registration process.
5. Check the console for any error messages during initialization.

## Examples

For complete examples, see:

- [Basic Augmentation Registration](../examples/buildTimeRegistration.js)
- [Webpack Configuration](../examples/webpack.config.js)
- [Rollup Configuration](../examples/rollup.config.js)
