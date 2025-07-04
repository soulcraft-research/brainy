# Running the Brainy Demo

The Brainy interactive demo showcases the library's features in a web browser. Follow these steps to run it:

## Prerequisites

- Make sure you have Node.js installed (version 23.0.0 or higher)
- Ensure the project is built (run both `npm run build` and `npm run build:browser`)

## Running the Demo

### Option 1: Using the npm script (recommended)

Run the following command from the project root:

```bash
npm run demo
```

This will start an HTTP server and automatically open the demo in your default browser.

### Option 2: Manual setup

1. Start an HTTP server in the project root:

```bash
npx http-server
```

2. Open your browser and navigate to:
   http://localhost:8080/demo/index.html

## Troubleshooting

If you see the error "Could not load Brainy library. Please ensure the project is built and served over HTTP", check the
following:

1. Make sure you've built the project with `npm run build:all`
2. Ensure you're accessing the demo through HTTP (not by opening the file directly)
3. Check your browser's console for additional error messages

If issues persist, try clearing your browser cache or using a private/incognito window.

## Build Process

The Brainy library uses a two-step build process:

1. `npm run build` - Compiles TypeScript files to JavaScript (used for Node.js environments)
2. `npm run build:browser` - Creates a browser-compatible bundle using Rollup

You can run both steps together with:

```bash
npm run build && npm run build:browser
```

Or simply use the demo script which does this for you:

```bash
npm run demo
```

The browser bundle is created from `src/unified.ts`, which provides environment detection and adapts to browser,
Node.js, or serverless environments. This unified approach ensures that the library works correctly across all
environments.
