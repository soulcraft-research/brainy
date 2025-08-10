#!/bin/bash
# Run storage tests
./node_modules/.bin/vitest run tests/opfs-storage.test.ts tests/s3-storage.test.ts --reporter=verbose