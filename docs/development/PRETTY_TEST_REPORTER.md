# Pretty Test Reporter for Brainy

This document describes the visually enhanced test reporter added to the Brainy project.

## Overview

The Pretty Test Reporter provides a visually appealing summary of test results with colors, symbols, and formatted output. It enhances the standard Vitest output with a clear, easy-to-read summary at the end of test runs.

## Features

- 🎨 **Colorful Output**: Uses colors to distinguish between passed, failed, and skipped tests
- 📊 **Tabular Format**: Displays test results in a clean, tabular format
- 📝 **Detailed Summary**: Shows overall test statistics and file-by-file breakdown
- ❌ **Error Reporting**: Clearly lists any failed tests with their error messages
- ⏱️ **Timing Information**: Displays test duration in a human-readable format

## Usage

To run tests with the pretty reporter, use the following npm script:

```bash
npm run test:report:pretty
```

You can also specify specific test files:

```bash
npm run test:report:pretty -- tests/core.test.ts
```

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Run Completed in: 7.9s
Date: 7/28/2025, 11:22:54 AM
Total Test Files: 1
Total Tests: 19

Results:
  ✓ Passed: 19
  ✗ Failed: 0
  ○ Skipped: 0

Test Files:
┌──────────────────────────────────────────────────┬──────────┬──────────┬──────────┐
│ File                                              │ Passed    │ Failed    │ Skipped   │
├──────────────────────────────────────────────────┼──────────┼──────────┼──────────┤
│ core.test.ts                                      │ 19        │ 0         │ 0         │
└──────────────────────────────────────────────────┴──────────┴──────────┴──────────┘

 PASSED  All tests passed successfully!
```

## Implementation Details

The pretty reporter is implemented as a custom Vitest reporter in `src/testing/prettySummaryReporter.ts`. It:

1. Collects test information during the test run
2. Tracks passed, failed, and skipped tests
3. Organizes results by test file
4. Generates a formatted summary at the end of the test run

## Configuration

The reporter is configured in `vitest.config.ts` and works alongside the default Vitest reporter and JSON reporter. This provides both the standard output during test execution and the enhanced summary at the end.

## Customization

If you need to modify the reporter's appearance or behavior, you can edit the `prettySummaryReporter.ts` file. The main visual elements are in the `printSummary` method.
