/**
 * Augmentation Event Pipeline
 *
 * This module provides a pipeline for managing and executing multiple augmentations
 * of each type. It allows registering multiple augmentations and executing them
 * in sequence or in parallel.
 */
import { BrainyAugmentations, IAugmentation, IWebSocketSupport, AugmentationResponse, AugmentationType } from './types/augmentations.js';
/**
 * Execution mode for the pipeline
 */
export declare enum ExecutionMode {
    SEQUENTIAL = "sequential",
    PARALLEL = "parallel",
    FIRST_SUCCESS = "firstSuccess",
    FIRST_RESULT = "firstResult",
    THREADED = "threaded"
}
/**
 * Options for pipeline execution
 */
export interface PipelineOptions {
    mode?: ExecutionMode;
    timeout?: number;
    stopOnError?: boolean;
    forceThreading?: boolean;
    disableThreading?: boolean;
}
/**
 * AugmentationPipeline class
 *
 * Manages multiple augmentations of each type and provides methods to execute them.
 */
export declare class AugmentationPipeline {
    private registry;
    /**
     * Register an augmentation with the pipeline
     *
     * @param augmentation The augmentation to register
     * @returns The pipeline instance for chaining
     */
    register<T extends IAugmentation>(augmentation: T): AugmentationPipeline;
    /**
     * Unregister an augmentation from the pipeline
     *
     * @param augmentationName The name of the augmentation to unregister
     * @returns The pipeline instance for chaining
     */
    unregister(augmentationName: string): AugmentationPipeline;
    /**
     * Initialize all registered augmentations
     *
     * @returns A promise that resolves when all augmentations are initialized
     */
    initialize(): Promise<void>;
    /**
     * Shut down all registered augmentations
     *
     * @returns A promise that resolves when all augmentations are shut down
     */
    shutDown(): Promise<void>;
    /**
     * Execute a sense pipeline
     *
     * @param method The method to execute on each sense augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeSensePipeline<M extends keyof BrainyAugmentations.ISenseAugmentation & string, R extends BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.ISenseAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a conduit pipeline
     *
     * @param method The method to execute on each conduit augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeConduitPipeline<M extends keyof BrainyAugmentations.IConduitAugmentation & string, R extends BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IConduitAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a cognition pipeline
     *
     * @param method The method to execute on each cognition augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeCognitionPipeline<M extends keyof BrainyAugmentations.ICognitionAugmentation & string, R extends BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.ICognitionAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a memory pipeline
     *
     * @param method The method to execute on each memory augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeMemoryPipeline<M extends keyof BrainyAugmentations.IMemoryAugmentation & string, R extends BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IMemoryAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a perception pipeline
     *
     * @param method The method to execute on each perception augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executePerceptionPipeline<M extends keyof BrainyAugmentations.IPerceptionAugmentation & string, R extends BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IPerceptionAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a dialog pipeline
     *
     * @param method The method to execute on each dialog augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeDialogPipeline<M extends keyof BrainyAugmentations.IDialogAugmentation & string, R extends BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IDialogAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute an activation pipeline
     *
     * @param method The method to execute on each activation augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    executeActivationPipeline<M extends keyof BrainyAugmentations.IActivationAugmentation & string, R extends BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IActivationAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Get all registered augmentations
     *
     * @returns An array of all registered augmentations
     */
    getAllAugmentations(): IAugmentation[];
    /**
     * Get all augmentations of a specific type
     *
     * @param type The type of augmentation to get
     * @returns An array of all augmentations of the specified type
     */
    getAugmentationsByType(type: AugmentationType): IAugmentation[];
    /**
     * Get all available augmentation types
     *
     * @returns An array of all augmentation types that have at least one registered augmentation
     */
    getAvailableAugmentationTypes(): AugmentationType[];
    /**
     * Get all WebSocket-supporting augmentations
     *
     * @returns An array of all augmentations that support WebSocket connections
     */
    getWebSocketAugmentations(): IWebSocketSupport[];
    /**
     * Check if an augmentation is of a specific type
     *
     * @param augmentation The augmentation to check
     * @param methods The methods that should be present on the augmentation
     * @returns True if the augmentation is of the specified type
     */
    private isAugmentationType;
    /**
     * Determines if threading should be used based on options and environment
     *
     * @param options The pipeline options
     * @returns True if threading should be used, false otherwise
     */
    private shouldUseThreading;
    /**
     * Execute a pipeline for a specific augmentation type
     *
     * @param augmentations The augmentations to execute
     * @param method The method to execute on each augmentation
     * @param args The arguments to pass to the method
     * @param options The pipeline execution options
     * @returns A promise that resolves with the results from all augmentations
     */
    private executeTypedPipeline;
}
export declare const augmentationPipeline: AugmentationPipeline;
//# sourceMappingURL=augmentationPipeline.d.ts.map