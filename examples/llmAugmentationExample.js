/**
 * LLM Augmentation Example
 * 
 * This example demonstrates how to use the LLM augmentation to create, train, test,
 * export, and deploy an LLM model from the data in Brainy (nouns and verbs).
 */

import { BrainyData, augmentationPipeline } from '@soulcraft/brainy'
import { createLLMAugmentations } from '@soulcraft/brainy/src/augmentations/llmAugmentations.js'

// Main function to run the example
async function runLLMExample() {
  console.log('Starting LLM Augmentation Example')

  try {
    // Initialize Brainy
    const db = new BrainyData()
    await db.init()
    
    // Add some sample data if the database is empty
    await populateSampleData(db)
    
    // Create LLM augmentations
    const { cognition, activation } = await createLLMAugmentations({
      cognitionName: 'my-llm-cognition',
      activationName: 'my-llm-activation',
      brainyDb: db
    })
    
    // Register augmentations with the pipeline
    augmentationPipeline.register(cognition)
    augmentationPipeline.register(activation)
    
    console.log('LLM augmentations registered successfully')
    
    // Create a simple LLM model
    const createModelResult = await cognition.createModel({
      name: 'my-first-llm',
      description: 'A simple LLM model trained on Brainy data',
      modelType: 'simple',
      vocabSize: 5000,
      embeddingDim: 64,
      hiddenDim: 128,
      numLayers: 1,
      maxSequenceLength: 50,
      epochs: 5
    })
    
    if (!createModelResult.success) {
      throw new Error(`Failed to create model: ${createModelResult.error}`)
    }
    
    const { modelId } = createModelResult.data
    console.log(`Created model with ID: ${modelId}`)
    
    // Train the model
    console.log('Training model...')
    const trainResult = await cognition.trainModel(modelId, {
      maxSamples: 100,
      validationSplit: 0.2,
      earlyStoppingPatience: 2
    })
    
    if (!trainResult.success) {
      throw new Error(`Failed to train model: ${trainResult.error}`)
    }
    
    console.log('Model trained successfully')
    console.log('Training metrics:', trainResult.data.metadata.performance)
    
    // Test the model
    console.log('Testing model...')
    const testResult = await cognition.testModel(modelId, {
      testSize: 20,
      generateSamples: true,
      sampleCount: 3
    })
    
    if (!testResult.success) {
      throw new Error(`Failed to test model: ${testResult.error}`)
    }
    
    console.log('Model tested successfully')
    console.log('Test metrics:', testResult.data.metrics)
    
    if (testResult.data.samples) {
      console.log('Sample predictions:')
      for (const sample of testResult.data.samples) {
        console.log(`Input: "${sample.input}"`)
        console.log(`Expected: "${sample.expected}"`)
        console.log(`Generated: "${sample.generated}"`)
        console.log('---')
      }
    }
    
    // Generate text with the model
    console.log('Generating text...')
    const generateResult = await cognition.generateText(modelId, 'What is a', {
      temperature: 0.7,
      topK: 5
    })
    
    if (generateResult.success) {
      console.log(`Generated text: "${generateResult.data}"`)
    } else {
      console.error(`Failed to generate text: ${generateResult.error}`)
    }
    
    // Export the model
    console.log('Exporting model...')
    const exportResult = await cognition.exportModel(modelId, {
      format: 'json',
      includeMetadata: true,
      includeVocab: true
    })
    
    if (!exportResult.success) {
      throw new Error(`Failed to export model: ${exportResult.error}`)
    }
    
    console.log(`Model exported in ${exportResult.data.format} format`)
    
    // Deploy the model (browser example)
    console.log('Deploying model to browser...')
    const deployResult = await cognition.deployModel(modelId, {
      target: 'browser'
    })
    
    if (!deployResult.success) {
      throw new Error(`Failed to deploy model: ${deployResult.error}`)
    }
    
    console.log(`Model deployed to ${deployResult.data.deploymentTarget}`)
    console.log(`Deployment status: ${deployResult.data.status}`)
    
    // Using the activation augmentation through the pipeline
    console.log('Using activation augmentation through pipeline...')
    
    // Create a new model through the pipeline
    const pipelineCreateResult = await augmentationPipeline.executeCognitionPipeline(
      'createModel',
      [{
        name: 'pipeline-llm',
        modelType: 'transformer',
        numHeads: 2,
        numLayers: 1
      }]
    )
    
    if (pipelineCreateResult[0] && (await pipelineCreateResult[0]).success) {
      const pipelineModelId = (await pipelineCreateResult[0]).data.modelId
      console.log(`Created model through pipeline with ID: ${pipelineModelId}`)
      
      // Train the model through the pipeline
      const pipelineTrainResult = await augmentationPipeline.executeCognitionPipeline(
        'trainModel',
        [pipelineModelId, { maxSamples: 50 }]
      )
      
      if (pipelineTrainResult[0] && (await pipelineTrainResult[0]).success) {
        console.log('Model trained through pipeline successfully')
      }
    }
    
    console.log('LLM Augmentation Example completed successfully')
  } catch (error) {
    console.error('Error in LLM Augmentation Example:', error)
  }
}

// Helper function to populate sample data
async function populateSampleData(db) {
  const status = await db.status()
  
  // Only add sample data if the database is empty
  if (status.nounCount === 0) {
    console.log('Adding sample data to Brainy...')
    
    // Add some nouns (entities)
    const cat = await db.add('Cats are independent pets', { noun: 'thing', category: 'animal' })
    const dog = await db.add('Dogs are loyal companions', { noun: 'thing', category: 'animal' })
    const house = await db.add('Houses provide shelter for people', { noun: 'place', category: 'building' })
    const john = await db.add('John is a software developer', { noun: 'person', category: 'professional' })
    const mary = await db.add('Mary is a data scientist', { noun: 'person', category: 'professional' })
    const coding = await db.add('Coding is the process of creating software', { noun: 'concept', category: 'technology' })
    const meeting = await db.add('Team meetings are held every Monday', { noun: 'event', category: 'work' })
    
    // Add some verbs (relationships)
    await db.addVerb(john, house, { verb: 'owns', description: 'John owns the house' })
    await db.addVerb(john, dog, { verb: 'owns', description: 'John owns a dog' })
    await db.addVerb(mary, cat, { verb: 'owns', description: 'Mary owns a cat' })
    await db.addVerb(john, coding, { verb: 'created', description: 'John created code' })
    await db.addVerb(mary, coding, { verb: 'created', description: 'Mary created code' })
    await db.addVerb(john, meeting, { verb: 'created', description: 'John organized the meeting' })
    await db.addVerb(mary, meeting, { verb: 'memberOf', description: 'Mary is part of the meeting' })
    await db.addVerb(john, mary, { verb: 'worksWith', description: 'John works with Mary' })
    
    console.log('Sample data added successfully')
  } else {
    console.log('Database already contains data, skipping sample data creation')
  }
}

// Run the example
runLLMExample().catch(console.error)
