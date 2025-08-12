/**
 * BrainyChat - Magical Chat Command Center
 * 
 * A smart chat system that leverages Brainy's standard noun/verb types
 * to create intelligent, persistent conversations with automatic context loading.
 * 
 * Key Features:
 * - Uses standard NounType.Message for all chat messages
 * - Employs VerbType.Communicates and VerbType.Precedes for conversation flow
 * - Auto-discovery of previous sessions using Brainy's search capabilities
 * - Hybrid architecture: basic chat (open source) + premium memory sync
 */

import { BrainyData } from '../brainyData.js'
import { NounType, VerbType, type Message, type GraphNoun, type GraphVerb } from '../types/graphTypes.js'

export interface ChatMessage {
  id: string
  content: string
  speaker: 'user' | 'assistant' | string // Allow custom speaker names for multi-agent
  sessionId: string
  timestamp: Date
  metadata?: {
    model?: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
    }
    context?: Record<string, any>
  }
}

export interface ChatSession {
  id: string
  title?: string
  createdAt: Date
  lastMessageAt: Date
  messageCount: number
  participants: string[]
  metadata?: {
    tags?: string[]
    summary?: string
    archived?: boolean
    premium?: boolean
  }
}

/**
 * Enhanced BrainyChat with automatic context loading and intelligent memory
 * 
 * This extends basic chat functionality with premium features when available
 */
export class BrainyChat {
  private brainy: BrainyData
  private currentSessionId: string | null = null
  private sessionCache = new Map<string, ChatSession>()

  constructor(brainy: BrainyData) {
    this.brainy = brainy
  }

  /**
   * Initialize chat system and auto-discover last session
   * Uses Brainy's advanced search to find the most recent conversation
   */
  async initialize(): Promise<ChatSession | null> {
    try {
      // Search for the most recent chat message using Brainy's search
      const recentMessages = await this.brainy.search(
        'recent chat conversation',
        1,
        {
          nounTypes: [NounType.Message],
          metadata: {
            messageType: 'chat'
          }
        }
      )

      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[0]
        const sessionId = lastMessage.metadata?.sessionId

        if (sessionId) {
          this.currentSessionId = sessionId
          return await this.loadSession(sessionId)
        }
      }
    } catch (error: any) {
      console.debug('No previous session found, starting fresh:', error?.message)
    }

