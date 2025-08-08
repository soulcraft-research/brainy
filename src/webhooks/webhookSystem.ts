/**
 * Webhook System - Enterprise Event Notifications
 * 
 * 🧠⚛️ Real-time notifications for augmentation events, data changes, and system alerts
 * Critical for enterprise integrations and premium connectors
 */

import { EventEmitter } from 'events'
import { BrainyDataInterface } from '../types/brainyDataInterface.js'

export interface WebhookConfig {
  url: string
  events: WebhookEventType[]
  headers?: Record<string, string>
  secret?: string
  retryPolicy?: {
    maxRetries: number
    backoffMs: number
    maxBackoffMs: number
  }
  filters?: {
    augmentations?: string[]
    metadata?: Record<string, any>
  }
  enabled: boolean
}

export type WebhookEventType = 
  | 'data.added'
  | 'data.updated'
  | 'data.deleted'
  | 'augmentation.triggered'
  | 'augmentation.completed'
  | 'augmentation.failed'
  | 'connector.sync.started'
  | 'connector.sync.completed'
  | 'connector.sync.failed'
  | 'graph.relationship.created'
  | 'graph.relationship.deleted'
  | 'system.alert'
  | 'license.expired'
  | 'license.renewed'

export interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: any
  metadata?: Record<string, any>
  brainyId?: string
  augmentationId?: string
  signature?: string
}

export interface WebhookResponse {
  success: boolean
  statusCode?: number
  error?: string
  retryAfter?: number
}

export class WebhookSystem extends EventEmitter {
  private webhooks: Map<string, WebhookConfig> = new Map()
  private brainy: BrainyDataInterface
  private retryQueues: Map<string, any[]> = new Map()
  private isRunning: boolean = false

