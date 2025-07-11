import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'

// CLI configuration
export default {
  input: 'src/cli.ts',
  context: 'this', // Preserve 'this' context to fix TensorFlow.js issue
  output: {
    dir: 'dist',
    entryFileNames: 'cli.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve({
      browser: false,
      preferBuiltins: true
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    })
  ],
  external: [
    // External dependencies that should not be bundled
    '@soulcraft/brainy',
    'commander',
    'omelette',
    'fs',
    'path',
    'url',
    'child_process',
    'worker_threads'
  ]
}
