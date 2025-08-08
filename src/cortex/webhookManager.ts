/**
 * Webhook Manager for Cortex CLI
 * 
 * 🧠⚛️ Manage webhooks through Cortex for enterprise integrations
 */

import chalk from 'chalk'
import boxen from 'boxen'
import Table from 'cli-table3'
import prompts from 'prompts'
import { WebhookSystem, WebhookBuilder, WebhookEventType } from '../webhooks/webhookSystem.js'

export class WebhookManager {
  private webhookSystem: WebhookSystem
  private colors: any
  private emojis: any

  constructor(brainy: any) {
    this.webhookSystem = new WebhookSystem(brainy)
    
    this.colors = {
      primary: chalk.hex('#3A5F4A'),
      success: chalk.hex('#2D4A3A'),
      warning: chalk.hex('#D67441'),
      error: chalk.hex('#B85C35'),
      info: chalk.hex('#4A6B5A'),
      dim: chalk.hex('#8A9B8A'),
      highlight: chalk.hex('#E88B5A'),
      accent: chalk.hex('#F5E6D3')
    }

    this.emojis = {
      webhook: '🔔',
      atom: '⚛️',
      check: '✅',
      cross: '❌',
      warning: '⚠️',
      sync: '🔄',
      sparkle: '✨',
      gear: '⚙️'
    }
  }

