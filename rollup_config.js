import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'

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

// Custom plugin to provide empty shims for Node.js built-in modules
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

export default {
  input: 'examples/browser_compatible_exports.ts', // Browser-compatible entry point
  inlineDynamicImports: true,
  output: [
    {
      file: 'dist/brainy.js',
      format: 'es',
      sourcemap: true,
      intro: 'var global = typeof window !== "undefined" ? window : this;',
    },
    {
      file: 'dist/brainy.min.js',
      format: 'es',
      sourcemap: true,
      intro: 'var global = typeof window !== "undefined" ? window : this;',
      plugins: [terser()]
    }
  ],
  plugins: [
    // Add our custom plugins first to ensure they run before other transformations
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
      tsconfig: './tsconfig.browser.json',
      declaration: false,
      declarationMap: false
    })
  ],
  external: [
    // Add any dependencies you want to exclude from the bundle
    // AWS SDK modules with circular dependencies
    '@aws-sdk/client-s3',
    '@smithy/util-stream',
    '@smithy/node-http-handler',
    '@aws-crypto/crc32c'
    // Node.js built-ins are now handled by the nodeModuleShims plugin
  ]
}
