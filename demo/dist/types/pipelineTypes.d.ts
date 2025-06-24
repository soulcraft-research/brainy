/**
 * Pipeline Types
 *
 * This module provides shared types for the pipeline system to avoid circular dependencies.
 */
import { BrainyAugmentations, IWebSocketSupport, IAugmentation } from './augmentations.js';
/**
 * Type definitions for the augmentation registry
 */
export type AugmentationRegistry = {
    sense: BrainyAugmentations.ISenseAugmentation[];
    conduit: BrainyAugmentations.IConduitAugmentation[];
    cognition: BrainyAugmentations.ICognitionAugmentation[];
    memory: BrainyAugmentations.IMemoryAugmentation[];
    perception: BrainyAugmentations.IPerceptionAugmentation[];
    dialog: BrainyAugmentations.IDialogAugmentation[];
    activation: BrainyAugmentations.IActivationAugmentation[];
    webSocket: IWebSocketSupport[];
};
/**
 * Interface for the Pipeline class
 * This is used to break circular dependencies between pipeline.ts and augmentationRegistry.ts
 */
export interface IPipeline {
    register<T extends IAugmentation>(augmentation: T): IPipeline;
}
//# sourceMappingURL=pipelineTypes.d.ts.map