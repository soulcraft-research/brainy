import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import fs from 'fs'
import path from 'path'

// Custom plugin to provide empty shims for Node.js built-in modules in browser environments
const nodeModuleShims = () => {
  return {
    name: 'node-module-shims',
    resolveId(source) {
      // List of Node.js built-in modules to shim
      const nodeBuiltins = [
        'fs',
        'path',
        'util',
        'child_process',
        'url',
        'os',
        'node:fs',
        'node:path',
        'node:util',
        'node:child_process',
        'node:url',
        'node:os'
      ]

      if (nodeBuiltins.includes(source)) {
        // Return a virtual module ID for the shim
        return `\0${source}-shim`
      }
      return null
    },
    load(id) {
      // If this is one of our shims, return an appropriate module
      if (id.startsWith('\0') && id.endsWith('-shim')) {
        const moduleName = id.slice(1, -5)
        console.log(
          `Providing shim for Node.js module: ${moduleName}`
        )

        // Special handling for util module to include TextEncoder/TextDecoder
        if (moduleName === 'util' || moduleName === 'node:util') {
          return `
// Util shim with TextEncoder/TextDecoder support
const TextEncoder = globalThis.TextEncoder || (typeof global !== 'undefined' && global.TextEncoder) || class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }
};

const TextDecoder = globalThis.TextDecoder || (typeof global !== 'undefined' && global.TextDecoder) || class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf8');
  }
};

const types = {
  isFloat32Array: (arr) => arr instanceof Float32Array,
  isInt32Array: (arr) => arr instanceof Int32Array,
  isUint8Array: (arr) => arr instanceof Uint8Array,
  isUint8ClampedArray: (arr) => arr instanceof Uint8ClampedArray
};

export default { TextEncoder, TextDecoder, types };
export { TextEncoder, TextDecoder, types };
export const promises = {};
          `
        }

        // Special handling for url module
        if (moduleName === 'url' || moduleName === 'node:url') {
          return `
// URL shim for browser environments
const fileURLToPath = (url) => {
  if (typeof url === 'string') {
    // Simple conversion for file:// URLs
    if (url.startsWith('file://')) {
      return url.slice(7); // Remove 'file://' prefix
    }
    return url;
  }
  return url.pathname || url.toString();
};

const pathToFileURL = (path) => {
  return new URL('file://' + path);
};

export default { fileURLToPath, pathToFileURL };
export { fileURLToPath, pathToFileURL };
          `
        }

        // Special handling for os module
        if (moduleName === 'os' || moduleName === 'node:os') {
          return `
// OS shim for browser environments
const totalmem = () => {
  // Return a reasonable default for browser environments (8GB)
  return 8 * 1024 * 1024 * 1024;
};

const freemem = () => {
  // Return a reasonable default for browser environments (4GB)
  return 4 * 1024 * 1024 * 1024;
};

const platform = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.platform.toLowerCase().includes('win') ? 'win32' : 
           navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'linux';
  }
  return 'linux';
};

const arch = () => {
  return 'x64'; // Default architecture for browser
};

export default { totalmem, freemem, platform, arch };
export { totalmem, freemem, platform, arch };
          `
        }

        // Default empty shim for other modules
        return 'export default {}; export const promises = {};'
      }
      return null
    }
  }
}

// Custom plugin to provide Buffer polyfill for browser environments
const bufferPolyfill = () => {
  return {
    name: 'buffer-polyfill',
    // This will run before the bundle is generated
    buildStart() {
      console.log('Setting up Buffer polyfill for the bundle')
    },
    // This will run for each module
    transform(code, id) {
      // Only transform the entry point
      if (id.includes('src/unified.ts')) {
        // Add import for buffer at the top of the file
        const bufferImport = `
// Import Buffer polyfill
import { Buffer as BufferPolyfill } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = BufferPolyfill;
}
`
        return {
          code: bufferImport + code,
          map: { mappings: '' } // Provide an empty sourcemap to avoid warnings
        }
      }
      return null // Return null to let Rollup handle other files normally
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

// We no longer need to copy the worker file as we'll bundle it separately

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
// Buffer polyfill is now included via the buffer-polyfill plugin
    `
  },
  browser: {
    input: 'src/unified.ts',
    outputPrefix: 'brainy',
    tsconfig: './tsconfig.browser.json',
    declaration: false,
    declarationMap: false,
    intro: `
// Set global for compatibility
var global = typeof window !== "undefined" ? window : this;
// Buffer polyfill is now included via the buffer-polyfill plugin
`
  }
}

// Get configuration for the current build type
const buildConfig = config[buildType]

// Create the rollup configuration
const mainConfig = {
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
    bufferPolyfill(), // Add Buffer polyfill
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
    'node:stream/web',
    'node:worker_threads',
    'worker_threads',
    'node:fs',
    'node:path',
    'fs',
    'path',
    // Optional dependency - externalize to allow graceful failure
    '@soulcraft/brainy-models'
  ]
}

// Create a separate configuration for the worker.ts file
const workerConfig = {
  input: 'src/worker.ts',
  output: {
    file: 'dist/worker.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    // Add environment replacement
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    // Add our custom plugins
    fixThisReferences(),
    nodeModuleShims(),
    bufferPolyfill(), // Add Buffer polyfill
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.unified.json'
    })
  ],
  external: [
    // Add any dependencies you want to exclude from the bundle
    '@aws-sdk/client-s3',
    '@smithy/util-stream',
    '@smithy/node-http-handler',
    '@aws-crypto/crc32c',
    'node:stream/web',
    'node:worker_threads',
    'worker_threads',
    'node:fs',
    'node:path',
    'fs',
    'path',
    // Optional dependency - externalize to allow graceful failure
    '@soulcraft/brainy-models'
  ]
}

// Export both configurations
export default [mainConfig, workerConfig]