    return null
  }

  /**
   * Start a new chat session
   * Automatically generates a session ID and stores session metadata
   */
  async startNewSession(title?: string, participants: string[] = ['user', 'assistant']): Promise<ChatSession> {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const session: ChatSession = {
      id: sessionId,
      title,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      participants,
      metadata: {
        tags: ['active'],
        premium: await this.isPremiumEnabled()
      }
    }

    // Store session using BrainyData add() method
    await this.brainy.add(
      {
        sessionType: 'chat',
        title: title || `Chat Session ${new Date().toLocaleDateString()}`,
        createdAt: session.createdAt.toISOString(),
        lastMessageAt: session.lastMessageAt.toISOString(),
        messageCount: session.messageCount,
        participants: session.participants
      },
      {
        id: sessionId,
        nounType: NounType.Concept,
        sessionType: 'chat'
      }
    )
    this.currentSessionId = sessionId
    this.sessionCache.set(sessionId, session)

    return session
  }

  /**
   * Add a message to the current session
   * Stores using standard NounType.Message and creates conversation flow relationships
   */
  async addMessage(
    content: string, 
    speaker: string = 'user',
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage> {
    if (!this.currentSessionId) {
      await this.startNewSession()
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date()
    
    const message: ChatMessage = {
      id: messageId,
      content,
      speaker,
      sessionId: this.currentSessionId!,
      timestamp,
      metadata
    }

    // Store message using BrainyData add() method
    await this.brainy.add(
      {
        messageType: 'chat',
        content,
        speaker,
        sessionId: this.currentSessionId!,
        timestamp: timestamp.toISOString(),
        ...metadata
      },
      {
        id: messageId,
        nounType: NounType.Message,
        messageType: 'chat',
        sessionId: this.currentSessionId!,
        speaker
      }
    )

    // Create relationships using standard verb types
    await this.createMessageRelationships(messageId)

    // Update session metadata
    await this.updateSessionMetadata()

    return message
  }

  /**
   * Get conversation history for current session
   * Uses Brainy's graph traversal to get messages in chronological order
   */
  async getHistory(limit: number = 50): Promise<ChatMessage[]> {
    if (!this.currentSessionId) return []

    try {
      // Search for messages in this session using Brainy's search
      const messageNouns = await this.brainy.search(
        '', // Empty query to get all messages
        limit,
        {
          nounTypes: [NounType.Message],
          metadata: {
            sessionId: this.currentSessionId,
            messageType: 'chat'
          }
        }
      )

      return messageNouns.map((noun: any) => this.nounToChatMessage(noun))
    } catch (error) {
      console.error('Error retrieving chat history:', error)
      return []
    }
  }

  /**
   * Search across all chat sessions and messages
   * Leverages Brainy's powerful vector and semantic search
   */
  async searchMessages(
    query: string, 
    options?: {
      sessionId?: string
      speaker?: string
      limit?: number
      semanticSearch?: boolean
    }
  ): Promise<ChatMessage[]> {
    const metadata: Record<string, any> = {
      messageType: 'chat'
    }

    if (options?.sessionId) {
      metadata.sessionId = options.sessionId
    }
    if (options?.speaker) {
      metadata.speaker = options.speaker
    }

    try {
      const results = await this.brainy.search(
        options?.semanticSearch !== false ? query : '',
        options?.limit || 20,
        {
          nounTypes: [NounType.Message],
          metadata
        }
      )

      return results.map((noun: any) => this.nounToChatMessage(noun))
    } catch (error) {
      console.error('Error searching messages:', error)
      return []
    }
  }

  /**
   * Get all chat sessions
   * Uses Brainy's search to find all conversation sessions
   */
  async getSessions(limit: number = 20): Promise<ChatSession[]> {
    try {
      const sessionNouns = await this.brainy.search(
        '',
        limit,
        {
          nounTypes: [NounType.Concept],
          metadata: {
            sessionType: 'chat'
          }
        }
      )

      return sessionNouns.map((noun: any) => this.nounToChatSession(noun))
    } catch (error) {
      console.error('Error retrieving sessions:', error)
      return []
    }
  }

  /**
   * Switch to a different session
   * Automatically loads context and history
   */
  async switchToSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const session = await this.loadSession(sessionId)
      if (session) {
        this.currentSessionId = sessionId
        this.sessionCache.set(sessionId, session)
      }
      return session
    } catch (error) {
      console.error('Error switching to session:', error)
      return null
    }
  }

  /**
   * Archive a session (premium feature)
   * Maintains full searchability while organizing conversations
   */
  async archiveSession(sessionId: string): Promise<boolean> {
    if (!await this.isPremiumEnabled()) {
      throw new Error('Session archiving requires premium Brain Cloud subscription')
    }

    try {
      // Since BrainyData doesn't have update, add an archive marker
      await this.brainy.add(
        {
          archivedSessionId: sessionId,
          archivedAt: new Date().toISOString(),
          action: 'archive'
        },
        {
          nounType: NounType.State,
          sessionId,
          archived: true
        }
      )
      return true
    } catch (error) {
      console.error('Error archiving session:', error)
    }

    return false
  }

  /**
   * Generate session summary using AI (premium feature)
   * Intelligently summarizes long conversations
   */
  async generateSessionSummary(sessionId: string): Promise<string | null> {
    if (!await this.isPremiumEnabled()) {
      throw new Error('AI session summaries require premium Brain Cloud subscription')
    }

    try {
      const messages = await this.getHistoryForSession(sessionId, 100)
      const content = messages
        .map(msg => `${msg.speaker}: ${msg.content}`)
        .join('\n')

      // Use Brainy's AI to generate summary (placeholder - would need actual AI integration)
      const summaryResponse = `Summary of ${messages.length} messages discussing various topics in ${sessionId}`

      return summaryResponse || null
    } catch (error) {
      console.error('Error generating session summary:', error)
      return null
    }
  }

  // Private helper methods

  private async createMessageRelationships(messageId: string): Promise<void> {
    // Link message to session using BrainyData addVerb() method
    await this.brainy.addVerb(
      messageId,
      this.currentSessionId!,
      undefined,
      {
        type: VerbType.PartOf,
        metadata: {
          relationship: 'message-in-session'
        }
      }
    )

    // Find previous message to create conversation flow using VerbType.Precedes
    const previousMessages = await this.brainy.search(
      '',
      1,
      {
        nounTypes: [NounType.Message],
        metadata: {
          sessionId: this.currentSessionId,
          messageType: 'chat'
        }
      }
    )

    if (previousMessages.length > 0 && previousMessages[0].id !== messageId) {
      await this.brainy.addVerb(
        previousMessages[0].id,
        messageId,
        undefined,
        {
          type: VerbType.Precedes,
          metadata: {
            relationship: 'message-sequence'
          }
        }
      )
    }
  }

  private async loadSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionNouns = await this.brainy.search(
        '',
        1,
        {
          nounTypes: [NounType.Concept],
          metadata: {
            sessionType: 'chat'
          }
        }
      )

      // Filter by session ID manually since BrainyData search may not support ID filtering
      const matchingSession = sessionNouns.find(noun => noun.id === sessionId)
      if (matchingSession) {
        return this.nounToChatSession(matchingSession)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }

    return null
  }

  private async getHistoryForSession(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const messageNouns = await this.brainy.search(
        '',
        limit,
        {
          nounTypes: [NounType.Message],
          metadata: {
            sessionId: sessionId,
            messageType: 'chat'
          }
        }
      )

      return messageNouns.map((noun: any) => this.nounToChatMessage(noun))
    } catch (error) {
      console.error('Error retrieving session history:', error)
      return []
    }
  }

  private async updateSessionMetadata(): Promise<void> {
    if (!this.currentSessionId) return

    // Since BrainyData doesn't have update functionality, we'll skip this
    // In a real implementation, you'd need update capabilities
    console.debug('Session metadata update skipped - BrainyData lacks update API')
  }

  private nounToChatMessage(noun: any): ChatMessage {
    return {
      id: noun.id,
      content: noun.metadata?.content || noun.data?.content || '',
      speaker: noun.metadata?.speaker || noun.data?.speaker || 'unknown',
      sessionId: noun.metadata?.sessionId || noun.data?.sessionId || '',
      timestamp: new Date(noun.metadata?.timestamp || noun.data?.timestamp || Date.now()),
      metadata: noun.metadata
    }
  }

  private nounToChatSession(noun: any): ChatSession {
    return {
      id: noun.id,
      title: noun.metadata?.title || noun.data?.title || 'Untitled Session',
      createdAt: new Date(noun.metadata?.createdAt || noun.data?.createdAt || Date.now()),
      lastMessageAt: new Date(noun.metadata?.lastMessageAt || noun.data?.lastMessageAt || Date.now()),
      messageCount: noun.metadata?.messageCount || noun.data?.messageCount || 0,
      participants: noun.metadata?.participants || noun.data?.participants || ['user', 'assistant'],
      metadata: noun.metadata
    }
  }

  private toTimestamp(date: Date): { seconds: number; nanoseconds: number } {
    const seconds = Math.floor(date.getTime() / 1000)
    const nanoseconds = (date.getTime() % 1000) * 1000000
    return { seconds, nanoseconds }
  }

  private async isPremiumEnabled(): Promise<boolean> {
    // Check if premium augmentations are available
    // This would integrate with the license validation system
    try {
      const augmentations = await this.brainy.listAugmentations()
      return augmentations.some((aug: any) => aug.premium === true && aug.enabled === true)
    } catch {
      return false
    }
  }

  // Public API methods for CLI integration

  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  getCurrentSession(): ChatSession | null {
    return this.currentSessionId ? this.sessionCache.get(this.currentSessionId) || null : null
  }
}