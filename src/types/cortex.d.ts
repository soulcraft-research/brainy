/**
 * Type declarations for Cortex and augmentation system
 */

import { BrainyDataInterface } from './brainyDataInterface.js'
import { Augmentation } from './augmentations.js'

declare module './brainyDataInterface.js' {
  interface BrainyDataInterface<T = unknown> {
    // Augmentation methods
    addAugmentation?(augmentation: Augmentation): void
    removeAugmentation?(id: string): void
    hasAugmentation?(id: string): boolean
    
    // Event methods (for webhook integration)
    on?(event: string, handler: (data: any) => void): void
    off?(event: string, handler: (data: any) => void): void
    emit?(event: string, data: any): void
  }
}