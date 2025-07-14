# Using TensorFlow.js with Brainy in Node.js Environments

This document provides guidance on resolving TensorFlow.js compatibility issues when using Brainy in Node.js environments, particularly with ES modules.

## Common Issues

When using Brainy with TensorFlow.js in Node.js environments, you might encounter errors like:

```
TypeError: this.util.TextEncoder is not a constructor
```

This occurs due to how TensorFlow.js initializes its platform detection in ES modules environments.

## Solution

Brainy includes a built-in patch to address these issues. The patch is automatically applied when you import Brainy, but in some complex project setups, you might need to take additional steps.

### Option 1: Import the Setup Module First (Recommended)

For the most reliable solution, explicitly import Brainy's setup module before any other imports that might use TensorFlow.js:

```javascript
// Import the setup module first to apply TensorFlow.js patches
import '@soulcraft/brainy/setup';

// Then import and use Brainy or TensorFlow.js
import { BrainyData } from '@soulcraft/brainy';
// ... your code here
```

### Option 2: Apply the Patch Directly

If you need more control, you can directly apply the patch:

```javascript
// Import and apply the patch directly
import { applyTensorFlowPatch } from '@soulcraft/brainy/utils/textEncoding';
applyTensorFlowPatch();

// Then import and use TensorFlow.js
import * as tf from '@tensorflow/tfjs';
// ... your code here
```

### Option 3: For CommonJS Environments

If you're using CommonJS modules:

```javascript
// Apply the patch first
require('@soulcraft/brainy/dist/setup.js');

// Then require TensorFlow.js or Brainy
const brainy = require('@soulcraft/brainy');
// ... your code here
```

## How It Works

The patch works by:

1. Ensuring TextEncoder and TextDecoder are properly available in the global scope
2. Creating a custom PlatformNode implementation that TensorFlow.js will use
3. Applying the patch before any TensorFlow.js code is executed

## Troubleshooting

If you still encounter issues:

1. Make sure the setup module is imported before any other modules that might use TensorFlow.js
2. Check your bundler configuration to ensure it's not removing the patch code (it's marked as having side effects)
3. Try using the CommonJS approach if you're having issues with ES modules
4. If using a bundler like webpack or rollup, ensure it's configured to handle Node.js built-ins properly

## Need More Help?

If you continue to experience issues, please open an issue on our GitHub repository with details about your environment and how you're using Brainy.
