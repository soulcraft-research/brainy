import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

// Custom plugin to provide empty shims for Node.js built-in modules in browser environments
const nodeModuleShims = () => {
  return {
    name: 'node-module-shims',
    resolveId(source) {
      // List of Node.js built-in modules to shim
      const nodeBuiltins = [
        'fs', 'path', 'util', 'crypto', 'os', 'stream', 
        'http', 'http2', 'https', 'zlib', 'child_process'
      ];

      if (nodeBuiltins.includes(source)) {
        // Return a virtual module ID for the shim
        return `\0${source}-shim`;
      }
      return null;
    },
    load(id) {
      // If this is one of our shims, return an empty module
      if (id.startsWith('\0') && id.endsWith('-shim')) {
        console.log(`Providing empty shim for Node.js module: ${id.slice(1, -5)}`);
        return 'export default {}; export const promises = {};';
      }
      return null;
    }
  };
};

// Custom plugin to fix 'this' references in specific files
const fixThisReferences = () => {
  return {
    name: 'fix-this-references',
    transform(code, id) {
      // Only transform the specific files that have issues with 'this'
      if (id.includes('@tensorflow/tfjs-layers/dist/layers/convolutional_recurrent.js')) {
        // Replace 'this' with 'globalThis' in the problematic code
        return {
          code: code.replace(/\bthis\b/g, 'globalThis'),
          map: { mappings: '' } // Provide an empty sourcemap to avoid warnings
        };
      }
      return null; // Return null to let Rollup handle other files normally
    }
  };
};

export default {
  input: 'src/unified.ts', // Use the unified entry point
  inlineDynamicImports: true,
  output: [
    {
      file: 'dist/unified.js',
      format: 'es',
      sourcemap: true,
      intro: `
// Environment detection
const isBrowser = typeof window !== 'undefined';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isServerless = !isBrowser && !isNode;

// Global Buffer polyfill for browser environments
if (isBrowser) {
  try {
    // Import Buffer from the buffer package
    import('buffer').then(({ Buffer }) => {
      globalThis.Buffer = Buffer;
    }).catch(err => {
      console.warn('Failed to load Buffer polyfill:', err);
    });
  } catch (e) {
    console.warn('Failed to import buffer package:', e);
  }
}

// Global variable to store environment
globalThis.__ENV__ = {
  isBrowser,
  isNode,
  isServerless
};
      `
    },
    {
      file: 'dist/unified.min.js',
      format: 'es',
      sourcemap: true,
      plugins: [terser()],
      intro: `
// Environment detection
const isBrowser = typeof window !== 'undefined';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isServerless = !isBrowser && !isNode;

// Global Buffer polyfill for browser environments
if (isBrowser) {
  try {
    // Import Buffer from the buffer package
    import('buffer').then(({ Buffer }) => {
      globalThis.Buffer = Buffer;
    }).catch(err => {
      console.warn('Failed to load Buffer polyfill:', err);
    });
  } catch (e) {
    console.warn('Failed to import buffer package:', e);
  }
}

// Global variable to store environment
globalThis.__ENV__ = {
  isBrowser,
  isNode,
  isServerless
};
      `
    }
  ],
  plugins: [
    // Add environment replacement
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // Add our custom plugins
    fixThisReferences(),
    nodeModuleShims(),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.unified.json',
      declaration: true,
      declarationMap: true
    })
  ],
  external: [
    // Add any dependencies you want to exclude from the bundle
    '@aws-sdk/client-s3',
    '@smithy/util-stream',
    '@smithy/node-http-handler',
    '@aws-crypto/crc32c'
  ]
};
