# Brainy Examples

This directory contains examples demonstrating various features and use cases of the Brainy vector graph database.

## Browser-Server Search Example

The [browser-server-search](./browser-server-search/) example demonstrates how to use Brainy in a browser, call a server-hosted version for search, store the results locally, and then perform further searches against the local instance.

This approach allows you to:
- Search a server-hosted Brainy instance from a browser
- Store the search results in a local Brainy instance
- Perform further searches against the local instance without needing to query the server again
- Add data to both local and server instances

See the [browser-server-search README](./browser-server-search/README.md) for detailed instructions.

## Other Examples

### Augmentation Examples

- [conduitAugmentationExample.js](./conduitAugmentationExample.js) - Demonstrates how to use conduit augmentations for syncing Brainy instances
- [memoryAugmentationExample.js](./memoryAugmentationExample.js) - Shows how to use memory augmentations for custom storage

### Pipeline Examples

- [sequentialPipelineExample.js](./sequentialPipelineExample.js) - Demonstrates the sequential pipeline for processing data

### Demo

- [demo.html](./demo.html) - A web demo showcasing Brainy's capabilities

### Configuration Examples

- [configurationTest.js](./configurationTest.js) - Shows how to configure Brainy with custom options
- [readOnlyTest.js](./readOnlyTest.js) - Demonstrates using Brainy in read-only mode
- [buildTimeRegistration.js](./buildTimeRegistration.js) - Shows how to register augmentations at build time

### Data Inspection

- [dataInspectionExample.js](./dataInspectionExample.js) - Demonstrates how to inspect data stored in Brainy

## Running the Examples

Most JavaScript examples can be run using Node.js:

```bash
node examples/sequentialPipelineExample.js
```

For HTML examples, you can open them directly in a browser or serve them using a local HTTP server:

```bash
# Using a simple HTTP server
npx http-server
```

Then navigate to the appropriate URL in your browser (e.g., http://localhost:8080/examples/demo.html).

## Creating Your Own Examples

Feel free to use these examples as a starting point for your own projects. You can copy and modify them to suit your needs.

If you create an example that might be useful to others, consider contributing it back to the Brainy project!
