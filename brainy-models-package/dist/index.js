/**
 * @soulcraft/brainy-models
 *
 * Pre-bundled TensorFlow models for maximum reliability with Brainy vector database.
 * This package provides offline access to the Universal Sentence Encoder model,
 * eliminating network dependencies and ensuring consistent performance.
 */
import * as tf from '@tensorflow/tfjs';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
/**
 * Helper function to safely extract error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return String(error);
}
// Get the package directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');
const MODELS_DIR = join(PACKAGE_ROOT, 'models');
/**
 * Bundled Universal Sentence Encoder for offline use
 */
export class BundledUniversalSentenceEncoder {
    model = null;
    metadata = null;
    options;
    constructor(options = {}) {
        this.options = {
            verbose: false,
            preferCompressed: false,
            ...options
        };
    }
    /**
     * Load the bundled model from local files
     */
    async load() {
        try {
            const modelDir = join(MODELS_DIR, 'universal-sentence-encoder');
            const modelPath = join(modelDir, 'model.json');
            const metadataPath = join(modelDir, 'metadata.json');
            if (!existsSync(modelPath)) {
                throw new Error(`Bundled model not found at ${modelPath}. ` +
                    'Please run "npm run download-models" to download the model files.');
            }
            if (this.options.verbose) {
                console.log('🔄 Loading bundled Universal Sentence Encoder model...');
            }
            // Load metadata
            if (existsSync(metadataPath)) {
                const metadataContent = readFileSync(metadataPath, 'utf8');
                this.metadata = JSON.parse(metadataContent);
                if (this.options.verbose) {
                    console.log(`📋 Model metadata:`, this.metadata);
                }
            }
            // Load the model
            this.model = await tf.loadGraphModel(`file://${modelPath}`);
            if (this.options.verbose) {
                console.log('✅ Bundled model loaded successfully');
                console.log(`🔒 Reliability: Maximum (fully offline)`);
            }
        }
        catch (error) {
            throw new Error(`Failed to load bundled model: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Generate embeddings for the given texts
     */
    async embed(texts) {
        if (!this.model) {
            throw new Error('Model not loaded. Call load() first.');
        }
        try {
            // Convert texts to tensor
            const inputTensor = tf.tensor1d(texts, 'string');
            // Run inference
            const embeddings = this.model.predict(inputTensor);
            // Clean up input tensor
            inputTensor.dispose();
            return embeddings;
        }
        catch (error) {
            throw new Error(`Failed to generate embeddings: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Generate embeddings and return as JavaScript arrays
     */
    async embedToArrays(texts) {
        const embeddings = await this.embed(texts);
        const arrays = await embeddings.array();
        embeddings.dispose();
        return arrays;
    }
    /**
     * Get model metadata
     */
    getMetadata() {
        return this.metadata;
    }
    /**
     * Check if the model is loaded
     */
    isLoaded() {
        return this.model !== null;
    }
    /**
     * Get model information
     */
    getModelInfo() {
        if (!this.model) {
            return null;
        }
        return {
            inputShape: this.model.inputs[0].shape || [],
            outputShape: this.model.outputs[0].shape || []
        };
    }
    /**
     * Dispose of the model and free memory
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    }
}
/**
 * Model compression utilities
 */
export class ModelCompressor {
    /**
     * Compress model weights using quantization
     * Note: TensorFlow.js doesn't currently support model quantization
     */
    static async quantizeModel(modelPath, outputPath, options = {}) {
        const { dtype = 'int8' } = options;
        try {
            console.log(`🔄 Loading model for quantization: ${modelPath}`);
            const model = await tf.loadGraphModel(`file://${modelPath}`);
            console.log(`🗜️ Quantizing model to ${dtype}...`);
            // TensorFlow.js doesn't have built-in quantization or model serialization APIs yet
            // This is a placeholder implementation that acknowledges the limitation
            console.warn('⚠️ Model quantization is not yet supported in TensorFlow.js');
            console.log(`📋 Model loaded successfully from: ${modelPath}`);
            console.log(`📋 Target output path: ${outputPath}`);
            console.log(`📋 Target dtype: ${dtype}`);
            model.dispose();
            throw new Error('Model quantization is not yet supported in TensorFlow.js. This feature requires server-side processing with TensorFlow Python.');
        }
        catch (error) {
            throw new Error(`Failed to compress model: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Get model size information by reading files from disk
     */
    static async getModelSize(modelPath) {
        try {
            // Load model to verify it's valid
            const model = await tf.loadGraphModel(`file://${modelPath}`);
            model.dispose();
            // Get model.json size
            const modelJsonSize = existsSync(modelPath) ? readFileSync(modelPath).length : 0;
            // Calculate weights size by reading weight files
            let weightsSize = 0;
            const modelDir = dirname(modelPath);
            // Read model.json to get weight file names
            if (existsSync(modelPath)) {
                const modelJson = JSON.parse(readFileSync(modelPath, 'utf8'));
                if (modelJson.weightsManifest) {
                    for (const manifest of modelJson.weightsManifest) {
                        for (const path of manifest.paths) {
                            const weightFilePath = join(modelDir, path);
                            if (existsSync(weightFilePath)) {
                                weightsSize += readFileSync(weightFilePath).length;
                            }
                        }
                    }
                }
            }
            const totalSize = weightsSize + modelJsonSize;
            return {
                totalSize,
                weightsSize,
                modelJsonSize
            };
        }
        catch (error) {
            throw new Error(`Failed to get model size: ${getErrorMessage(error)}`);
        }
    }
}
/**
 * Utility functions
 */
export const utils = {
    /**
     * Check if bundled models are available
     */
    checkModelsAvailable() {
        const modelPath = join(MODELS_DIR, 'universal-sentence-encoder', 'model.json');
        return existsSync(modelPath);
    },
    /**
     * Get bundled models directory
     */
    getModelsDirectory() {
        return MODELS_DIR;
    },
    /**
     * List available bundled models
     */
    listAvailableModels() {
        const models = [];
        const useModelPath = join(MODELS_DIR, 'universal-sentence-encoder', 'model.json');
        if (existsSync(useModelPath)) {
            models.push('universal-sentence-encoder');
        }
        return models;
    }
};
// Default export for convenience
export default BundledUniversalSentenceEncoder;
//# sourceMappingURL=index.js.map