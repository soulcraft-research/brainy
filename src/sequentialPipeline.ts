/**
 * Sequential Augmentation Pipeline
 *
 * This module provides a pipeline for executing augmentations in a specific sequence:
 * ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 *
 * It supports high-performance streaming data from WebSockets without blocking.
 */

import {
  AugmentationType,
  IAugmentation,
  IWebSocketSupport,
  ISenseAugmentation,
  IMemoryAugmentation,
  ICognitionAugmentation,
  IConduitAugmentation,
  IActivationAugmentation,
  IPerceptionAugmentation,
  AugmentationResponse,
  WebSocketConnection
} from './types/augmentations.js'
import { BrainyData } from './brainyData.js'
import { augmentationPipeline } from './augmentationPipeline.js'

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
 * Default pipeline options
 */
const DEFAULT_SEQUENTIAL_PIPELINE_OPTIONS: SequentialPipelineOptions = {
  timeout: 30000,
  stopOnError: false
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
  }
}

/**
 * SequentialPipeline class
 *
 * Executes augmentations in a specific sequence:
 * ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 */
export class SequentialPipeline {
  private brainyData: BrainyData;
  
  /**
   * Create a new sequential pipeline
   * 
   * @param options Options for the pipeline
   */
  constructor(options: SequentialPipelineOptions = {}) {
    this.brainyData = options.brainyData || new BrainyData();
  }
  