  constructor(brainy: BrainyDataInterface) {
    super()
    this.brainy = brainy
    this.setupEventListeners()
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(id: string, config: WebhookConfig): Promise<void> {
    // Validate URL
    try {
      new URL(config.url)
    } catch {
      throw new Error(`Invalid webhook URL: ${config.url}`)
    }

    // Set default retry policy
    if (!config.retryPolicy) {
      config.retryPolicy = {
        maxRetries: 3,
        backoffMs: 1000,
        maxBackoffMs: 30000
      }
    }

    this.webhooks.set(id, config)
    this.retryQueues.set(id, [])

    console.log(`🔔⚛️ Webhook registered: ${id} → ${config.url}`)
  }

  /**
   * Remove a webhook
   */
  async unregisterWebhook(id: string): Promise<void> {
    this.webhooks.delete(id)
    this.retryQueues.delete(id)
    console.log(`🔔 Webhook unregistered: ${id}`)
  }

  /**
   * List all webhooks
   */
  listWebhooks(): Array<{ id: string; config: WebhookConfig }> {
    return Array.from(this.webhooks.entries()).map(([id, config]) => ({
      id,
      config
    }))
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(event: WebhookEventType, data: any, metadata?: Record<string, any>): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata
    }

    // Find webhooks subscribed to this event
    for (const [id, config] of this.webhooks.entries()) {
      if (!config.enabled) continue
      if (!config.events.includes(event)) continue

      // Apply filters
      if (config.filters) {
        if (config.filters.augmentations && metadata?.augmentation) {
          if (!config.filters.augmentations.includes(metadata.augmentation)) {
            continue
          }
        }
        
        if (config.filters.metadata) {
          let matchesFilter = true
          for (const [key, value] of Object.entries(config.filters.metadata)) {
            if (metadata?.[key] !== value) {
              matchesFilter = false
              break
            }
          }
          if (!matchesFilter) continue
        }
      }

      // Sign payload if secret provided
      if (config.secret) {
        payload.signature = await this.signPayload(payload, config.secret)
      }

      // Send webhook
      this.sendWebhook(id, config, payload)
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(
    id: string, 
    config: WebhookConfig, 
    payload: WebhookPayload,
    retryCount: number = 0
  ): Promise<void> {
    try {
      const response = await this.executeWebhook(config, payload)
      
      if (response.success) {
        console.log(`✅ Webhook delivered: ${id} → ${config.url}`)
        this.emit('webhook:delivered', { id, payload, response })
      } else {
        throw new Error(response.error || `HTTP ${response.statusCode}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Webhook failed: ${id} → ${errorMessage}`)
      
      // Retry logic
      if (retryCount < config.retryPolicy!.maxRetries) {
        const backoff = Math.min(
          config.retryPolicy!.backoffMs * Math.pow(2, retryCount),
          config.retryPolicy!.maxBackoffMs
        )
        
        console.log(`🔄 Retrying webhook ${id} in ${backoff}ms (attempt ${retryCount + 1})`)
        
        setTimeout(() => {
          this.sendWebhook(id, config, payload, retryCount + 1)
        }, backoff)
      } else {
        console.error(`❌ Webhook ${id} failed after ${retryCount} retries`)
        this.emit('webhook:failed', { id, payload, error: errorMessage })
        
        // Add to dead letter queue
        this.retryQueues.get(id)?.push({ payload, failedAt: new Date() })
      }
    }
  }

  /**
   * Execute HTTP webhook call
   */
  private async executeWebhook(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookResponse> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brainy-Event': payload.event,
          'X-Brainy-Signature': payload.signature || '',
          ...config.headers
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeout)

      return {
        success: response.ok,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sign webhook payload for security
   */
  private async signPayload(payload: WebhookPayload, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(payload))
    const key = encoder.encode(secret)
    
    // Simple HMAC-like signature (in production, use proper crypto)
    const signature = btoa(String.fromCharCode(...new Uint8Array(data)))
    return signature
  }

  /**
   * Setup event listeners on Brainy
   */
  private setupEventListeners(): void {
    // Data events
    this.brainy.on?.('data:added', (data) => {
      this.triggerWebhook('data.added', data)
    })

    this.brainy.on?.('data:updated', (data) => {
      this.triggerWebhook('data.updated', data)
    })

    this.brainy.on?.('data:deleted', (data) => {
      this.triggerWebhook('data.deleted', data)
    })

    // Augmentation events
    this.brainy.on?.('augmentation:triggered', (data) => {
      this.triggerWebhook('augmentation.triggered', data, {
        augmentation: data.augmentationId
      })
    })

    this.brainy.on?.('augmentation:completed', (data) => {
      this.triggerWebhook('augmentation.completed', data, {
        augmentation: data.augmentationId
      })
    })

    this.brainy.on?.('augmentation:failed', (data) => {
      this.triggerWebhook('augmentation.failed', data, {
        augmentation: data.augmentationId
      })
    })

    // Graph events
    this.brainy.on?.('graph:relationship:created', (data) => {
      this.triggerWebhook('graph.relationship.created', data)
    })

    this.brainy.on?.('graph:relationship:deleted', (data) => {
      this.triggerWebhook('graph.relationship.deleted', data)
    })
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(id: string): Promise<boolean> {
    const config = this.webhooks.get(id)
    if (!config) {
      throw new Error(`Webhook ${id} not found`)
    }

    const testPayload: WebhookPayload = {
      event: 'system.alert',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Test webhook from Brainy',
        test: true
      },
      metadata: {
        webhookId: id
      }
    }

    if (config.secret) {
      testPayload.signature = await this.signPayload(testPayload, config.secret)
    }

    const response = await this.executeWebhook(config, testPayload)
    return response.success
  }

  /**
   * Retry failed webhooks
   */
  async retryFailed(id: string): Promise<number> {
    const queue = this.retryQueues.get(id)
    const config = this.webhooks.get(id)
    
    if (!queue || !config) {
      return 0
    }

    const failed = [...queue]
    this.retryQueues.set(id, [])

    let retried = 0
    for (const item of failed) {
      await this.sendWebhook(id, config, item.payload)
      retried++
    }

    return retried
  }

  /**
   * Get webhook statistics
   */
  getStatistics(): {
    total: number
    enabled: number
    failedQueues: Array<{ id: string; count: number }>
  } {
    const enabled = Array.from(this.webhooks.values()).filter(w => w.enabled).length
    const failedQueues = Array.from(this.retryQueues.entries()).map(([id, queue]) => ({
      id,
      count: queue.length
    }))

    return {
      total: this.webhooks.size,
      enabled,
      failedQueues
    }
  }
}

/**
 * Webhook builder for easy configuration
 */
export class WebhookBuilder {
  private config: Partial<WebhookConfig> = {
    events: [],
    enabled: true
  }

  url(url: string): this {
    this.config.url = url
    return this
  }

  events(...events: WebhookEventType[]): this {
    this.config.events = events
    return this
  }

  headers(headers: Record<string, string>): this {
    this.config.headers = headers
    return this
  }

  secret(secret: string): this {
    this.config.secret = secret
    return this
  }

  retry(maxRetries: number, backoffMs: number = 1000): this {
    this.config.retryPolicy = {
      maxRetries,
      backoffMs,
      maxBackoffMs: backoffMs * 10
    }
    return this
  }

  filter(filters: WebhookConfig['filters']): this {
    this.config.filters = filters
    return this
  }

  build(): WebhookConfig {
    if (!this.config.url) {
      throw new Error('Webhook URL is required')
    }
    if (!this.config.events || this.config.events.length === 0) {
      throw new Error('At least one event type is required')
    }
    return this.config as WebhookConfig
  }
}