#!/bin/bash
# Run package size test
./node_modules/.bin/vitest run tests/package-size-breakdown.test.ts --reporter=verbose