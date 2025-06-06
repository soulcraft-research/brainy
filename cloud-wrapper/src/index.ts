import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { BrainyData } from '@soulcraft/brainy';
import { setupRoutes } from './routes';
import { initializeBrainy } from './services/brainyService';
import { setupWebSocketHandlers } from './websocket';

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
app.use('/api', (req, res, next) => {
  // Attach brainy instance to request
  (req as any).brainy = brainyInstance;
  next();
}, setupRoutes());

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
