# LLM Augmentation for Brainy

This document describes the LLM (Language Learning Model) augmentation for Brainy, which enables creating, training, testing, exporting, and deploying language models from the data in Brainy's graph database.

## Overview

The LLM augmentation extends Brainy with the ability to create and train language models using the nouns and verbs stored in the graph database. It leverages TensorFlow.js to provide cross-platform compatibility, working in both browser and Node.js environments.

The augmentation consists of two main components:

1. **LLMCognitionAugmentation**: A cognition augmentation that provides the core functionality for creating, training, testing, exporting, and deploying LLM models.
2. **LLMActivationAugmentation**: An activation augmentation that provides action triggers for the LLM functionality, making it accessible through the augmentation pipeline.

## Features

- **Create LLM Models**: Create simple sequence models or transformer models with customizable parameters.
- **Train Models**: Train models on the nouns and verbs in Brainy's database with configurable training options.
- **Test Models**: Evaluate model performance and generate sample predictions.
- **Export Models**: Export trained models in various formats (TFJS, JSON) for use in different environments.
- **Deploy Models**: Deploy models to browser, Node.js, or cloud environments.
- **Generate Text**: Use trained models to generate text based on input prompts.

## Installation

The LLM augmentation is included as an optional component in the Brainy package. No additional installation is required if you have already installed Brainy.

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

## Usage

### Basic Usage

```javascript
import { BrainyData, augmentationPipeline } from '@soulcraft/brainy'
import { createLLMAugmentations } from '@soulcraft/brainy/src/augmentations/llmAugmentations.js'

// Initialize Brainy
const db = new BrainyData()
await db.init()

// Create LLM augmentations
const { cognition, activation } = await createLLMAugmentations({
  cognitionName: 'my-llm-cognition',
  activationName: 'my-llm-activation',
  brainyDb: db
})

// Register augmentations with the pipeline
augmentationPipeline.register(cognition)
augmentationPipeline.register(activation)

// Create a model
const createResult = await cognition.createModel({
  name: 'my-model',
  modelType: 'simple',
  vocabSize: 5000,
  embeddingDim: 64,
  hiddenDim: 128,
  numLayers: 1
})

const modelId = createResult.data.modelId

// Train the model
await cognition.trainModel(modelId, {
  maxSamples: 100,
  validationSplit: 0.2
})

// Generate text
const generateResult = await cognition.generateText(modelId, 'What is a', {
  temperature: 0.7
})

console.log(`Generated text: ${generateResult.data}`)
```

### Using the Augmentation Pipeline

```javascript
// Create a model through the pipeline
const pipelineCreateResult = await augmentationPipeline.executeCognitionPipeline(
  'createModel',
  [{
    name: 'pipeline-model',
    modelType: 'transformer',
    numHeads: 2,
    numLayers: 1
  }]
)

if (pipelineCreateResult[0] && (await pipelineCreateResult[0]).success) {
  const pipelineModelId = (await pipelineCreateResult[0]).data.modelId
  
  // Train the model through the pipeline
  await augmentationPipeline.executeCognitionPipeline(
    'trainModel',
    [pipelineModelId, { maxSamples: 50 }]
  )
}
```

## API Reference

### LLMCognitionAugmentation

#### Creating Models

```javascript
createModel(config: Partial<LLMModelConfig>): Promise<AugmentationResponse<{ modelId: string, metadata: LLMModelMetadata }>>
```

Creates a new LLM model with the specified configuration.

**Parameters:**
- `config`: Configuration options for the model
  - `name`: Name of the model (optional, auto-generated if not provided)
  - `description`: Description of the model (optional)
  - `modelType`: Type of model to create ('simple', 'transformer', or 'custom')
  - `vocabSize`: Size of the vocabulary (default: 10000)
  - `embeddingDim`: Dimension of the embedding vectors (default: 128)
  - `hiddenDim`: Dimension of the hidden layers (default: 256)
  - `numLayers`: Number of layers in the model (default: 2)
  - `numHeads`: Number of attention heads for transformer models (default: 4)
  - `dropoutRate`: Dropout rate for regularization (default: 0.1)
  - `maxSequenceLength`: Maximum sequence length for input (default: 100)
  - `learningRate`: Learning rate for training (default: 0.001)
  - `batchSize`: Batch size for training (default: 32)
  - `epochs`: Number of training epochs (default: 10)
  - `customModelPath`: Path to a custom model (required for 'custom' modelType)

**Returns:**
- `modelId`: Unique identifier for the created model
- `metadata`: Metadata about the model

#### Training Models

```javascript
trainModel(modelId: string, options: LLMTrainingOptions): Promise<AugmentationResponse<{ modelId: string, metadata: LLMModelMetadata, trainingHistory: tf.History }>>
```

Trains an LLM model on Brainy data.

**Parameters:**
- `modelId`: ID of the model to train
- `options`: Training options
  - `nounTypes`: Types of nouns to include in training (default: all)
  - `verbTypes`: Types of verbs to include in training (default: all)
  - `maxSamples`: Maximum number of training samples (default: all)
  - `validationSplit`: Fraction of data to use for validation (default: 0.2)
  - `includeMetadata`: Whether to include metadata in training (default: false)
  - `includeEmbeddings`: Whether to include embeddings in training (default: false)
  - `augmentData`: Whether to augment training data (default: false)
  - `earlyStoppingPatience`: Number of epochs with no improvement before stopping (default: 3)

