/**
 * Brainy Chat - Talk to Your Data
 * 
 * Simple, powerful conversational AI for your Brainy database.
 * Works with zero configuration, optionally enhanced with LLM.
 */

import { BrainyData } from '../brainyData.js'
import { SearchResult } from '../coreTypes.js'

export interface ChatOptions {
  /** Optional LLM model name or provider:model format */
  llm?: string
  /** Include source references in responses */
  sources?: boolean
  /** API key for LLM provider (if needed) */
  apiKey?: string
}

interface LLMProvider {
  generate(prompt: string, context: any): Promise<string>
}

export class BrainyChat {
  private brainy: BrainyData
  private llmProvider?: LLMProvider
  private options: ChatOptions
  private history: { question: string; answer: string }[] = []

  constructor(brainy: BrainyData, options: ChatOptions = {}) {
    this.brainy = brainy
    this.options = options
    
    // Load LLM if specified
    if (options.llm) {
      this.initializeLLM(options.llm, options.apiKey)
    }
  }

  /**
   * Initialize LLM provider based on model string
   */
  private async initializeLLM(model: string, apiKey?: string): Promise<void> {
    // Parse provider from model string (e.g., "claude-3-5-sonnet", "gpt-4", "Xenova/LaMini")
    if (model.startsWith('claude') || model.includes('anthropic')) {
      this.llmProvider = new ClaudeLLMProvider(model, apiKey)
    } else if (model.startsWith('gpt') || model.includes('openai')) {
      this.llmProvider = new OpenAILLMProvider(model, apiKey)
    } else if (model.includes('/')) {
      // Hugging Face model format
      this.llmProvider = new HuggingFaceLLMProvider(model)
    } else {
      console.warn(`Unknown LLM model: ${model}, falling back to templates`)
    }
  }

  /**
   * Ask a question - works with or without LLM
   */
  async ask(question: string): Promise<string> {
    // Find relevant context using vector search
    const searchResults = await this.brainy.search(question, 10)
    
    // Generate response
    let answer: string
    if (this.llmProvider) {
      answer = await this.generateWithLLM(question, searchResults)
    } else {
      answer = this.generateWithTemplate(question, searchResults)
    }
    
    // Add sources if requested
    if (this.options.sources && searchResults.length > 0) {
      const sources = searchResults
        .slice(0, 3)
        .map(r => r.id)
        .join(', ')
      answer += `\n[Sources: ${sources}]`
    }
    
    // Track history (keep last 10 exchanges)
    this.history.push({ question, answer })
    if (this.history.length > 10) {
      this.history = this.history.slice(-10)
    }
    
    return answer
  }

  /**
   * Generate response using LLM
   */
  private async generateWithLLM(question: string, context: SearchResult[]): Promise<string> {
    if (!this.llmProvider) {
      return this.generateWithTemplate(question, context)
    }

    // Build context from search results
    const contextData = context.map(item => ({
      id: item.id,
      score: item.score,
      metadata: item.metadata || {}
    }))

    // Include conversation history for context
    const historyContext = this.history.slice(-3).map(h => 
      `Q: ${h.question}\nA: ${h.answer}`
    ).join('\n\n')

    try {
      const response = await this.llmProvider.generate(question, {
        searchResults: contextData,
        history: historyContext
      })
      return response
    } catch (error) {
      console.warn('LLM generation failed, using template:', error)
      return this.generateWithTemplate(question, context)
    }
  }

  /**
   * Generate response with smart templates (no LLM needed)
   */
  private generateWithTemplate(question: string, context: SearchResult[]): string {
    if (context.length === 0) {
      return "I couldn't find relevant information to answer that question."
    }
    
    const q = question.toLowerCase()
    
    // Quantitative questions
    if (q.includes('how many') || q.includes('count')) {
      const count = context.length
      const items = context.slice(0, 3).map(c => c.id).join(', ')
      return `I found ${count} relevant items. The top matches are: ${items}.`
    }
    
    // Comparison questions
    if (q.includes('compare') || q.includes('difference') || q.includes('vs')) {
      if (context.length < 2) {
        return "I need at least two items to make a comparison."
      }
      const first = context[0]
      const second = context[1]
      return `Comparing "${first.id}" (${(first.score * 100).toFixed(0)}% relevance) with "${second.id}" (${(second.score * 100).toFixed(0)}% relevance). Both are related to your query but ${first.id} shows stronger similarity.`
    }
    
    // List questions
    if (q.includes('list') || q.includes('what are') || q.includes('show me')) {
      const items = context.slice(0, 5).map((c, i) => 
        `${i + 1}. ${c.id}${c.metadata?.description ? ': ' + c.metadata.description : ''}`
      ).join('\n')
      return `Here are the top results:\n${items}`
    }
    
    // Analysis questions
    if (q.includes('analyze') || q.includes('explain') || q.includes('why')) {
      const top = context[0]
      const metadata = top.metadata || {}
      const details = Object.entries(metadata)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ')
      return `Based on my analysis of "${top.id}" (${(top.score * 100).toFixed(0)}% relevant): ${details || 'This item matches your query based on semantic similarity.'}`
    }
    
    // Trend/pattern questions
    if (q.includes('trend') || q.includes('pattern')) {
      const items = context.slice(0, 3).map(c => c.id)
      return `I identified patterns across ${context.length} related items. Key examples include: ${items.join(', ')}. These show common characteristics related to "${question}".`
    }
    
    // Yes/No questions
    if (q.startsWith('is') || q.startsWith('are') || q.startsWith('does') || q.startsWith('do')) {
      const confidence = context[0].score
      if (confidence > 0.8) {
        return `Yes, based on "${context[0].id}" with ${(confidence * 100).toFixed(0)}% confidence.`
      } else if (confidence > 0.5) {
        return `Possibly. I found "${context[0].id}" with ${(confidence * 100).toFixed(0)}% relevance to your question.`
      } else {
        return `I'm not certain. The closest match is "${context[0].id}" but with only ${(confidence * 100).toFixed(0)}% relevance.`
      }
    }
    
    // Default response - provide the most relevant information
    const top = context[0]
    const metadata = top.metadata ? 
      Object.entries(top.metadata)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ') : 
      'no additional details'
    
    return `Based on "${top.id}" (${(top.score * 100).toFixed(0)}% relevant): ${metadata}`
  }

