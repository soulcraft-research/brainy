/**
 * ChatCLI - Command Line Interface for BrainyChat
 * 
 * Provides a magical chat experience through the Brainy CLI with:
 * - Auto-discovery of previous sessions
 * - Intelligent context loading
 * - Multi-agent coordination support
 * - Premium memory sync integration
 */

import { BrainyChat, type ChatSession, type ChatMessage } from './BrainyChat.js'
import { BrainyData } from '../brainyData.js'

// Simple color utility without external dependencies
const colors = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`
}

export class ChatCLI {
  private brainyChat: BrainyChat
  private brainy: BrainyData

  constructor(brainy: BrainyData) {
    this.brainy = brainy
    this.brainyChat = new BrainyChat(brainy)
  }

  /**
   * Start an interactive chat session
   * Automatically discovers and loads previous context
   */
  async startInteractiveChat(options?: {
    sessionId?: string
    speaker?: string
    memory?: boolean
    newSession?: boolean
  }): Promise<void> {
    console.log(colors.cyan('🧠 Brainy Chat - Local Memory & Intelligence'))
    console.log()

    let session: ChatSession | null = null

    if (options?.sessionId) {
      // Load specific session
      session = await this.brainyChat.switchToSession(options.sessionId)
      if (session) {
        console.log(colors.green(`📂 Loaded session: ${session.title || session.id}`))
        console.log(colors.gray(`   Created: ${session.createdAt.toLocaleDateString()}`))
        console.log(colors.gray(`   Messages: ${session.messageCount}`))
      } else {
        console.log(colors.yellow(`⚠️  Session ${options.sessionId} not found, starting new session`))
      }
    } else if (!options?.newSession) {
      // Auto-discover last session
      console.log(colors.gray('🔍 Looking for your last conversation...'))
      session = await this.brainyChat.initialize()
      
      if (session) {
        console.log(colors.green(`✨ Found your last session: ${session.title || 'Untitled'}`))
        console.log(colors.gray(`   Last active: ${session.lastMessageAt.toLocaleString()}`))
        console.log(colors.gray(`   Messages: ${session.messageCount}`))
        
        // Show recent context if memory option is enabled
        if (options?.memory !== false) {
          await this.showRecentContext()
        }
      } else {
        console.log(colors.blue('🆕 No previous sessions found, starting fresh!'))
      }
    }

    if (!session) {
      session = await this.brainyChat.startNewSession(
        `Chat ${new Date().toLocaleDateString()}`,
        ['user', options?.speaker || 'assistant']
      )
      console.log(colors.green(`🎉 Started new session: ${session.id}`))
    }

    console.log()
    console.log(colors.gray('💡 Tips:'))
    console.log(colors.gray('   - Type /history to see conversation history'))
    console.log(colors.gray('   - Type /search <query> to search all conversations'))
    console.log(colors.gray('   - Type /sessions to list all sessions'))
    console.log(colors.gray('   - Type /help for more commands'))
    console.log(colors.gray('   - Type /quit to exit'))
    console.log()
    console.log(colors.blue('🚀 Want multi-agent coordination? Try: brainy cloud auth'))
    console.log()

    // Start interactive loop
    await this.interactiveLoop(options?.speaker || 'assistant')
  }

  /**
   * Send a single message and get response
   */
  async sendMessage(
    message: string,
    options?: {
      sessionId?: string
      speaker?: string
      noResponse?: boolean
    }
  ): Promise<ChatMessage[]> {
    if (options?.sessionId) {
      await this.brainyChat.switchToSession(options.sessionId)
    }

    // Add user message
    const userMessage = await this.brainyChat.addMessage(message, 'user')
    console.log(colors.blue(`👤 You: ${message}`))

    if (options?.noResponse) {
      return [userMessage]
    }

    // For CLI usage, we'd integrate with whatever AI service is configured
    // This is a placeholder showing the architecture
    const response = await this.generateResponse(message, options?.speaker || 'assistant')
    const assistantMessage = await this.brainyChat.addMessage(
      response,
      options?.speaker || 'assistant',
      {
        model: 'claude-3-sonnet',
        context: { userMessage: userMessage.id }
      }
    )

    console.log(colors.green(`🤖 ${options?.speaker || 'Assistant'}: ${response}`))

    return [userMessage, assistantMessage]
  }

  /**
   * Show conversation history
   */
  async showHistory(limit: number = 10): Promise<void> {
    const messages = await this.brainyChat.getHistory(limit)
    
    if (messages.length === 0) {
      console.log(colors.yellow('📭 No messages in current session'))
      return
    }

    console.log(colors.cyan(`📜 Last ${Math.min(limit, messages.length)} messages:`))
    console.log()

    for (const message of messages.slice(-limit)) {
      const timestamp = message.timestamp.toLocaleTimeString()
      const speakerColor = message.speaker === 'user' ? colors.blue : colors.green
      const icon = message.speaker === 'user' ? '👤' : '🤖'
      
      console.log(speakerColor(`${icon} ${message.speaker} (${timestamp}):`))
      console.log(colors.gray(`   ${message.content}`))
      console.log()
    }
  }

  /**
   * Search across all conversations
   */
  async searchConversations(
    query: string,
    options?: {
      limit?: number
      sessionId?: string
      semantic?: boolean
    }
  ): Promise<void> {
    console.log(colors.cyan(`🔍 Searching for: "${query}"`))
    
    const results = await this.brainyChat.searchMessages(query, {
      limit: options?.limit || 10,
      sessionId: options?.sessionId,
      semanticSearch: options?.semantic !== false
    })

    if (results.length === 0) {
      console.log(colors.yellow('🤷 No matching messages found'))
      return
    }

    console.log(colors.green(`✨ Found ${results.length} matches:`))
    console.log()

    for (const message of results) {
      const date = message.timestamp.toLocaleDateString()
      const time = message.timestamp.toLocaleTimeString()
      const speakerColor = message.speaker === 'user' ? colors.blue : colors.green
      const icon = message.speaker === 'user' ? '👤' : '🤖'
      
      console.log(colors.gray(`📅 ${date} ${time} - Session: ${message.sessionId.substring(0, 8)}...`))
      console.log(speakerColor(`${icon} ${message.speaker}: ${message.content}`))
      console.log()
    }
  }

  /**
   * List all chat sessions
   */
  async listSessions(): Promise<void> {
    const sessions = await this.brainyChat.getSessions()
    
    if (sessions.length === 0) {
      console.log(colors.yellow('📭 No chat sessions found'))
      return
    }

    console.log(colors.cyan(`💬 Your chat sessions (${sessions.length}):`))
    console.log()

    for (const session of sessions) {
      const isActive = session.id === this.brainyChat.getCurrentSessionId()
      const activeIndicator = isActive ? colors.green(' ● ACTIVE') : ''
      const archived = session.metadata?.archived ? colors.gray(' [ARCHIVED]') : ''
      
      console.log(colors.blue(`📂 ${session.title || 'Untitled'}${activeIndicator}${archived}`))
      console.log(colors.gray(`   ID: ${session.id}`))
      console.log(colors.gray(`   Created: ${session.createdAt.toLocaleDateString()}`))
      console.log(colors.gray(`   Last active: ${session.lastMessageAt.toLocaleDateString()}`))
      console.log(colors.gray(`   Messages: ${session.messageCount}`))
      console.log(colors.gray(`   Participants: ${session.participants.join(', ')}`))
      console.log()
    }
  }

  /**
   * Switch to a different session
   */
  async switchSession(sessionId: string): Promise<void> {
    const session = await this.brainyChat.switchToSession(sessionId)
    
    if (session) {
      console.log(colors.green(`✅ Switched to session: ${session.title || session.id}`))
      console.log(colors.gray(`   Messages: ${session.messageCount}`))
      console.log(colors.gray(`   Last active: ${session.lastMessageAt.toLocaleString()}`))
    } else {
      console.log(colors.red(`❌ Session ${sessionId} not found`))
    }
  }

  /**
   * Show help for chat commands
   */
  showHelp(): void {
    console.log(colors.cyan('🧠 Brainy Chat Commands:'))
    console.log()
    console.log(colors.blue('Basic Commands:'))
    console.log('  /history [limit]     - Show conversation history (default: 10 messages)')
    console.log('  /search <query>      - Search all conversations')
    console.log('  /sessions           - List all chat sessions')
    console.log('  /switch <id>        - Switch to a specific session')
    console.log('  /new                - Start a new session')
    console.log('  /help               - Show this help')
    console.log('  /quit               - Exit chat')
    console.log()
    
    console.log(colors.yellow('Local Features:'))
    console.log('  ✨ Automatic session discovery')
    console.log('  🧠 Local memory across all conversations')
    console.log('  🔍 Semantic search using vector similarity')
    console.log('  📊 Standard noun/verb graph relationships')
    console.log()
    
    console.log(colors.green('Want More? Premium Features:'))
    console.log('  🤝 Multi-agent coordination')
    console.log('  ☁️  Cross-device memory sync')
    console.log('  🎨 Rich web coordination UI')
    console.log('  🔄 Real-time team collaboration')
    console.log()
    console.log(colors.blue('Get premium: brainy cloud auth'))
    console.log()
  }

  // Private methods

  private async interactiveLoop(assistantSpeaker: string = 'assistant'): Promise<void> {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const askQuestion = (): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(colors.blue('💬 You: '), resolve)
      })
    }

    while (true) {
      try {
        const input = await askQuestion()
        
        if (input.trim() === '') continue

        // Handle commands
        if (input.startsWith('/')) {
          const [command, ...args] = input.slice(1).split(' ')
          
          switch (command.toLowerCase()) {
            case 'quit':
            case 'exit':
              console.log(colors.cyan('👋 Thanks for chatting! Your conversation is saved.'))
              rl.close()
              return

            case 'history':
              const limit = args[0] ? parseInt(args[0]) : 10
              await this.showHistory(limit)
              break

            case 'search':
              if (args.length === 0) {
                console.log(colors.yellow('Usage: /search <query>'))
              } else {
                await this.searchConversations(args.join(' '))
              }
              break

            case 'sessions':
              await this.listSessions()
              break

            case 'switch':
              if (args.length === 0) {
                console.log(colors.yellow('Usage: /switch <session-id>'))
              } else {
                await this.switchSession(args[0])
              }
              break

            case 'new':
              const newSession = await this.brainyChat.startNewSession(
                `Chat ${new Date().toLocaleDateString()}`
              )
              console.log(colors.green(`🆕 Started new session: ${newSession.id}`))
              break

            case 'archive':
              const sessionToArchive = args[0] || this.brainyChat.getCurrentSessionId()
              if (sessionToArchive) {
                try {
                  await this.brainyChat.archiveSession(sessionToArchive)
                  console.log(colors.green(`📁 Session archived: ${sessionToArchive}`))
                } catch (error: any) {
                  console.log(colors.red(`❌ ${error?.message}`))
                }
              } else {
                console.log(colors.yellow('No session to archive'))
              }
              break

            case 'summary':
              const sessionToSummarize = args[0] || this.brainyChat.getCurrentSessionId()
              if (sessionToSummarize) {
                try {
                  const summary = await this.brainyChat.generateSessionSummary(sessionToSummarize)
                  if (summary) {
                    console.log(colors.green('📋 Session Summary:'))
                    console.log(colors.gray(summary))
                  } else {
                    console.log(colors.yellow('No summary could be generated'))
                  }
                } catch (error: any) {
                  console.log(colors.red(`❌ ${error?.message}`))
                }
              } else {
                console.log(colors.yellow('No session to summarize'))
              }
              break

            case 'help':
              this.showHelp()
              break

            default:
              console.log(colors.yellow(`Unknown command: ${command}`))
              console.log(colors.gray('Type /help for available commands'))
          }
        } else {
          // Regular message
          await this.sendMessage(input, { speaker: assistantSpeaker })
        }

        console.log()
      } catch (error: any) {
        console.error(colors.red(`Error: ${error?.message}`))
      }
    }
  }

  private async showRecentContext(limit: number = 3): Promise<void> {
    const recentMessages = await this.brainyChat.getHistory(limit)
    
    if (recentMessages.length > 0) {
      console.log(colors.gray('💭 Recent context:'))
      for (const msg of recentMessages.slice(-limit)) {
        const preview = msg.content.length > 60 
          ? msg.content.substring(0, 60) + '...'
          : msg.content
        console.log(colors.gray(`   ${msg.speaker}: ${preview}`))
      }
      console.log()
    }
  }

  private async generateResponse(message: string, speaker: string): Promise<string> {
    // This is a placeholder for AI integration
    // In a real implementation, this would call the configured AI service
    // and could include multi-agent coordination
    
    // Example responses for demonstration
    const responses = [
      "I remember our conversation and can help with that!",
      "Based on our previous discussions, I think...",
      "Let me search through our chat history for relevant context.",
      "I can coordinate with other AI agents if needed for this task."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
}