  /**
   * Initialize the pipeline
   * 
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    await this.brainyData.init();
  }
  
  /**
   * Process data through the sequential pipeline
   * 
   * @param rawData The raw data to process
   * @param dataType The type of data (e.g., 'text', 'image', 'audio')
   * @param options Options for pipeline execution
   * @returns A promise that resolves with the pipeline result
   */
  public async processData(
    rawData: Buffer | string,
    dataType: string,
    options: SequentialPipelineOptions = {}
  ): Promise<PipelineResult<unknown>> {
    const opts = { ...DEFAULT_SEQUENTIAL_PIPELINE_OPTIONS, ...options };
    const result: PipelineResult<unknown> = {
      success: true,
      data: null,
      stageResults: {}
    };
    
    try {
      // Step 1: Process raw data with ISense augmentations
      const senseResults = await augmentationPipeline.executeSensePipeline(
        'processRawData',
        [rawData, dataType],
        { timeout: opts.timeout, stopOnError: opts.stopOnError }
      );
      
      // Get the first successful result
      let senseResult: AugmentationResponse<{ nouns: string[], verbs: string[] }> | null = null;
      for (const resultPromise of senseResults) {
        const res = await resultPromise;
        if (res.success) {
          senseResult = res;
          break;
        }
      }
      
      if (!senseResult || !senseResult.success) {
        return {
          success: false,
          data: null,
          error: 'Failed to process raw data with ISense augmentations',
          stageResults: { sense: senseResult || { success: false, data: null, error: 'No sense augmentations available' } }
        };
      }
      
      result.stageResults.sense = senseResult;
      
      // Step 2: Store data in BrainyData using IMemory augmentations
      const memoryAugmentations = augmentationPipeline.getAugmentationsByType(AugmentationType.MEMORY) as IMemoryAugmentation[];
      
      if (memoryAugmentations.length === 0) {
        return {
          success: false,
          data: null,
          error: 'No memory augmentations available',
          stageResults: result.stageResults
        };
      }
      
      // Use the first available memory augmentation
      const memoryAugmentation = memoryAugmentations[0];
      
      // Generate a key for the data
      const dataKey = `data_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Store the data
      const memoryResult = await memoryAugmentation.storeData(
        dataKey,
        {
          rawData,
          dataType,
          nouns: senseResult.data.nouns,
          verbs: senseResult.data.verbs,
          timestamp: Date.now()
        }
      );
      
      if (!memoryResult.success) {
        return {
          success: false,
          data: null,
          error: `Failed to store data: ${memoryResult.error}`,
          stageResults: { ...result.stageResults, memory: memoryResult }
        };
      }
      
      result.stageResults.memory = memoryResult;
      
      // Step 3: Trigger ICognition augmentations to analyze the data
      const cognitionResults = await augmentationPipeline.executeCognitionPipeline(
        'reason',
        [`Analyze data with key ${dataKey}`, { dataKey }],
        { timeout: opts.timeout, stopOnError: opts.stopOnError }
      );
      
      // Get the first successful result
      let cognitionResult: AugmentationResponse<{ inference: string, confidence: number }> | null = null;
      for (const resultPromise of cognitionResults) {
        const res = await resultPromise;
        if (res.success) {
          cognitionResult = res;
          break;
        }
      }
      
      if (cognitionResult) {
        result.stageResults.cognition = cognitionResult;
      }
      
      // Step 4: Send notifications to IConduit augmentations
      const conduitResults = await augmentationPipeline.executeConduitPipeline(
        'writeData',
        [{ dataKey, nouns: senseResult.data.nouns, verbs: senseResult.data.verbs }],
        { timeout: opts.timeout, stopOnError: opts.stopOnError }
      );
      
      // Get the first successful result
      let conduitResult: AugmentationResponse<unknown> | null = null;
      for (const resultPromise of conduitResults) {
        const res = await resultPromise;
        if (res.success) {
          conduitResult = res;
          break;
        }
      }
      
      if (conduitResult) {
        result.stageResults.conduit = conduitResult;
      }
      
      // Step 5: Send notifications to IActivation augmentations
      const activationResults = await augmentationPipeline.executeActivationPipeline(
        'triggerAction',
        ['dataProcessed', { dataKey }],
        { timeout: opts.timeout, stopOnError: opts.stopOnError }
      );
      
      // Get the first successful result
      let activationResult: AugmentationResponse<unknown> | null = null;
      for (const resultPromise of activationResults) {
        const res = await resultPromise;
        if (res.success) {
          activationResult = res;
          break;
        }
      }
      
      if (activationResult) {
        result.stageResults.activation = activationResult;
      }
      
      // Step 6: Send notifications to IPerception augmentations
      const perceptionResults = await augmentationPipeline.executePerceptionPipeline(
        'interpret',
        [senseResult.data.nouns, senseResult.data.verbs, { dataKey }],
        { timeout: opts.timeout, stopOnError: opts.stopOnError }
      );
      
      // Get the first successful result
      let perceptionResult: AugmentationResponse<Record<string, unknown>> | null = null;
      for (const resultPromise of perceptionResults) {
        const res = await resultPromise;
        if (res.success) {
          perceptionResult = res;
          break;
        }
      }
      
      if (perceptionResult) {
        result.stageResults.perception = perceptionResult;
        result.data = perceptionResult.data;
      } else {
        // If no perception result, use the cognition result as the final data
        result.data = cognitionResult ? cognitionResult.data : { dataKey };
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Pipeline execution failed: ${error}`,
        stageResults: result.stageResults
      };
    }
  }
  
  /**
   * Process WebSocket data through the sequential pipeline
   * 
   * @param connection The WebSocket connection
   * @param dataType The type of data (e.g., 'text', 'image', 'audio')
   * @param options Options for pipeline execution
   * @returns A function to handle incoming WebSocket messages
   */
  public createWebSocketHandler(
    connection: WebSocketConnection,
    dataType: string,
    options: SequentialPipelineOptions = {}
  ): (data: unknown) => void {
    return (data: unknown) => {
      // Process the data asynchronously without blocking
      this.processData(
        typeof data === 'string' ? data : JSON.stringify(data),
        dataType,
        options
      ).catch(error => {
        console.error('Error processing WebSocket data:', error);
      });
    };
  }
  
  /**
   * Set up a WebSocket connection to process data through the pipeline
   * 
   * @param url The WebSocket URL to connect to
   * @param dataType The type of data (e.g., 'text', 'image', 'audio')
   * @param options Options for pipeline execution
   * @returns A promise that resolves with the WebSocket connection
   */
  public async setupWebSocketPipeline(
    url: string,
    dataType: string,
    options: SequentialPipelineOptions = {}
  ): Promise<WebSocketConnection> {
    // Get WebSocket-supporting augmentations
    const webSocketAugmentations = augmentationPipeline.getWebSocketAugmentations();
    
    if (webSocketAugmentations.length === 0) {
      throw new Error('No WebSocket-supporting augmentations available');
    }
    
    // Use the first available WebSocket augmentation
    const webSocketAugmentation = webSocketAugmentations[0];
    
    // Connect to the WebSocket
    const connection = await webSocketAugmentation.connectWebSocket(url);
    
    // Create a handler for incoming messages
    const handler = this.createWebSocketHandler(connection, dataType, options);
    
    // Register the handler
    await webSocketAugmentation.onWebSocketMessage(connection.connectionId, handler);
    
    return connection;
  }
}

// Create and export a default instance of the sequential pipeline
export const sequentialPipeline = new SequentialPipeline();
