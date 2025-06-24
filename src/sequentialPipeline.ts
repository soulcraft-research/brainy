/**
 * Sequential Augmentation Pipeline
 *
 * This module provides a pipeline for executing augmentations in a specific sequence:
 * ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 *
 * It supports high-performance streaming data from WebSockets without blocking.
 * Optimized for Node.js 23.11+ using native WebStreams API.
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
// Use the browser's built-in WebStreams API or Node.js native WebStreams API
// This approach ensures compatibility with both environments
let TransformStream: any, ReadableStream: any, WritableStream: any;

// Function to initialize the stream classes
const initializeStreamClasses = () => {
  // Try to use the browser's built-in WebStreams API first
  if (typeof globalThis.TransformStream !== 'undefined' &&
      typeof globalThis.ReadableStream !== 'undefined' &&
      typeof globalThis.WritableStream !== 'undefined') {
    TransformStream = globalThis.TransformStream;
    ReadableStream = globalThis.ReadableStream;
    WritableStream = globalThis.WritableStream;
    return Promise.resolve();
  } else {
    // In Node.js environment, try to import from node:stream/web
    // This will be executed in Node.js but not in browsers
    return import('node:stream/web')
      .then(streamWebModule => {
        TransformStream = streamWebModule.TransformStream;
        ReadableStream = streamWebModule.ReadableStream;
        WritableStream = streamWebModule.WritableStream;
      })
      .catch(error => {
        console.error('Failed to import WebStreams API:', error);
        // Provide fallback implementations or throw a more helpful error
        throw new Error('WebStreams API is not available in this environment. Please use a modern browser or Node.js 18+.');
      });
  }
};

// Initialize immediately but don't block module execution
const streamClassesPromise = initializeStreamClasses();

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
   * Ensure stream classes are initialized
   * @private
   */
  private async ensureStreamClassesInitialized(): Promise<void> {
    await streamClassesPromise;
  }

  /**
   * Initialize the pipeline
   * 
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    // Initialize stream classes and BrainyData in parallel
    await Promise.all([
      this.ensureStreamClassesInitialized(),
      this.brainyData.init()
    ]);
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
    } catch (error: unknown) {
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
  public async createWebSocketHandler(
    connection: WebSocketConnection,
    dataType: string,
    options: SequentialPipelineOptions = {}
  ): Promise<(data: unknown) => void> {
    // Ensure stream classes are initialized
    await this.ensureStreamClassesInitialized();

    // Create a transform stream for processing data
    const transformStream = new TransformStream({
      transform: async (chunk: unknown, controller: TransformStreamDefaultController) => {
        try {
          const data = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          const result = await this.processData(data, dataType, options);
          if (result.success) {
            controller.enqueue(result);
          } else {
            console.warn('Pipeline processing failed:', result.error);
          }
        } catch (error: unknown) {
          console.error('Error in transform stream:', error);
        }
      }
    });

    // Create a writable stream that will be the sink for our data
    const writableStream = new WritableStream({
      write: async (result: PipelineResult<unknown>) => {
        // Handle the processed result if needed
        if (connection.send && typeof connection.send === 'function') {
          try {
            // Only send back results if the connection supports it
            await connection.send(JSON.stringify(result));
          } catch (error: unknown) {
            console.error('Error sending result back to WebSocket:', error);
          }
        }
      }
    });

    // Connect the transform stream to the writable stream
    transformStream.readable.pipeTo(writableStream).catch((error: Error) => {
      console.error('Error in pipeline stream:', error);
    });

    // Return a function that writes to the transform stream
    return (data: unknown) => {
      try {
        // Write to the transform stream's writable side
        const writer = transformStream.writable.getWriter();
        writer.write(data).catch((error: Error) => {
          console.error('Error writing to stream:', error);
        }).finally(() => {
          writer.releaseLock();
        });
      } catch (error: unknown) {
        console.error('Error getting writer for transform stream:', error);
      }
    };
  }

  /**
   * Set up a WebSocket connection to process data through the pipeline
   * 
   * @param url The WebSocket URL to connect to
   * @param dataType The type of data (e.g., 'text', 'image', 'audio')
   * @param options Options for pipeline execution
   * @returns A promise that resolves with the WebSocket connection and associated streams
   */
  public async setupWebSocketPipeline(
    url: string,
    dataType: string,
    options: SequentialPipelineOptions = {}
  ): Promise<WebSocketConnection & { 
    readableStream?: ReadableStream<unknown>,
    writableStream?: WritableStream<unknown>
  }> {
    // Ensure stream classes are initialized
    await this.ensureStreamClassesInitialized();

    // Get WebSocket-supporting augmentations
    const webSocketAugmentations = augmentationPipeline.getWebSocketAugmentations();

    if (webSocketAugmentations.length === 0) {
      throw new Error('No WebSocket-supporting augmentations available');
    }

    // Use the first available WebSocket augmentation
    const webSocketAugmentation = webSocketAugmentations[0];

    // Connect to the WebSocket
    const connection = await webSocketAugmentation.connectWebSocket(url);

    // Create a readable stream from the WebSocket messages
    const readableStream = new ReadableStream({
      start: (controller: ReadableStreamDefaultController) => {
        // Define a message handler that writes to the stream
        const messageHandler = (event: { data: unknown }) => {
          try {
            const data = typeof event.data === 'string' 
              ? event.data 
              : event.data instanceof Blob 
                ? new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsText(event.data as Blob);
                  })
                : JSON.stringify(event.data);

            // Handle both string data and promises
            if (data instanceof Promise) {
              data.then(resolvedData => {
                controller.enqueue(resolvedData);
              }).catch((error: Error) => {
                console.error('Error processing blob data:', error);
              });
            } else {
              controller.enqueue(data);
            }
          } catch (error: unknown) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        // Create a wrapper function that adapts the event-based handler to the data-based callback
        const messageHandlerWrapper = (data: unknown) => {
          messageHandler({ data });
        };

        // Store both handlers for later cleanup
        connection._streamMessageHandler = messageHandler;
        connection._messageHandlerWrapper = messageHandlerWrapper;

        webSocketAugmentation.onWebSocketMessage(
          connection.connectionId, 
          messageHandlerWrapper
        ).catch((error: Error) => {
          console.error('Error registering WebSocket message handler:', error);
          controller.error(error);
        });
      },
      cancel: () => {
        // Clean up the message handler when the stream is cancelled
        if (connection._messageHandlerWrapper) {
          webSocketAugmentation.offWebSocketMessage(
            connection.connectionId, 
            connection._messageHandlerWrapper
          ).catch((error: Error) => {
            console.error('Error removing WebSocket message handler:', error);
          });
          delete connection._streamMessageHandler;
          delete connection._messageHandlerWrapper;
        }
      }
    });

    // Create a handler for processing the data
    const handlerPromise = this.createWebSocketHandler(connection, dataType, options);

    // Create a writable stream that sends data to the WebSocket
    const writableStream = new WritableStream({
      write: async (chunk: unknown) => {
        if (connection.send && typeof connection.send === 'function') {
          try {
            const data = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
            await connection.send(data);
          } catch (error: unknown) {
            console.error('Error sending data to WebSocket:', error);
            throw error;
          }
        } else {
          throw new Error('WebSocket connection does not support sending data');
        }
      },
      close: () => {
        // Close the WebSocket connection when the stream is closed
        if (connection.close && typeof connection.close === 'function') {
          connection.close().catch((error: Error) => {
            console.error('Error closing WebSocket connection:', error);
          });
        }
      }
    });

    // Pipe the readable stream through our processing pipeline
    readableStream
      .pipeThrough(new TransformStream({
        transform: async (chunk: unknown, controller: TransformStreamDefaultController) => {
          // Process each chunk through our handler
          const handler = await handlerPromise;
          handler(chunk);
          // Pass through the original data
          controller.enqueue(chunk);
        }
      }))
      .pipeTo(new WritableStream({
        write: () => {},
        abort: (error: Error) => {
          console.error('Error in WebSocket pipeline:', error);
        }
      }));

    // Attach the streams to the connection object for convenience
    const enhancedConnection = connection as WebSocketConnection & {
      readableStream: ReadableStream<unknown>,
      writableStream: WritableStream<unknown>
    };

    enhancedConnection.readableStream = readableStream;
    enhancedConnection.writableStream = writableStream;

    return enhancedConnection;
  }
}

// Create and export a default instance of the sequential pipeline
export const sequentialPipeline = new SequentialPipeline();
