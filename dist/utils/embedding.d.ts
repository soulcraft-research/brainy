/**
 * Embedding functions for converting data to vectors
 */
import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js';
/**
 * TensorFlow Universal Sentence Encoder embedding model
 * This model provides high-quality text embeddings using TensorFlow.js
 * The required TensorFlow.js dependencies are automatically installed with this package
 */
export declare class UniversalSentenceEncoder implements EmbeddingModel {
    private model;
    private initialized;
    private tf;
    private use;
    /**
     * Initialize the embedding model
     */
    init(): Promise<void>;
    /**
     * Embed text into a vector using Universal Sentence Encoder
     * @param data Text to embed
     */
    embed(data: string | string[]): Promise<Vector>;
    /**
     * Dispose of the model resources
     */
    dispose(): Promise<void>;
}
/**
 * Create an embedding function from an embedding model
 * @param model Embedding model to use
 */
export declare function createEmbeddingFunction(model: EmbeddingModel): EmbeddingFunction;
/**
 * Creates a TensorFlow-based Universal Sentence Encoder embedding function
 * This is the required embedding function for all text embeddings
 */
export declare function createTensorFlowEmbeddingFunction(): EmbeddingFunction;
/**
 * Creates a TensorFlow-based Universal Sentence Encoder embedding function that runs in a separate thread
 * This provides better performance for CPU-intensive embedding operations
 * @param options Configuration options
 * @returns An embedding function that runs in a separate thread
 */
export declare function createThreadedEmbeddingFunction(options?: {
    fallbackToMain?: boolean;
}): EmbeddingFunction;
/**
 * Default embedding function
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Uses threading when available for better performance
 */
export declare const defaultEmbeddingFunction: EmbeddingFunction;
//# sourceMappingURL=embedding.d.ts.map