# Testing Brainy Across Different Environments

This document provides instructions for testing Brainy's cache detection functionality across different environments.

## Testing in Node.js Environment

To test Brainy in a Node.js environment:

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the Node.js test script:
   ```bash
   node test-cache-detection.js
   ```

3. Expected output:
   ```
   Brainy: Successfully patched TensorFlow.js PlatformNode at module load time
   Applied TensorFlow.js patch via ES modules in setup.ts
   Brainy running in Node.js environment
   Creating BrainyData instance...
   BrainyData instance created successfully!
   Test completed successfully!
   ```

## Testing in Browser Environment

To test Brainy in a browser environment:

1. Build the project:
   ```bash
   npm run build
   ```

2. Start a local web server:
   ```bash
   npx http-server -p 8080
   ```

3. Open the browser test page:
   ```
   http://localhost:8080/test-browser-cache-detection.html
   ```

4. Click the "Run Test" button on the page.

5. Expected results:
   - The page should display success messages
   - No errors should appear in the browser console
   - You should see "BrainyData instance created successfully!" and "Test completed successfully!"

## Testing in Web Worker Environment

To test Brainy in a Web Worker environment:

1. Build the project:
   ```bash
   npm run build
   ```

2. Start a local web server:
   ```bash
   npx http-server -p 8080
   ```

3. Open the worker test page:
   ```
   http://localhost:8080/test-worker-cache-detection.html
   ```

4. Click the "Run Test" button on the page.

5. Expected results:
   - The page should display success messages from the worker
   - No errors should appear in the browser console
   - You should see "BrainyData instance created successfully!" and "Test completed successfully!"

## Compatibility Notes

Brainy's cache detection has been designed to work across all environments:

1. **Node.js Environment**:
   - Uses fixed default memory values (8GB total, 4GB free) for cache size calculation
   - This approach ensures compatibility with ES modules

2. **Browser Environment**:
   - Uses navigator.deviceMemory API when available
   - Falls back to conservative defaults when the API is not available

3. **Worker Environment**:
   - Uses a more conservative approach to cache sizing
   - Automatically detects the worker environment and adjusts accordingly

The cache manager automatically detects the environment and adjusts its behavior to ensure optimal performance in each context.
