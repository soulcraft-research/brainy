/**
 * Global type declarations for Brainy
 */

import { TensorFlowUtilObject } from './tensorflowTypes'

declare global {
  // These declarations are needed for the project
  // eslint-disable-next-line no-var
  var __vitest__: any
  // eslint-disable-next-line no-var
  var __TextEncoder__: typeof TextEncoder
  // eslint-disable-next-line no-var
  var __TextDecoder__: typeof TextDecoder
  // eslint-disable-next-line no-var
  var __brainy_util__: any
  // eslint-disable-next-line no-var
  var _utilShim: any
  // eslint-disable-next-line no-var
  var __utilShim: any
  
  namespace NodeJS {
    interface Global {
      util?: TensorFlowUtilObject
      TextDecoder?: typeof TextDecoder
      TextEncoder?: typeof TextEncoder
    }
  }
  
  // Add compatibility for TextDecoder in utils
  interface TextDecoderOptions {
    fatal?: boolean
    ignoreBOM?: boolean
  }
  
  interface TextDecodeOptions {
    stream?: boolean
  }
  
  interface TextDecoder {
    readonly encoding: string
    readonly fatal: boolean
    readonly ignoreBOM: boolean
    decode(input?: ArrayBuffer | ArrayBufferView | null, options?: TextDecodeOptions): string
  }
  
  interface TextEncoder {
    readonly encoding: string
    encode(input?: string): Uint8Array
    encodeInto(input: string, output: Uint8Array): { read: number, written: number }
  }
}

export {}
