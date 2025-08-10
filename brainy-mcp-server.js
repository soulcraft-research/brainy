#!/usr/bin/env node

/**
 * Brain Cloud MCP Server
 * Connects Claude to Brain Cloud for persistent AI memory
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Configuration from environment
const CUSTOMER_ID = process.env.CUSTOMER_ID || 'demo-test-auto';
const BRAIN_CLOUD_URL = process.env.BRAIN_CLOUD_URL || 'https://brain-cloud.dpsifr.workers.dev';

class BrainCloudMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'brain-cloud',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'remember',
            description: 'Store a memory in Brain Cloud for persistent recall across sessions',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The information to remember'
                },
                context: {
                  type: 'string',
                  description: 'Additional context or tags for the memory'
                }
              },
              required: ['content']
            }
          },
          {
            name: 'recall',
            description: 'Search and retrieve memories from Brain Cloud',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'What to search for in memories'
                },
                limit: {
                  type: 'number',
                  description: 'Number of memories to retrieve (default: 10)'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_all_memories',
            description: 'Get all stored memories from Brain Cloud',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of memories to retrieve (default: 50)'
                }
              }
            }
          },
          {
            name: 'brain_cloud_status',
            description: 'Check Brain Cloud connection and memory statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'remember':
            return await this.storeMemory(args.content, args.context);
            
          case 'recall':
            return await this.searchMemories(args.query, args.limit || 10);
            
          case 'get_all_memories':
            return await this.getAllMemories(args.limit || 50);
            
          case 'brain_cloud_status':
            return await this.getStatus();
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async storeMemory(content, context = '') {
    try {
      const response = await fetch(`${BRAIN_CLOUD_URL}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': CUSTOMER_ID
        },
        body: JSON.stringify({
          content,
          context,
          source: 'claude-mcp',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Brain Cloud API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        content: [{
          type: 'text',
          text: `✅ Memory stored successfully!\n\nContent: ${content}\nID: ${result.id || 'generated'}\n\nI'll remember this for future conversations.`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  }

  async searchMemories(query, limit = 10) {
    try {
      const response = await fetch(`${BRAIN_CLOUD_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-customer-id': CUSTOMER_ID
        },
        body: JSON.stringify({
          query,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Brain Cloud API error: ${response.status}`);
      }

      const result = await response.json();
      const memories = result.memories || [];

      if (memories.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `🔍 No memories found for "${query}"\n\nTry a different search term or ask me to remember something first.`
          }]
        };
      }

      const memoryList = memories.map((memory, index) => {
        const date = new Date(memory.created || memory.timestamp).toLocaleDateString();
        return `${index + 1}. ${memory.content} (${date})`;
      }).join('\n');

      return {
        content: [{
          type: 'text',
          text: `🧠 Found ${memories.length} memories for "${query}":\n\n${memoryList}\n\nI can use this context to help with your current request!`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }

  async getAllMemories(limit = 50) {
    try {
      const response = await fetch(`${BRAIN_CLOUD_URL}/memories`, {
        method: 'GET',
        headers: {
          'x-customer-id': CUSTOMER_ID
        }
      });

      if (!response.ok) {
        throw new Error(`Brain Cloud API error: ${response.status}`);
      }

      const result = await response.json();
      const memories = result.memories || [];

      if (memories.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `🧠 No memories stored yet.\n\nStart a conversation and I'll automatically remember important details!`
          }]
        };
      }

      const recentMemories = memories.slice(0, limit);
      const memoryList = recentMemories.map((memory, index) => {
        const date = new Date(memory.created || memory.timestamp).toLocaleDateString();
        return `${index + 1}. ${memory.content} (${date})`;
      }).join('\n');

      return {
        content: [{
          type: 'text',
          text: `🧠 Your Brain Cloud contains ${memories.length} total memories.\n\nShowing most recent ${recentMemories.length}:\n\n${memoryList}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get memories: ${error.message}`);
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${BRAIN_CLOUD_URL}/health`, {
        method: 'GET',
        headers: {
          'x-customer-id': CUSTOMER_ID
        }
      });

      if (!response.ok) {
        throw new Error(`Brain Cloud API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Get memory count
      const memoriesResponse = await fetch(`${BRAIN_CLOUD_URL}/memories`, {
        headers: { 'x-customer-id': CUSTOMER_ID }
      });
      
      let memoryCount = 0;
      if (memoriesResponse.ok) {
        const memoriesData = await memoriesResponse.json();
        memoryCount = memoriesData.memories?.length || 0;
      }

      return {
        content: [{
          type: 'text',
          text: `🧠 Brain Cloud Status: ${result.status}\n\n` +
               `Customer ID: ${CUSTOMER_ID}\n` +
               `Total Memories: ${memoryCount}\n` +
               `Last Check: ${new Date().toLocaleString()}\n\n` +
               `✅ I'm connected and ready to remember everything!`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get Brain Cloud status: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`🧠 Brain Cloud MCP Server running for customer: ${CUSTOMER_ID}`);
  }
}

// Start the server
const server = new BrainCloudMCPServer();
server.run().catch(console.error);