**Returns:**
- `modelId`: ID of the trained model
- `metadata`: Updated metadata about the model
- `trainingHistory`: Training history with metrics

#### Testing Models

```javascript
testModel(modelId: string, options: LLMTestingOptions): Promise<AugmentationResponse<{ modelId: string, metrics: Record<string, number>, samples?: Array<{ input: string, expected: string, generated: string }> }>>
```

Tests an LLM model on Brainy data.

**Parameters:**
- `modelId`: ID of the model to test
- `options`: Testing options
  - `testSize`: Number of test samples (default: 100)
  - `randomSeed`: Random seed for reproducibility (optional)
  - `metrics`: Metrics to calculate (default: ['accuracy', 'loss'])
  - `generateSamples`: Whether to generate sample predictions (default: false)
  - `sampleCount`: Number of samples to generate (default: 5)

**Returns:**
- `modelId`: ID of the tested model
- `metrics`: Test metrics (accuracy, loss, etc.)
- `samples`: Sample predictions (if generateSamples is true)

#### Exporting Models

```javascript
exportModel(modelId: string, options: LLMExportOptions): Promise<AugmentationResponse<{ modelId: string, format: string, exportPath?: string, modelJSON?: string }>>
```

Exports an LLM model for deployment.

**Parameters:**
- `modelId`: ID of the model to export
- `options`: Export options
  - `format`: Export format ('tfjs', 'onnx', 'savedmodel', 'json')
  - `quantize`: Whether to quantize the model (default: false)
  - `outputPath`: Path to save the exported model (optional)
  - `includeMetadata`: Whether to include metadata (default: false)
  - `includeVocab`: Whether to include vocabulary (default: false)

**Returns:**
- `modelId`: ID of the exported model
- `format`: Export format
- `exportPath`: Path where the model was saved (if outputPath was provided)
- `modelJSON`: JSON representation of the model (if outputPath was not provided)

#### Deploying Models

```javascript
deployModel(modelId: string, options: LLMDeploymentOptions): Promise<AugmentationResponse<{ modelId: string, deploymentTarget: string, deploymentUrl?: string, status: string }>>
```

Deploys an LLM model to the specified target.

**Parameters:**
- `modelId`: ID of the model to deploy
- `options`: Deployment options
  - `target`: Deployment target ('browser', 'node', 'cloud')
  - `cloudProvider`: Cloud provider for cloud deployment ('aws', 'gcp', 'azure')
  - `endpoint`: Endpoint URL for cloud deployment
  - `apiKey`: API key for cloud deployment
  - `region`: Region for cloud deployment
  - `containerize`: Whether to containerize the model (default: false)
  - `autoScale`: Whether to enable auto-scaling (default: false)
  - `memory`: Memory allocation for deployment
  - `cpu`: CPU allocation for deployment

**Returns:**
- `modelId`: ID of the deployed model
- `deploymentTarget`: Target where the model was deployed
- `deploymentUrl`: URL where the model is accessible (for cloud deployments)
- `status`: Deployment status

#### Generating Text

```javascript
generateText(modelId: string, prompt: string, options: { maxLength?: number, temperature?: number, topK?: number }): Promise<AugmentationResponse<string>>
```

Generates text using the LLM model.

**Parameters:**
- `modelId`: ID of the model to use
- `prompt`: Input prompt for text generation
- `options`: Generation options
  - `maxLength`: Maximum length of generated text (default: model-dependent)
  - `temperature`: Temperature for sampling (default: 1.0)
  - `topK`: Number of top tokens to consider (default: all)

**Returns:**
- Generated text

### LLMActivationAugmentation

The activation augmentation provides action triggers for the LLM functionality, making it accessible through the augmentation pipeline. It supports the following actions:

- `createModel`: Creates a new LLM model
- `trainModel`: Trains an LLM model
- `testModel`: Tests an LLM model
- `exportModel`: Exports an LLM model
- `deployModel`: Deploys an LLM model
- `generateText`: Generates text using an LLM model

## Model Types

### Simple Sequence Model

A simple sequence model with an embedding layer, LSTM layers, and a dense output layer. This model is suitable for simpler language modeling tasks and requires less computational resources.

### Transformer Model

A transformer model with multi-head attention, suitable for more complex language modeling tasks. This model can capture longer-range dependencies in text but requires more computational resources.

## Limitations

- The current implementation is focused on training small language models suitable for specific domains rather than large general-purpose models.
- Training large models in the browser may be limited by available memory and computational resources.
- Cloud deployment functionality is a placeholder and requires additional implementation for specific cloud providers.
- ONNX export is not implemented in the current version.

## Examples

See the [llmAugmentationExample.js](../examples/llmAugmentationExample.js) file for a complete example of using the LLM augmentation.

## Future Enhancements

- Support for larger model architectures
- Improved training efficiency for browser environments
- Full implementation of cloud deployment options
- Support for ONNX export
- Fine-tuning of pre-trained models
- More advanced text generation capabilities
