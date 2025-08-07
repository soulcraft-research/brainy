/**
 * Brainy Chat - Talk to Your Data
 * 
 * Simple, powerful conversational AI for your Brainy database.
 * Works with zero configuration, optionally enhanced with LLM.
 */

import { BrainyData } from '../brainyData.js'
import { SearchResult } from '../coreTypes.js'

export interface ChatOptions {
  /** Optional LLM model name (e.g., 'Xenova/LaMini-Flan-T5-77M') */
  llm?: string
  /** Include source references in responses */
  sources?: boolean
}

export class BrainyChat {
  private brainy: BrainyData
  private llm?: any
  private history: string[] = []

  constructor(brainy: BrainyData, options: ChatOptions = {}) {
    this.brainy = brainy
    
    // Load LLM if specified (lazy-loaded on first use)
    if (options.llm) {
      this.loadLLM(options.llm)
    }
  }

  /**
   * Ask a question - works with or without LLM
   */
  async ask(question: string): Promise<string> {
    // Find relevant context
    const context = await this.brainy.search(question, 5)
    
    // Generate response
    const answer = this.llm 
      ? await this.generateWithLLM(question, context)
      : this.generateWithTemplate(question, context)
    
    // Track history
    this.history.push(question, answer)
    if (this.history.length > 20) {
      this.history = this.history.slice(-20)
    }
    
    return answer
  }

  /**
   * Load LLM model (lazy, only when needed)
   */
  private async loadLLM(model: string): Promise<void> {
    try {
      const { pipeline } = await import('@huggingface/transformers')
      this.llm = await pipeline('text2text-generation', model, { quantized: true })
    } catch (error) {
      console.log('LLM not available, using templates')
    }
  }

  /**
   * Generate response with LLM
   */
  private async generateWithLLM(question: string, context: SearchResult[]): Promise<string> {
    const contextText = context
      .map(c => `${c.id}: ${JSON.stringify(c.metadata || {})}`)
      .join('\n')
    
    const prompt = `Context:\n${contextText}\n\nQuestion: ${question}\nAnswer:`
    
    try {
      const result = await this.llm(prompt, { max_new_tokens: 150 })
      return result[0].generated_text.trim()
    } catch {
      return this.generateWithTemplate(question, context)
    }
  }

  /**
   * Generate response with templates (no LLM needed)
   */
  private generateWithTemplate(question: string, context: SearchResult[]): string {
    if (context.length === 0) {
      return "I couldn't find relevant information to answer that."
    }
    
    const q = question.toLowerCase()
    
    // Quantitative questions
    if (q.includes('how many') || q.includes('count')) {
      return `I found ${context.length} relevant items. The top matches are: ${
        context.slice(0, 3).map(c => c.id).join(', ')
      }.`
    }
    
    // Comparison questions
    if (q.includes('compare') || q.includes('difference')) {
      if (context.length < 2) return "I need at least two items to compare."
      return `Comparing ${context[0].id} (${(context[0].score * 100).toFixed(0)}% match) with ${
        context[1].id} (${(context[1].score * 100).toFixed(0)}% match).`
    }
    
    // List questions
    if (q.includes('list') || q.includes('what are')) {
      return `Here are the top results:\n${
        context.slice(0, 5).map((c, i) => `${i+1}. ${c.id}`).join('\n')
      }`
    }
    
    // General response
    const top = context[0]
    const metadata = top.metadata ? 
      Object.entries(top.metadata).slice(0, 3)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ') : 
      'no details'
    
    return `Based on "${top.id}" (${(top.score * 100).toFixed(0)}% relevant): ${metadata}`
  }

  /**
   * Interactive chat mode
   */
  async chat(): Promise<void> {
    const readline = await import('readline')
    const rl = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout 
    })
    
    console.log('\n🧠 Chat with your data (type "exit" to quit)\n')
    
    const prompt = () => {
      rl.question('You: ', async (question) => {
        if (question === 'exit') {
          rl.close()
          return
        }
        
        const answer = await this.ask(question)
        console.log(`\nAI: ${answer}\n`)
        prompt()
      })
    }
    
    prompt()
  }
}