  /**
   * Interactive chat mode (Node.js only)
   */
  async chat(): Promise<void> {
    // Check if we're in Node.js
    if (typeof process === 'undefined' || !process.stdin) {
      console.log('Interactive chat is only available in Node.js environment')
      return
    }

    const readline = await import('readline')
    const rl = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout,
      prompt: 'You> '
    })
    
    console.log('\n🧠 Brainy Chat - Interactive Mode')
    console.log('Type your questions or "exit" to quit\n')
    
    rl.prompt()
    
    rl.on('line', async (line) => {
      const input = line.trim()
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('\nGoodbye! 👋')
        rl.close()
        return
      }
      
      if (input) {
        try {
          const answer = await this.ask(input)
          console.log(`\n🤖 ${answer}\n`)
        } catch (error) {
          console.log(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`)
        }
      }
      
      rl.prompt()
    })
    
    rl.on('close', () => {
      process.exit(0)
    })
  }
}

/**
 * Claude LLM Provider
 */
class ClaudeLLMProvider implements LLMProvider {
  private model: string
  private apiKey?: string

  constructor(model: string, apiKey?: string) {
    this.model = model.includes('claude') ? model : `claude-3-5-sonnet-20241022`
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY
  }

  async generate(prompt: string, context: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key required. Set ANTHROPIC_API_KEY or pass apiKey option.')
    }

    const systemPrompt = `You are a helpful AI assistant with access to a vector database. 
Answer questions based on the provided context from semantic search results.
Be concise and accurate. If the context doesn't contain relevant information, say so.`

    const userPrompt = `Context from database search:
${JSON.stringify(context.searchResults, null, 2)}

Recent conversation:
${context.history || 'No previous conversation'}

Question: ${prompt}

Please provide a helpful answer based on the context above.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          messages: [
            { role: 'user', content: userPrompt }
          ],
          system: systemPrompt
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      throw new Error(`Failed to generate with Claude: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * OpenAI LLM Provider
 */
class OpenAILLMProvider implements LLMProvider {
  private model: string
  private apiKey?: string

  constructor(model: string, apiKey?: string) {
    this.model = model.includes('gpt') ? model : 'gpt-4o-mini'
    this.apiKey = apiKey || process.env.OPENAI_API_KEY
  }

  async generate(prompt: string, context: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY or pass apiKey option.')
    }

    const systemPrompt = `You are a helpful AI assistant with access to a vector database. 
Answer questions based on the provided context from semantic search results.`

    const userPrompt = `Context: ${JSON.stringify(context.searchResults)}
History: ${context.history || 'None'}
Question: ${prompt}`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      throw new Error(`Failed to generate with OpenAI: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Hugging Face Local LLM Provider
 */
class HuggingFaceLLMProvider implements LLMProvider {
  private model: string
  private pipeline: any

  constructor(model: string) {
    this.model = model
    this.initializePipeline()
  }

  private async initializePipeline() {
    try {
      // Lazy load transformers.js - this is optional and may not be installed
      // @ts-ignore - Optional dependency
      const transformersModule = await import('@huggingface/transformers').catch(() => null)
      if (transformersModule) {
        const { pipeline } = transformersModule
        this.pipeline = await pipeline('text2text-generation', this.model)
      } else {
        console.warn(`Transformers.js not installed. Install with: npm install @huggingface/transformers`)
      }
    } catch (error) {
      console.warn(`Failed to load Hugging Face model ${this.model}:`, error)
    }
  }

  async generate(prompt: string, context: any): Promise<string> {
    if (!this.pipeline) {
      throw new Error('Hugging Face model not loaded')
    }

    const input = `Answer based on context: ${JSON.stringify(context.searchResults).slice(0, 500)}
Question: ${prompt}
Answer:`

    try {
      const result = await this.pipeline(input, {
        max_new_tokens: 150,
        temperature: 0.7
      })
      return result[0].generated_text.trim()
    } catch (error) {
      throw new Error(`Failed to generate with Hugging Face: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}