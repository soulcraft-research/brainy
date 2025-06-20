import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { BrainyData } from '@soulcraft/brainy';
import { setupRoutes } from './routes.js';
import { initializeBrainy } from './services/brainyService.js';
import { setupWebSocketHandlers } from './websocket.js';
import { initializeMCPService } from './services/mcpService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies

// Initialize Brainy
let brainyInstance: BrainyData;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Setup API routes
const apiRouter = setupRoutes();
app.use('/api', (req, res, next) => {
  // Attach brainy instance to request
  (req as any).brainy = brainyInstance;
  next();
}, apiRouter);

// Start the server
async function startServer() {
  try {
    // Initialize Brainy
    brainyInstance = await initializeBrainy();
    console.log('Brainy initialized successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ server });

    // Setup WebSocket handlers
    setupWebSocketHandlers(wss, brainyInstance);
    console.log('WebSocket server initialized');

    // Initialize MCP service
    const mcpWsPort = process.env.MCP_WS_PORT ? parseInt(process.env.MCP_WS_PORT, 10) : undefined;
    const mcpRestPort = process.env.MCP_REST_PORT ? parseInt(process.env.MCP_REST_PORT, 10) : undefined;

    if (mcpWsPort || mcpRestPort) {
      initializeMCPService(brainyInstance, {
        wsPort: mcpWsPort,
        restPort: mcpRestPort,
        enableAuth: process.env.MCP_ENABLE_AUTH === 'true',
        apiKeys: process.env.MCP_API_KEYS ? process.env.MCP_API_KEYS.split(',') : undefined,
        rateLimit: process.env.MCP_RATE_LIMIT_REQUESTS ? {
          windowMs: parseInt(process.env.MCP_RATE_LIMIT_WINDOW_MS || '60000', 10),
          maxRequests: parseInt(process.env.MCP_RATE_LIMIT_REQUESTS, 10)
        } : undefined,
        cors: process.env.MCP_ENABLE_CORS === 'true' ? {} : undefined
      });
      console.log('MCP service initialized');
    }

    // Start HTTP server
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`WebSocket server running on ws://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Cleanup Brainy resources
  await brainyInstance?.clear();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  // Cleanup Brainy resources
  await brainyInstance?.clear();
  process.exit(0);
});

// Start the server
startServer();
