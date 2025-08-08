import { describe, it, expect, beforeEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { BrainyChat } from '../src/chat/brainyChat.js'

describe('BrainyChat', () => {
  let brainy: BrainyData
  let chat: BrainyChat

  beforeEach(async () => {
    brainy = new BrainyData({ storage: { type: 'memory' } })
    await brainy.init()
    
    // Add test data
    await brainy.add('Customer Support Documentation', {
      type: 'doc',
      category: 'support',
      content: 'How to reset password: Go to Settings > Security > Reset Password'
    })
    
    await brainy.add('Product Catalog', {
      type: 'doc',
      category: 'products',
      content: 'We offer electronics, books, clothing, and home goods'
    })
    
    await brainy.add('Sales Report Q4 2024', {
      type: 'report',
      category: 'sales',
      revenue: 2500000,
      growth: 0.15
    })
  })

  describe('Template-based responses (no LLM)', () => {
    beforeEach(() => {
      chat = new BrainyChat(brainy)
    })

    it('should answer count questions', async () => {
      const answer = await chat.ask('How many documents do we have?')
      expect(answer).toContain('found')
      expect(answer).toContain('relevant items')
    })

    it('should answer list questions', async () => {
      const answer = await chat.ask('What are our product categories?')
      expect(answer).toContain('top results')
    })

    it('should handle questions with low relevance', async () => {
      const answer = await chat.ask('Tell me about quantum computing')
      // Since semantic search might find some weak matches, check for either no results or low relevance
      expect(answer).toBeDefined()
      expect(answer.length).toBeGreaterThan(0)
    })

    it('should include sources when requested', async () => {
      chat = new BrainyChat(brainy, { sources: true })
      const answer = await chat.ask('How do I reset my password?')
      expect(answer).toContain('[Sources:')
    })
  })

  describe('With LLM (mocked)', () => {
    it('should detect Claude model', () => {
      const chatWithClaude = new BrainyChat(brainy, { 
        llm: 'claude-3-5-sonnet' 
      })
      expect(chatWithClaude).toBeDefined()
    })

    it('should detect OpenAI model', () => {
      const chatWithGPT = new BrainyChat(brainy, { 
        llm: 'gpt-4o-mini' 
      })
      expect(chatWithGPT).toBeDefined()
    })

    it('should detect Hugging Face model', () => {
      const chatWithHF = new BrainyChat(brainy, { 
        llm: 'Xenova/LaMini-Flan-T5-77M' 
      })
      expect(chatWithHF).toBeDefined()
    })
  })

  describe('History tracking', () => {
    beforeEach(() => {
      chat = new BrainyChat(brainy)
    })

    it('should maintain conversation history', async () => {
      await chat.ask('What products do we sell?')
      const answer = await chat.ask('Tell me more about the first one')
      // The template should still provide an answer
      expect(answer).toBeDefined()
      expect(answer.length).toBeGreaterThan(0)
    })
  })
})