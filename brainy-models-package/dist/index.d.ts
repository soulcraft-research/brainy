/**
 * @soulcraft/brainy-models
 *
 * Pre-bundled TensorFlow models for maximum reliability with Brainy vector database.
 * This package provides offline access to the Universal Sentence Encoder model,
 * eliminating network dependencies and ensuring consistent performance.
 */
import * as tf from '@tensorflow/tfjs';
export interface ModelMetadata {
    name: string;
    version: string;
    description: string;
    dimensions: number;
    downloadDate: string;
    source: string;
    approach: string;
    modelUrl: string;
    bundledLocally: boolean;
    reliability: string;
}
export interface BundledModelOptions {
    verbose?: boolean;
    preferCompressed?: boolean;
}
/**
 * Bundled Universal Sentence Encoder for offline use
 */
export declare class BundledUniversalSentenceEncoder {
    private model;
    private metadata;
    private options;
    constructor(options?: BundledModelOptions);
    /**
     * Load the bundled model from local files
     */
    load(): Promise<void>;
    /**
     * Generate embeddings for the given texts
     */
    embed(texts: string[]): Promise<tf.Tensor2D>;
    /**
     * Generate embeddings and return as JavaScript arrays
     */
    embedToArrays(texts: string[]): Promise<number[][]>;
    /**
     * Get model metadata
     */
    getMetadata(): ModelMetadata | null;
    /**
     * Check if the model is loaded
     */
    isLoaded(): boolean;
    /**
     * Get model information
     */
    getModelInfo(): {
        inputShape: number[];
        outputShape: number[];
    } | null;
    /**
     * Dispose of the model and free memory
     */
    dispose(): void;
}
/**
 * Model compression utilities
 */
export declare class ModelCompressor {
    /**
     * Compress model weights using quantization
     * Note: TensorFlow.js doesn't currently support model quantization
     */
    static quantizeModel(modelPath: string, outputPath: string, options?: {
        dtype?: 'int8' | 'int16';
    }): Promise<void>;
    /**
     * Get model size information by reading files from disk
     */
    static getModelSize(modelPath: string): Promise<{
        totalSize: number;
        weightsSize: number;
        modelJsonSize: number;
    }>;
}
/**
 * Utility functions
 */
export declare const utils: {
    /**
     * Check if bundled models are available
     */
    checkModelsAvailable(): boolean;
    /**
     * Get bundled models directory
     */
    getModelsDirectory(): string;
    /**
     * List available bundled models
     */
    listAvailableModels(): string[];
};
export default BundledUniversalSentenceEncoder;
//# sourceMappingURL=index.d.ts.map