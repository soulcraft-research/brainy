/**
 * Sequential Augmentation Pipeline
 *
 * This module provides a pipeline for executing augmentations in a specific sequence:
 * ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 *
 * It supports high-performance streaming data from WebSockets without blocking.
 * Optimized for Node.js 23.11+ using native WebStreams API.
 */
import { AugmentationResponse, WebSocketConnection } from './types/augmentations.js';
import { BrainyData } from './brainyData.js';
/**
 * Options for sequential pipeline execution
 */
export interface SequentialPipelineOptions {
    /**
     * Timeout for each augmentation execution in milliseconds
     */
    timeout?: number;
    /**
     * Whether to stop execution if an error occurs
     */
    stopOnError?: boolean;
    /**
     * BrainyData instance to use for storage
     */
    brainyData?: BrainyData;
}
/**
 * Result of a pipeline execution
 */
export interface PipelineResult<T> {
    /**
     * Whether the pipeline execution was successful
     */
    success: boolean;
    /**
     * The data returned by the pipeline
     */
    data: T;
    /**
     * Error message if the pipeline execution failed
     */
    error?: string;
    /**
     * Results from each stage of the pipeline
     */
    stageResults: {
        sense?: AugmentationResponse<unknown>;
        memory?: AugmentationResponse<unknown>;
        cognition?: AugmentationResponse<unknown>;
        conduit?: AugmentationResponse<unknown>;
        activation?: AugmentationResponse<unknown>;
        perception?: AugmentationResponse<unknown>;
    };
}
/**
 * SequentialPipeline class
 *
 * Executes augmentations in a specific sequence:
 * ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 */
export declare class SequentialPipeline {
    private brainyData;
    /**
     * Create a new sequential pipeline
     *
     * @param options Options for the pipeline
     */
    constructor(options?: SequentialPipelineOptions);
    /**
     * Ensure stream classes are initialized
     * @private
     */
    private ensureStreamClassesInitialized;
    /**
     * Initialize the pipeline
     *
     * @returns A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;
    /**
     * Process data through the sequential pipeline
     *
     * @param rawData The raw data to process
     * @param dataType The type of data (e.g., 'text', 'image', 'audio')
     * @param options Options for pipeline execution
     * @returns A promise that resolves with the pipeline result
     */
    processData(rawData: Buffer | string, dataType: string, options?: SequentialPipelineOptions): Promise<PipelineResult<unknown>>;
    /**
     * Process WebSocket data through the sequential pipeline
     *
     * @param connection The WebSocket connection
     * @param dataType The type of data (e.g., 'text', 'image', 'audio')
     * @param options Options for pipeline execution
     * @returns A function to handle incoming WebSocket messages
     */
    createWebSocketHandler(connection: WebSocketConnection, dataType: string, options?: SequentialPipelineOptions): Promise<(data: unknown) => void>;
    /**
     * Set up a WebSocket connection to process data through the pipeline
     *
     * @param url The WebSocket URL to connect to
     * @param dataType The type of data (e.g., 'text', 'image', 'audio')
     * @param options Options for pipeline execution
     * @returns A promise that resolves with the WebSocket connection and associated streams
     */
    setupWebSocketPipeline(url: string, dataType: string, options?: SequentialPipelineOptions): Promise<WebSocketConnection & {
        readableStream?: ReadableStream<unknown>;
        writableStream?: WritableStream<unknown>;
    }>;
}
export declare const sequentialPipeline: SequentialPipeline;
//# sourceMappingURL=sequentialPipeline.d.ts.map