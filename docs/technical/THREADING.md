# Brainy Threading Implementation

This document explains how Brainy's threading implementation works across different environments.

## Overview

Brainy uses a unified threading approach that adapts to the environment it's running in:

1. **Node.js**: Uses Worker Threads API (optimized for Node.js 24+)
2. **Browser**: Uses Web Workers API
3. **Fallback**: Executes on the main thread when neither Worker Threads nor Web Workers are available

This implementation ensures that compute-intensive operations (like embedding generation and vector calculations) can be
performed efficiently without blocking the main thread, while maintaining compatibility across all environments.

## Implementation Details

### Environment Detection

Brainy automatically detects the environment it's running in:

```typescript
// From unified.ts
export const environment = {
  isBrowser: typeof window !== 'undefined',
  isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
  isServerless: typeof window === 'undefined' && 
    (typeof process === 'undefined' || !process.versions || !process.versions.node)
}
```

Additional environment detection functions are available in `src/utils/environment.ts`:

```typescript
// Check if threading is available
export function isThreadingAvailable(): boolean {
  return areWebWorkersAvailable() || areWorkerThreadsAvailable();
}

// Check if Web Workers are available (browser)
export function areWebWorkersAvailable(): boolean {
  return isBrowser() && typeof Worker !== 'undefined';
}

// Check if Worker Threads are available (Node.js)
export function areWorkerThreadsAvailable(): boolean {
  if (!isNode()) return false;
  try {
    require('worker_threads');
    return true;
  } catch (e) {
    return false;
  }
}
```

### Thread Execution

The core of the threading implementation is the `executeInThread` function in `src/utils/workerUtils.ts`:

```typescript
export function executeInThread<T>(fnString: string, args: any): Promise<T> {
  if (environment.isNode) {
    return executeInNodeWorker<T>(fnString, args)
  } else if (environment.isBrowser && typeof window !== 'undefined' && window.Worker) {
    return executeInWebWorker<T>(fnString, args)
  } else {
    // Fallback to main thread execution
    try {
      const fn = new Function('return ' + fnString)()
      return Promise.resolve(fn(args) as T)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
```

This function:

1. Checks if it's running in Node.js and uses Worker Threads if available
2. Checks if it's running in a browser and uses Web Workers if available
3. Falls back to executing on the main thread if neither is available

### Node.js Implementation

For Node.js environments, Brainy uses the Worker Threads API with optimizations for Node.js 24:

```typescript
function executeInNodeWorker<T>(fnString: string, args: any): Promise<T> {
  // Implementation using Node.js Worker Threads
  // Includes worker pool management for better performance
  // Uses dynamic imports with the 'node:' protocol prefix
  // ...
}
```

Key optimizations:

- Worker pool to reuse workers and minimize overhead
- Dynamic imports with the `node:` protocol prefix
- Error handling and cleanup

### Browser Implementation

For browser environments, Brainy uses the Web Workers API:

```typescript
function executeInWebWorker<T>(fnString: string, args: any): Promise<T> {
  // Implementation using browser Web Workers
  // Creates a blob URL for the worker code
  // Handles message passing and error handling
  // ...
}
```

Key features:

- Creates workers using Blob URLs
- Proper cleanup of resources (terminating workers and revoking URLs)
- Error handling

### Fallback Mechanism

When neither Worker Threads nor Web Workers are available, Brainy falls back to executing on the main thread:

```typescript
// Fallback to main thread execution
try {
  const fn = new Function('return ' + fnString)()
  return Promise.resolve(fn(args) as T)
} catch (error) {
  return Promise.reject(error)
}
```

This ensures that Brainy works in all environments, even if threading is not available.

## Usage

The threading implementation is used throughout Brainy, particularly for compute-intensive operations like embedding
generation:

```typescript
export function createThreadedEmbeddingFunction(
  model: EmbeddingModel
): EmbeddingFunction {
  const embeddingFunction = createEmbeddingFunction(model)

  return async (data: any): Promise<Vector> => {
    // Convert the embedding function to a string
    const fnString = embeddingFunction.toString()

    // Execute the embedding function in a thread
    return await executeInThread<Vector>(fnString, data)
  }
}
```

## Testing

// Demo references removed: The demo is now maintained in the separate @soulcraft/demos project.

## Compatibility

The threading implementation has been tested and works in:

- Node.js 24+ (using Worker Threads)
- Modern browsers (using Web Workers):
    - Chrome
    - Firefox
    - Safari
    - Edge
- Environments without threading support (using fallback mechanism)

## Conclusion

Brainy's threading implementation provides efficient execution of compute-intensive operations across all environments,
with optimizations for Node.js 24 and modern browsers, and a fallback mechanism for environments where threading is not
available.
