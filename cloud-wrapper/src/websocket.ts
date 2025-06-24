import { WebSocketServer, WebSocket } from 'ws';
import { BrainyData } from '@soulcraft/brainy';
import { v4 as uuidv4 } from 'uuid';

// Define message types
enum MessageType {
  STATUS = 'status',
  ADD_NOUN = 'addNoun',
  GET_NOUN = 'getNoun',
  UPDATE_NOUN = 'updateNoun',
  DELETE_NOUN = 'deleteNoun',
  SEARCH = 'search',
  ADD_VERB = 'addVerb',
  GET_VERBS = 'getVerbs',
  GET_VERBS_BY_SOURCE = 'getVerbsBySource',
  GET_VERBS_BY_TARGET = 'getVerbsByTarget',
  DELETE_VERB = 'deleteVerb',
  CLEAR = 'clear',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  ERROR = 'error'
}

// Define subscription types
enum SubscriptionType {
  NOUNS = 'nouns',
  VERBS = 'verbs',
  SEARCH_RESULTS = 'searchResults'
}

// Define message interface
interface WebSocketMessage {
  type: MessageType;
  id?: string;
  payload?: any;
}

// Define client interface
interface WebSocketClient {
  id: string;
  socket: WebSocket;
  subscriptions: Set<SubscriptionType>;
}

// Store connected clients
const clients: Map<string, WebSocketClient> = new Map();

// Setup WebSocket handlers
export function setupWebSocketHandlers(wss: WebSocketServer, brainy: BrainyData) {
  // Handle new connections
  wss.on('connection', (socket: WebSocket) => {
    const clientId = uuidv4();
    
    // Create client object
    const client: WebSocketClient = {
      id: clientId,
      socket,
      subscriptions: new Set()
    };
    
    // Store client
    clients.set(clientId, client);
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    sendMessage(socket, {
      type: MessageType.STATUS,
      id: uuidv4(),
      payload: {
        clientId,
        message: 'Connected to Brainy WebSocket API',
        status: 'connected'
      }
    });
    
    // Handle messages
    socket.on('message', async (data: WebSocket.Data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        // Ensure message has an ID
        const messageId = message.id || uuidv4();
        
        console.log(`Received message: ${message.type} (${messageId})`);
        
        // Process message based on type
        await processMessage(client, message, messageId, brainy);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        sendMessage(socket, {
          type: MessageType.ERROR,
          id: uuidv4(),
          payload: {
            message: 'Invalid message format',
            error: (error as Error).message
          }
        });
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      // Remove client
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });
  });
}

