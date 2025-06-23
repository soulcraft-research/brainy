import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'

// Custom plugin to provide empty shims for Node.js built-in modules in browser environments
const nodeModuleShims = () => {
  return {
    name: 'node-module-shims',
    resolveId(source) {
      // List of Node.js built-in modules to shim
      const nodeBuiltins = ['fs', 'path', 'util', 'child_process']

      if (nodeBuiltins.includes(source)) {
        // Return a virtual module ID for the shim
        return `\0${source}-shim`
      }
      return null
    },
    load(id) {
      // If this is one of our shims, return an empty module
      if (id.startsWith('\0') && id.endsWith('-shim')) {
        console.log(
          `Providing empty shim for Node.js module: ${id.slice(1, -5)}`
        )
        return 'export default {}; export const promises = {};'
      }
      return null
    }
  }
}

// Custom plugin to fix 'this' references in specific files
const fixThisReferences = () => {
  return {
    name: 'fix-this-references',
    transform(code, id) {
      // Only transform the specific files that have issues with 'this'
      if (
        id.includes(
          '@tensorflow/tfjs-layers/dist/layers/convolutional_recurrent.js'
        )
      ) {
        // Replace 'this' with 'globalThis' in the problematic code
        return {
          code: code.replace(/\bthis\b/g, 'globalThis'),
          map: { mappings: '' } // Provide an empty sourcemap to avoid warnings
        }
      }
      return null // Return null to let Rollup handle other files normally
    }
  }
}

// Get build type from environment variable or default to 'unified'
const buildType = process.env.BUILD_TYPE || 'unified'

// Configuration based on build type
const config = {
  unified: {
    input: 'src/unified.ts',
    outputPrefix: 'unified',
    tsconfig: './tsconfig.unified.json',
    declaration: true,
    declarationMap: true,
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
  browser: {
    input: 'demo/browser_compatible_exports.ts',
    outputPrefix: 'brainy',
    tsconfig: './tsconfig.browser.json',
    declaration: false,
    declarationMap: false,
    intro: 'var global = typeof window !== "undefined" ? window : this;'
  }
}

// Get configuration for the current build type
const buildConfig = config[buildType]

// Create the rollup configuration
export default {
  input: buildConfig.input,
  output: [
    {
      dir: 'dist',
      entryFileNames: `${buildConfig.outputPrefix}.js`,
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
      intro: buildConfig.intro
    },
    {
      dir: 'dist',
      entryFileNames: `${buildConfig.outputPrefix}.min.js`,
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
      intro: buildConfig.intro,
      plugins: [terser()]
    }
  ],
  plugins: [
    // Add environment replacement for unified build
    ...(buildType === 'unified'
      ? [
          replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production')
          })
        ]
      : []),
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
      tsconfig: buildConfig.tsconfig,
      declaration: buildConfig.declaration,
      declarationMap: buildConfig.declarationMap
    })
  ],
  external: [
    // Add any dependencies you want to exclude from the bundle
    '@aws-sdk/client-s3',
    '@smithy/util-stream',
    '@smithy/node-http-handler',
    '@aws-crypto/crc32c',
    'node:stream/web'
  ]
}
