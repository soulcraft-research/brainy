# Fix for "process.memoryUsage is not a function" Error

## Issue
During test runs with Vitest, the following error was occurring:

```
TypeError: process.memoryUsage is not a function
 ❯ VitestTestRunner.onAfterRunSuite node_modules/vitest/dist/runners.js:150:95
```

This error was happening because Vitest was trying to use `process.memoryUsage()` to log heap usage statistics, but this function was not available in the current environment.

## Solution
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

## Explanation
The `logHeapUsage` option in Vitest attempts to use Node.js's `process.memoryUsage()` function to track and report memory usage during test runs. However, this function might not be available in all environments, particularly in certain browser-like environments or when using specific Node.js versions or configurations.

By setting `logHeapUsage: false`, we prevent Vitest from attempting to call this function, which resolves the error while still allowing tests to run successfully.

## Verification
After making this change, the tests run without any unhandled errors, confirming that the issue has been resolved.