// Process incoming messages
async function processMessage(
  client: WebSocketClient,
  message: WebSocketMessage,
  messageId: string,
  brainy: BrainyData
) {
  const { socket } = client;
  
  try {
    switch (message.type) {
      case MessageType.STATUS:
        // Return database status
        const status = await brainy.status();
        sendMessage(socket, {
          type: MessageType.STATUS,
          id: messageId,
          payload: status
        });
        break;
        
      case MessageType.ADD_NOUN:
        // Add a noun
        if (!message.payload?.text) {
          throw new Error('Text is required');
        }
        
        const nounId = await brainy.add(
          message.payload.text,
          message.payload.metadata || {}
        );
        
        sendMessage(socket, {
          type: MessageType.ADD_NOUN,
          id: messageId,
          payload: { id: nounId }
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.NOUNS, {
          type: 'added',
          id: nounId,
          data: await brainy.get(nounId)
        });
        
        break;
        
      case MessageType.GET_NOUN:
        // Get a noun by ID
        if (!message.payload?.id) {
          throw new Error('Noun ID is required');
        }
        
        const noun = await brainy.get(message.payload.id);
        
        if (!noun) {
          throw new Error('Noun not found');
        }
        
        sendMessage(socket, {
          type: MessageType.GET_NOUN,
          id: messageId,
          payload: noun
        });
        break;
        
      case MessageType.UPDATE_NOUN:
        // Update noun metadata
        if (!message.payload?.id || !message.payload?.metadata) {
          throw new Error('Noun ID and metadata are required');
        }
        
        await brainy.updateMetadata(message.payload.id, message.payload.metadata);
        
        sendMessage(socket, {
          type: MessageType.UPDATE_NOUN,
          id: messageId,
          payload: { success: true }
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.NOUNS, {
          type: 'updated',
          id: message.payload.id,
          data: await brainy.get(message.payload.id)
        });
        
        break;
        
      case MessageType.DELETE_NOUN:
        // Delete a noun
        if (!message.payload?.id) {
          throw new Error('Noun ID is required');
        }
        
        await brainy.delete(message.payload.id);
        
        sendMessage(socket, {
          type: MessageType.DELETE_NOUN,
          id: messageId,
          payload: { success: true }
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.NOUNS, {
          type: 'deleted',
          id: message.payload.id
        });
        
        break;
        
      case MessageType.SEARCH:
        // Search for similar nouns
        if (!message.payload?.query) {
          throw new Error('Query is required');
        }
        
        const limit = message.payload.limit || 10;
        const results = await brainy.searchText(message.payload.query, limit);
        
        sendMessage(socket, {
          type: MessageType.SEARCH,
          id: messageId,
          payload: results
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.SEARCH_RESULTS, {
          type: 'search',
          query: message.payload.query,
          results
        });
        
        break;
        
      case MessageType.ADD_VERB:
        // Add a verb (relationship)
        if (!message.payload?.sourceId || !message.payload?.targetId) {
          throw new Error('Source ID and Target ID are required');
        }
        
        await brainy.addVerb(
          message.payload.sourceId,
          message.payload.targetId,
          message.payload.metadata || {}
        );
        
        sendMessage(socket, {
          type: MessageType.ADD_VERB,
          id: messageId,
          payload: { success: true }
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.VERBS, {
          type: 'added',
          sourceId: message.payload.sourceId,
          targetId: message.payload.targetId,
          metadata: message.payload.metadata
        });
        
        break;
        
      case MessageType.GET_VERBS:
        // Get all verbs
        const verbs = await brainy.getAllVerbs();
        
        sendMessage(socket, {
          type: MessageType.GET_VERBS,
          id: messageId,
          payload: verbs
        });
        break;
        
      case MessageType.GET_VERBS_BY_SOURCE:
        // Get verbs by source
        if (!message.payload?.id) {
          throw new Error('Source ID is required');
        }
        
        const sourceVerbs = await brainy.getVerbsBySource(message.payload.id);
        
        sendMessage(socket, {
          type: MessageType.GET_VERBS_BY_SOURCE,
          id: messageId,
          payload: sourceVerbs
        });
        break;
        
      case MessageType.GET_VERBS_BY_TARGET:
        // Get verbs by target
        if (!message.payload?.id) {
          throw new Error('Target ID is required');
        }
        
        const targetVerbs = await brainy.getVerbsByTarget(message.payload.id);
        
        sendMessage(socket, {
          type: MessageType.GET_VERBS_BY_TARGET,
          id: messageId,
          payload: targetVerbs
        });
        break;
        
      case MessageType.DELETE_VERB:
        // Delete a verb
        if (!message.payload?.id) {
          throw new Error('Verb ID is required');
        }
        
        await brainy.deleteVerb(message.payload.id);
        
        sendMessage(socket, {
          type: MessageType.DELETE_VERB,
          id: messageId,
          payload: { success: true }
        });
        
        // Notify subscribers
        notifySubscribers(SubscriptionType.VERBS, {
          type: 'deleted',
          id: message.payload.id
        });
        
        break;
        
      case MessageType.CLEAR:
        // Clear all data
        await brainy.clear();
        
        sendMessage(socket, {
          type: MessageType.CLEAR,
          id: messageId,
          payload: { success: true }
        });
        
        // Notify all subscribers
        notifySubscribers(SubscriptionType.NOUNS, { type: 'cleared' });
        notifySubscribers(SubscriptionType.VERBS, { type: 'cleared' });
        
        break;
        
      case MessageType.SUBSCRIBE:
        // Subscribe to events
        if (!message.payload?.type) {
          throw new Error('Subscription type is required');
        }
        
        const subscriptionType = message.payload.type as SubscriptionType;
        
        // Add subscription
        client.subscriptions.add(subscriptionType);
        
        sendMessage(socket, {
          type: MessageType.SUBSCRIBE,
          id: messageId,
          payload: {
            success: true,
            type: subscriptionType
          }
        });
        break;
        
      case MessageType.UNSUBSCRIBE:
        // Unsubscribe from events
        if (!message.payload?.type) {
          throw new Error('Subscription type is required');
        }
        
        const unsubscribeType = message.payload.type as SubscriptionType;
        
        // Remove subscription
        client.subscriptions.delete(unsubscribeType);
        
        sendMessage(socket, {
          type: MessageType.UNSUBSCRIBE,
          id: messageId,
          payload: {
            success: true,
            type: unsubscribeType
          }
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error(`Error processing message ${message.type}:`, error);
    
    sendMessage(socket, {
      type: MessageType.ERROR,
      id: messageId,
      payload: {
        originalType: message.type,
        message: 'Error processing message',
        error: (error as Error).message
      }
    });
  }
}

// Send a message to a client
function sendMessage(socket: WebSocket, message: WebSocketMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

// Notify subscribers of events
function notifySubscribers(type: SubscriptionType, data: any) {
  for (const client of clients.values()) {
    if (client.subscriptions.has(type)) {
      sendMessage(client.socket, {
        type: MessageType.SUBSCRIBE,
        payload: {
          type,
          data
        }
      });
    }
  }
}
