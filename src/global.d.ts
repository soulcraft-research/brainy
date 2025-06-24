/**
 * Global type declarations for Brainy
 */

// Extend the globalThis interface to include the __ENV__ property
declare global {
  var __ENV__: {
    isBrowser: boolean;
    isNode: string | false;
    isServerless: boolean;
  };
}

// This export is needed to make this file a module
export {};
