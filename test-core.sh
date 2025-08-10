#!/bin/bash
# Run core working tests
./node_modules/.bin/vitest run tests/core.test.ts tests/environment.test.ts tests/package-size-breakdown.test.ts tests/throttling-metrics.test.ts --reporter=dot