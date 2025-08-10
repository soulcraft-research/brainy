#!/bin/bash
# Run package size test with verbose output
./node_modules/.bin/vitest run tests/package-size-breakdown.test.ts --reporter=verbose --no-coverage