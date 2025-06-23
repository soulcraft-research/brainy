/**
 * Augmentation Factory
 *
 * This module provides a simplified factory for creating augmentations with minimal boilerplate.
 * It reduces the complexity of creating and using augmentations by providing a fluent API
 * and handling common patterns automatically.
 */
import { IAugmentation, AugmentationResponse, ISenseAugmentation, IConduitAugmentation, IMemoryAugmentation, IWebSocketSupport, WebSocketConnection } from './types/augmentations.js';
/**
 * Options for creating an augmentation
 */
export interface AugmentationOptions {
    name: string;
    description?: string;
    enabled?: boolean;
    autoRegister?: boolean;
    autoInitialize?: boolean;
}
/**
 * Factory for creating sense augmentations
 */
export declare function createSenseAugmentation(options: AugmentationOptions & {
    processRawData?: (rawData: Buffer | string, dataType: string) => Promise<AugmentationResponse<{
        nouns: string[];
        verbs: string[];
    }>> | AugmentationResponse<{
        nouns: string[];
        verbs: string[];
    }>;
    listenToFeed?: (feedUrl: string, callback: (data: {
        nouns: string[];
        verbs: string[];
    }) => void) => Promise<void>;
}): ISenseAugmentation;
/**
 * Factory for creating conduit augmentations
 */
export declare function createConduitAugmentation(options: AugmentationOptions & {
    establishConnection?: (targetSystemId: string, config: Record<string, unknown>) => Promise<AugmentationResponse<WebSocketConnection>> | AugmentationResponse<WebSocketConnection>;
    readData?: (query: Record<string, unknown>, options?: Record<string, unknown>) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>;
    writeData?: (data: Record<string, unknown>, options?: Record<string, unknown>) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>;
    monitorStream?: (streamId: string, callback: (data: unknown) => void) => Promise<void>;
}): IConduitAugmentation;
/**
 * Factory for creating memory augmentations
 */
export declare function createMemoryAugmentation(options: AugmentationOptions & {
    storeData?: (key: string, data: unknown, options?: Record<string, unknown>) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>;
    retrieveData?: (key: string, options?: Record<string, unknown>) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>;
    updateData?: (key: string, data: unknown, options?: Record<string, unknown>) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>;
    deleteData?: (key: string, options?: Record<string, unknown>) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>;
    listDataKeys?: (pattern?: string, options?: Record<string, unknown>) => Promise<AugmentationResponse<string[]>> | AugmentationResponse<string[]>;
    search?: (query: unknown, k?: number, options?: Record<string, unknown>) => Promise<AugmentationResponse<Array<{
        id: string;
        score: number;
        data: unknown;
    }>>> | AugmentationResponse<Array<{
        id: string;
        score: number;
        data: unknown;
    }>>;
}): IMemoryAugmentation;
/**
 * Factory for creating WebSocket-enabled augmentations
 * This can be combined with other augmentation factories to create WebSocket-enabled versions
 */
export declare function addWebSocketSupport<T extends IAugmentation>(augmentation: T, options: {
    connectWebSocket?: (url: string, protocols?: string | string[]) => Promise<WebSocketConnection>;
    sendWebSocketMessage?: (connectionId: string, data: unknown) => Promise<void>;
    onWebSocketMessage?: (connectionId: string, callback: (data: unknown) => void) => Promise<void>;
    offWebSocketMessage?: (connectionId: string, callback: (data: unknown) => void) => Promise<void>;
    closeWebSocket?: (connectionId: string, code?: number, reason?: string) => Promise<void>;
}): T & IWebSocketSupport;
/**
 * Simplified function to execute an augmentation method with automatic error handling
 * This provides a more concise way to execute augmentation methods compared to the full pipeline
 */
export declare function executeAugmentation<T, R>(augmentation: IAugmentation, method: string, ...args: any[]): Promise<AugmentationResponse<R>>;
/**
 * Dynamically load augmentations from a module at runtime
 * This allows for lazy-loading augmentations when needed instead of at build time
 */
export declare function loadAugmentationModule(modulePromise: Promise<any>, options?: {
    autoRegister?: boolean;
    autoInitialize?: boolean;
}): Promise<IAugmentation[]>;
//# sourceMappingURL=augmentationFactory.d.ts.map