import { AugmentationType, IConduitAugmentation, IWebSocketSupport, AugmentationResponse, WebSocketConnection } from '../types/augmentations.js';
/**
 * Base class for conduit augmentations that provide data synchronization between Brainy instances
 */
declare abstract class BaseConduitAugmentation implements IConduitAugmentation {
    readonly name: string;
    readonly description: string;
    enabled: boolean;
    protected isInitialized: boolean;
    protected connections: Map<string, any>;
    constructor(name: string);
    initialize(): Promise<void>;
    shutDown(): Promise<void>;
    getStatus(): Promise<'active' | 'inactive' | 'error'>;
    abstract establishConnection(targetSystemId: string, config: Record<string, unknown>): Promise<AugmentationResponse<WebSocketConnection>>;
    abstract readData(query: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    abstract writeData(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    abstract monitorStream(streamId: string, callback: (data: unknown) => void): Promise<void>;
    protected ensureInitialized(): Promise<void>;
}
/**
 * WebSocket conduit augmentation for syncing Brainy instances using WebSockets
 *
 * This conduit is for syncing between browsers and servers, or between servers.
 * WebSockets cannot be used for direct browser-to-browser communication without a server in the middle.
 */
export declare class WebSocketConduitAugmentation extends BaseConduitAugmentation implements IWebSocketSupport {
    readonly description = "Conduit augmentation that syncs Brainy instances using WebSockets";
    private webSocketConnections;
    private messageCallbacks;
    constructor(name?: string);
    getType(): AugmentationType;
    /**
     * Establishes a connection to another Brainy instance
     * @param targetSystemId The URL or identifier of the target system
     * @param config Configuration options for the connection
     */
    establishConnection(targetSystemId: string, config: Record<string, unknown>): Promise<AugmentationResponse<WebSocketConnection>>;
    /**
     * Reads data from a connected Brainy instance
     * @param query Query parameters for reading data
     * @param options Additional options
     */
    readData(query: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    /**
     * Writes data to a connected Brainy instance
     * @param data The data to write
     * @param options Additional options
     */
    writeData(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    /**
     * Monitors a data stream from a connected Brainy instance
     * @param streamId The ID of the stream to monitor (usually a connection ID)
     * @param callback Function to call when new data is received
     */
    monitorStream(streamId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Establishes a WebSocket connection
     * @param url The WebSocket server URL to connect to
     * @param protocols Optional subprotocols
     */
    connectWebSocket(url: string, protocols?: string | string[]): Promise<WebSocketConnection>;
    /**
     * Sends data through an established WebSocket connection
     * @param connectionId The identifier of the established connection
     * @param data The data to send (will be serialized if not a string)
     */
    sendWebSocketMessage(connectionId: string, data: unknown): Promise<void>;
    /**
     * Registers a callback for incoming WebSocket messages
     * @param connectionId The identifier of the established connection
     * @param callback The function to call when a message is received
     */
    onWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Removes a callback for incoming WebSocket messages
     * @param connectionId The identifier of the established connection
     * @param callback The function to remove from the callbacks
     */
    offWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Closes an established WebSocket connection
     * @param connectionId The identifier of the established connection
     * @param code Optional close code
     * @param reason Optional close reason
     */
    closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void>;
}
/**
 * WebRTC conduit augmentation for syncing Brainy instances using WebRTC
 *
 * This conduit is for direct peer-to-peer syncing between browsers.
 * It is the recommended approach for browser-to-browser communication.
 */
export declare class WebRTCConduitAugmentation extends BaseConduitAugmentation implements IWebSocketSupport {
    readonly description = "Conduit augmentation that syncs Brainy instances using WebRTC";
    private peerConnections;
    private dataChannels;
    private webSocketConnections;
    private messageCallbacks;
    private signalServer;
    constructor(name?: string);
    getType(): AugmentationType;
    initialize(): Promise<void>;
    /**
     * Establishes a connection to another Brainy instance using WebRTC
     * @param targetSystemId The peer ID or signal server URL
     * @param config Configuration options for the connection
     */
    establishConnection(targetSystemId: string, config: Record<string, unknown>): Promise<AugmentationResponse<WebSocketConnection>>;
    /**
     * Handles an incoming WebRTC offer
     * @param peerId The ID of the peer sending the offer
     * @param offer The SDP offer
     * @param config Configuration options
     */
    private handleOffer;
    /**
     * Reads data from a connected Brainy instance
     * @param query Query parameters for reading data
     * @param options Additional options
     */
    readData(query: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    /**
     * Writes data to a connected Brainy instance
     * @param data The data to write
     * @param options Additional options
     */
    writeData(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<AugmentationResponse<unknown>>;
    /**
     * Monitors a data stream from a connected Brainy instance
     * @param streamId The ID of the stream to monitor (usually a connection ID)
     * @param callback Function to call when new data is received
     */
    monitorStream(streamId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Establishes a WebSocket connection (used for signaling in WebRTC)
     * @param url The WebSocket server URL to connect to
     * @param protocols Optional subprotocols
     */
    connectWebSocket(url: string, protocols?: string | string[]): Promise<WebSocketConnection>;
    /**
     * Sends data through an established WebSocket or WebRTC connection
     * @param connectionId The identifier of the established connection
     * @param data The data to send (will be serialized if not a string)
     */
    sendWebSocketMessage(connectionId: string, data: unknown): Promise<void>;
    /**
     * Registers a callback for incoming WebSocket or WebRTC messages
     * @param connectionId The identifier of the established connection
     * @param callback The function to call when a message is received
     */
    onWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Removes a callback for incoming WebSocket or WebRTC messages
     * @param connectionId The identifier of the established connection
     * @param callback The function to remove from the callbacks
     */
    offWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void>;
    /**
     * Closes an established WebSocket or WebRTC connection
     * @param connectionId The identifier of the established connection
     * @param code Optional close code
     * @param reason Optional close reason
     */
    closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void>;
}
/**
 * Factory function to create the appropriate conduit augmentation based on the type
 */
export declare function createConduitAugmentation(type: 'websocket' | 'webrtc', name?: string, options?: Record<string, unknown>): Promise<IConduitAugmentation & IWebSocketSupport>;
export {};
//# sourceMappingURL=conduitAugmentations.d.ts.map