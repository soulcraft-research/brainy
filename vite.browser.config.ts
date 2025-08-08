import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'es2022',
    lib: {
      entry: resolve(__dirname, 'dist/browser-build/browserFramework.js'),
      name: 'Brainy',
      fileName: 'brainy-browser-bundle',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        dir: 'dist/browser',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js'
      }
    },
    sourcemap: true,
    minify: false, // Keep unminified for debugging
    outDir: 'dist/browser'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    global: 'globalThis',
    'process.env': '{}'
  },
  optimizeDeps: {
    include: ['@huggingface/transformers', 'uuid', 'crypto-browserify', 'buffer']
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  }
})