  /**
   * Add a new webhook interactively
   */
  async addWebhook(): Promise<void> {
    console.log(boxen(
      `${this.emojis.webhook} ${this.colors.primary('WEBHOOK CONFIGURATION')} ${this.emojis.atom}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    const answers = await prompts([
      {
        type: 'text',
        name: 'id',
        message: 'Webhook ID (unique identifier):',
        validate: (value: string) => value.length > 0 || 'ID is required'
      },
      {
        type: 'text',
        name: 'url',
        message: 'Webhook URL:',
        validate: (value: string) => {
          try {
            new URL(value)
            return true
          } catch {
            return 'Invalid URL format'
          }
        }
      },
      {
        type: 'multiselect',
        name: 'events',
        message: 'Select events to subscribe to:',
        choices: [
          { title: 'Data Added', value: 'data.added', selected: true },
          { title: 'Data Updated', value: 'data.updated' },
          { title: 'Data Deleted', value: 'data.deleted' },
          { title: 'Augmentation Triggered', value: 'augmentation.triggered' },
          { title: 'Augmentation Completed', value: 'augmentation.completed', selected: true },
          { title: 'Augmentation Failed', value: 'augmentation.failed' },
          { title: 'Connector Sync Started', value: 'connector.sync.started' },
          { title: 'Connector Sync Completed', value: 'connector.sync.completed' },
          { title: 'Connector Sync Failed', value: 'connector.sync.failed' },
          { title: 'Graph Relationship Created', value: 'graph.relationship.created' },
          { title: 'System Alert', value: 'system.alert' }
        ],
        min: 1
      },
      {
        type: 'text',
        name: 'secret',
        message: 'Webhook secret (optional, for signature verification):'
      },
      {
        type: 'confirm',
        name: 'addHeaders',
        message: 'Add custom headers?',
        initial: false
      }
    ])

    if (!answers.id || !answers.url) {
      console.log(this.colors.dim('Webhook configuration cancelled'))
      return
    }

    const builder = new WebhookBuilder()
      .url(answers.url)
      .events(...answers.events as WebhookEventType[])

    if (answers.secret) {
      builder.secret(answers.secret)
    }

    // Add custom headers if requested
    if (answers.addHeaders) {
      const headers: Record<string, string> = {}
      let addMore = true

      while (addMore) {
        const header = await prompts([
          {
            type: 'text',
            name: 'key',
            message: 'Header name:'
          },
          {
            type: 'text',
            name: 'value',
            message: 'Header value:'
          },
          {
            type: 'confirm',
            name: 'continue',
            message: 'Add another header?',
            initial: false
          }
        ])

        if (header.key && header.value) {
          headers[header.key] = header.value
        }

        addMore = header.continue
      }

      if (Object.keys(headers).length > 0) {
        builder.headers(headers)
      }
    }

    // Configure retry policy
    const retryConfig = await prompts([
      {
        type: 'number',
        name: 'maxRetries',
        message: 'Max retry attempts:',
        initial: 3,
        min: 0,
        max: 10
      },
      {
        type: 'number',
        name: 'backoffMs',
        message: 'Initial retry delay (ms):',
        initial: 1000,
        min: 100,
        max: 60000
      }
    ])

    builder.retry(retryConfig.maxRetries, retryConfig.backoffMs)

    try {
      await this.webhookSystem.registerWebhook(answers.id, builder.build())
      
      console.log(boxen(
        `${this.emojis.check} ${this.colors.success('WEBHOOK REGISTERED')} ${this.emojis.atom}\n\n` +
        `${this.colors.accent('ID:')} ${answers.id}\n` +
        `${this.colors.accent('URL:')} ${answers.url}\n` +
        `${this.colors.accent('Events:')} ${answers.events.length} subscribed`,
        { padding: 1, borderStyle: 'round', borderColor: '#2D4A3A' }
      ))

      // Offer to test
      const { test } = await prompts({
        type: 'confirm',
        name: 'test',
        message: 'Test webhook now?',
        initial: true
      })

      if (test) {
        await this.testWebhook(answers.id)
      }
    } catch (error: any) {
      console.error(`${this.emojis.cross} Failed to register webhook:`, error.message)
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<void> {
    const webhooks = this.webhookSystem.listWebhooks()
    const stats = this.webhookSystem.getStatistics()

    console.log(boxen(
      `${this.emojis.webhook} ${this.colors.primary('REGISTERED WEBHOOKS')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('Total:')} ${stats.total}\n` +
      `${this.colors.accent('Enabled:')} ${stats.enabled}\n` +
      `${this.colors.accent('Failed Queues:')} ${stats.failedQueues.filter(q => q.count > 0).length}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    if (webhooks.length === 0) {
      console.log(this.colors.dim('\nNo webhooks registered'))
      console.log(this.colors.dim('Use "cortex webhook add" to register a webhook'))
      return
    }

    const table = new Table({
      head: ['ID', 'URL', 'Events', 'Status', 'Failed'],
      style: {
        head: ['cyan'],
        border: ['grey']
      }
    })

    for (const { id, config } of webhooks) {
      const failedCount = stats.failedQueues.find(q => q.id === id)?.count || 0
      
      table.push([
        id,
        config.url.length > 40 ? config.url.substring(0, 37) + '...' : config.url,
        config.events.length.toString(),
        config.enabled ? this.colors.success('Enabled') : this.colors.dim('Disabled'),
        failedCount > 0 ? this.colors.warning(failedCount.toString()) : '-'
      ])
    }

    console.log(table.toString())
  }

  /**
   * Test a webhook
   */
  async testWebhook(id: string): Promise<void> {
    const spinner = '⚛️'
    console.log(`${spinner} Testing webhook ${id}...`)

    try {
      const success = await this.webhookSystem.testWebhook(id)
      
      if (success) {
        console.log(`${this.emojis.check} Webhook test successful! Server responded correctly.`)
      } else {
        console.log(`${this.emojis.cross} Webhook test failed. Check the URL and server.`)
      }
    } catch (error: any) {
      console.error(`${this.emojis.cross} Test failed:`, error.message)
    }
  }

  /**
   * Remove a webhook
   */
  async removeWebhook(id: string): Promise<void> {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Remove webhook "${id}"?`,
      initial: false
    })

    if (!confirm) {
      console.log(this.colors.dim('Cancelled'))
      return
    }

    await this.webhookSystem.unregisterWebhook(id)
    console.log(`${this.emojis.check} Webhook "${id}" removed`)
  }

  /**
   * Retry failed webhooks
   */
  async retryFailed(id: string): Promise<void> {
    console.log(`${this.emojis.sync} Retrying failed webhooks for "${id}"...`)
    
    const count = await this.webhookSystem.retryFailed(id)
    
    if (count > 0) {
      console.log(`${this.emojis.check} Retried ${count} failed webhook(s)`)
    } else {
      console.log(this.colors.dim('No failed webhooks to retry'))
    }
  }

  /**
   * Configure webhook interactively
   */
  async configureWebhook(id: string): Promise<void> {
    const webhooks = this.webhookSystem.listWebhooks()
    const webhook = webhooks.find(w => w.id === id)

    if (!webhook) {
      console.error(`${this.emojis.cross} Webhook "${id}" not found`)
      return
    }

    console.log(boxen(
      `${this.emojis.gear} ${this.colors.primary('CONFIGURE WEBHOOK')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('ID:')} ${id}\n` +
      `${this.colors.accent('Current URL:')} ${webhook.config.url}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to configure?',
      choices: [
        { title: 'Change URL', value: 'url' },
        { title: 'Update Events', value: 'events' },
        { title: 'Set Secret', value: 'secret' },
        { title: 'Toggle Enable/Disable', value: 'toggle' },
        { title: 'Update Retry Policy', value: 'retry' },
        { title: 'Cancel', value: 'cancel' }
      ]
    })

    switch (action) {
      case 'url':
        const { newUrl } = await prompts({
          type: 'text',
          name: 'newUrl',
          message: 'New webhook URL:',
          initial: webhook.config.url
        })
        if (newUrl) {
          webhook.config.url = newUrl
          await this.webhookSystem.unregisterWebhook(id)
          await this.webhookSystem.registerWebhook(id, webhook.config)
          console.log(`${this.emojis.check} URL updated`)
        }
        break

      case 'toggle':
        webhook.config.enabled = !webhook.config.enabled
        await this.webhookSystem.unregisterWebhook(id)
        await this.webhookSystem.registerWebhook(id, webhook.config)
        console.log(`${this.emojis.check} Webhook ${webhook.config.enabled ? 'enabled' : 'disabled'}`)
        break

      case 'cancel':
        console.log(this.colors.dim('Configuration cancelled'))
        break
    }
  }

  /**
   * Show webhook statistics
   */
  async showStatistics(): Promise<void> {
    const stats = this.webhookSystem.getStatistics()

    console.log(boxen(
      `${this.emojis.webhook} ${this.colors.primary('WEBHOOK STATISTICS')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('Total Webhooks:')} ${stats.total}\n` +
      `${this.colors.accent('Enabled:')} ${stats.enabled}\n` +
      `${this.colors.accent('Disabled:')} ${stats.total - stats.enabled}\n\n` +
      `${this.colors.highlight('Failed Queues:')}\n` +
      stats.failedQueues
        .filter(q => q.count > 0)
        .map(q => `  ${this.colors.warning('•')} ${q.id}: ${q.count} failed`)
        .join('\n'),
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))
  }
}