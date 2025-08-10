#!/bin/bash
# Run a single test file without the "2" issue
./node_modules/.bin/vitest run tests/intelligent-verb-scoring.test.ts -t "should provide learning statistics"