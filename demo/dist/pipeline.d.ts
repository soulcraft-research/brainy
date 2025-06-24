/**
 * Unified Pipeline
 *
 * This module combines the functionality of the primary augmentation pipeline and the streamlined pipeline
 * into a single, unified pipeline system. It provides both the registry functionality of the primary pipeline
 * and the simplified execution API of the streamlined pipeline.
 */
import { IAugmentation, AugmentationType, AugmentationResponse, IWebSocketSupport, BrainyAugmentations } from './types/augmentations.js';
import { IPipeline } from './types/pipelineTypes.js';
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
 * Result of a pipeline execution
 */
export interface PipelineResult<T> {
    results: AugmentationResponse<T>[];
    errors: Error[];
    successful: AugmentationResponse<T>[];
}
/**
 * Pipeline class
 *
 * Manages multiple augmentations of each type and provides methods to execute them.
 * Implements the IPipeline interface to avoid circular dependencies.
 */
export declare class Pipeline implements IPipeline {
    private registry;
    /**
     * Register an augmentation with the pipeline
     *
     * @param augmentation The augmentation to register
     * @returns The pipeline instance for chaining
     */
    register<T extends IAugmentation>(augmentation: T): Pipeline;
    /**
     * Unregister an augmentation from the pipeline
     *
     * @param augmentationName The name of the augmentation to unregister
     * @returns The pipeline instance for chaining
     */
    unregister(augmentationName: string): Pipeline;
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
     * Executes a method on multiple augmentations using the specified execution mode
     *
     * @param augmentations The augmentations to execute the method on
     * @param method The method to execute
     * @param args The arguments to pass to the method
     * @param options Options for the execution
     * @returns A promise that resolves with the results
     */
    execute<T>(augmentations: IAugmentation[], method: string, args?: any[], options?: PipelineOptions): Promise<PipelineResult<T>>;
    /**
     * Executes a method on augmentations of a specific type
     *
     * @param type The type of augmentations to execute the method on
     * @param method The method to execute
     * @param args The arguments to pass to the method
     * @param options Options for the execution
     * @returns A promise that resolves with the results
     */
    executeByType<T>(type: AugmentationType, method: string, args?: any[], options?: PipelineOptions): Promise<PipelineResult<T>>;
    /**
     * Executes a method on a single augmentation with automatic error handling
     *
     * @param augmentation The augmentation to execute the method on
     * @param method The method to execute
     * @param args The arguments to pass to the method
     * @returns A promise that resolves with the result
     */
    executeSingle<T>(augmentation: IAugmentation, method: string, ...args: any[]): Promise<AugmentationResponse<T>>;
    /**
     * Process static data through a pipeline of augmentations
     *
     * @param data The data to process
     * @param pipeline An array of processing steps, each with an augmentation, method, and optional args transformer
     * @param options Options for the execution
     * @returns A promise that resolves with the final result
     */
    processStaticData<T, R = any>(data: T, pipeline: Array<{
        augmentation: IAugmentation;
        method: string;
        transformArgs?: (data: any, prevResult?: any) => any[];
    }>, options?: PipelineOptions): Promise<AugmentationResponse<R>>;
    /**
     * Process streaming data through a pipeline of augmentations
     *
     * @param source The source augmentation that provides the data stream
     * @param sourceMethod The method on the source augmentation that provides the data stream
     * @param sourceArgs The arguments to pass to the source method
     * @param pipeline An array of processing steps, each with an augmentation, method, and optional args transformer
     * @param callback Function to call with the results of processing each data item
     * @param options Options for the execution
     * @returns A promise that resolves when the pipeline is set up
     */
    processStreamingData<T>(source: IAugmentation, sourceMethod: string, sourceArgs: any[], pipeline: Array<{
        augmentation: IAugmentation;
        method: string;
        transformArgs?: (data: any, prevResult?: any) => any[];
    }>, callback: (result: AugmentationResponse<T>) => void, options?: PipelineOptions): Promise<void>;
    /**
     * Create a reusable pipeline for processing data
     *
     * @param pipeline An array of processing steps
     * @param options Options for the execution
     * @returns A function that processes data through the pipeline
     */
    createPipeline<T, R>(pipeline: Array<{
        augmentation: IAugmentation;
        method: string;
        transformArgs?: (data: any, prevResult?: any) => any[];
    }>, options?: PipelineOptions): (data: T) => Promise<AugmentationResponse<R>>;
    /**
     * Create a reusable streaming pipeline
     *
     * @param source The source augmentation
     * @param sourceMethod The method on the source augmentation
     * @param pipeline An array of processing steps
     * @param options Options for the execution
     * @returns A function that sets up the streaming pipeline
     */
    createStreamingPipeline<T, R>(source: IAugmentation, sourceMethod: string, pipeline: Array<{
        augmentation: IAugmentation;
        method: string;
        transformArgs?: (data: any, prevResult?: any) => any[];
    }>, options?: PipelineOptions): (sourceArgs: any[], callback: (result: AugmentationResponse<R>) => void) => Promise<void>;
    /**
     * Execute a sense pipeline (legacy method)
     */
    executeSensePipeline<M extends keyof BrainyAugmentations.ISenseAugmentation & string, R extends BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.ISenseAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a conduit pipeline (legacy method)
     */
    executeConduitPipeline<M extends keyof BrainyAugmentations.IConduitAugmentation & string, R extends BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IConduitAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a cognition pipeline (legacy method)
     */
    executeCognitionPipeline<M extends keyof BrainyAugmentations.ICognitionAugmentation & string, R extends BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.ICognitionAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a memory pipeline (legacy method)
     */
    executeMemoryPipeline<M extends keyof BrainyAugmentations.IMemoryAugmentation & string, R extends BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IMemoryAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a perception pipeline (legacy method)
     */
    executePerceptionPipeline<M extends keyof BrainyAugmentations.IPerceptionAugmentation & string, R extends BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IPerceptionAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute a dialog pipeline (legacy method)
     */
    executeDialogPipeline<M extends keyof BrainyAugmentations.IDialogAugmentation & string, R extends BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IDialogAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
    /**
     * Execute an activation pipeline (legacy method)
     */
    executeActivationPipeline<M extends keyof BrainyAugmentations.IActivationAugmentation & string, R extends BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never>(method: M & (BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => any ? M : never), args: Parameters<Extract<BrainyAugmentations.IActivationAugmentation[M], (...args: any[]) => any>>, options?: PipelineOptions): Promise<Promise<{
        success: boolean;
        data: R;
        error?: string;
    }>[]>;
}
export declare const pipeline: Pipeline;
export declare const augmentationPipeline: Pipeline;
export declare const executeStreamlined: <T>(augmentations: IAugmentation[], method: string, args?: any[], options?: PipelineOptions) => Promise<PipelineResult<T>>;
export declare const executeByType: <T>(type: AugmentationType, method: string, args?: any[], options?: PipelineOptions) => Promise<PipelineResult<T>>;
export declare const executeSingle: <T>(augmentation: IAugmentation, method: string, ...args: any[]) => Promise<AugmentationResponse<T>>;
export declare const processStaticData: <T, R = any>(data: T, pipelineSteps: Array<{
    augmentation: IAugmentation;
    method: string;
    transformArgs?: (data: any, prevResult?: any) => any[];
}>, options?: PipelineOptions) => Promise<AugmentationResponse<R>>;
export declare const processStreamingData: <T>(source: IAugmentation, sourceMethod: string, sourceArgs: any[], pipelineSteps: Array<{
    augmentation: IAugmentation;
    method: string;
    transformArgs?: (data: any, prevResult?: any) => any[];
}>, callback: (result: AugmentationResponse<T>) => void, options?: PipelineOptions) => Promise<void>;
export declare const createPipeline: <T, R>(pipelineSteps: Array<{
    augmentation: IAugmentation;
    method: string;
    transformArgs?: (data: any, prevResult?: any) => any[];
}>, options?: PipelineOptions) => (data: T) => Promise<AugmentationResponse<R>>;
export declare const createStreamingPipeline: <T, R>(source: IAugmentation, sourceMethod: string, pipelineSteps: Array<{
    augmentation: IAugmentation;
    method: string;
    transformArgs?: (data: any, prevResult?: any) => any[];
}>, options?: PipelineOptions) => (sourceArgs: any[], callback: (result: AugmentationResponse<R>) => void) => Promise<void>;
export declare const StreamlinedExecutionMode: typeof ExecutionMode;
export type StreamlinedPipelineOptions = PipelineOptions;
export type StreamlinedPipelineResult<T> = PipelineResult<T>;
//# sourceMappingURL=pipeline.d.ts.map