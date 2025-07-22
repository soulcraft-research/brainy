import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'

const isProduction = process.env.NODE_ENV === 'production'

export default {
  input: 'src/server.ts',
  output: {
    file: 'dist/server.js',
    format: 'es',
    sourcemap: true,
    banner: '#!/usr/bin/env node'
  },
  external: [
    // Node.js built-ins
    'fs',
    'path',
    'url',
    'crypto',
    'os',
    'util',
    'events',
    'stream',
    'buffer',
    'querystring',
    'http',
    'https',
    'net',
    'tls',
    'zlib',
    // External dependencies that should not be bundled
    'express',
    'cors',
    'helmet',
    'compression',
    'express-rate-limit',
    'express-validator',
    '@soulcraft/brainy'
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      exportConditions: ['node']
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: !isProduction
    }),
    ...(isProduction ? [terser()] : [])
  ]
}
