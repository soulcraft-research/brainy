/**
 * Brainy Premium Licensing System - Atomic Age Revenue Engine
 * 
 * 🧠 Manages premium augmentation licenses and subscriptions
 * ⚛️ 1950s retro sci-fi themed licensing with atomic age aesthetics
 * 🚀 Scalable license validation for premium features
 */

// @ts-ignore
import chalk from 'chalk'
// @ts-ignore
import boxen from 'boxen'
// @ts-ignore
import ora from 'ora'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

export interface License {
  id: string
  type: 'premium' | 'enterprise' | 'trial'
  product: string              // e.g., 'salesforce-connector', 'slack-connector'
  tier: 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'expired' | 'suspended' | 'trial'
  issuedTo: string            // Customer identifier
  issuedAt: string            // ISO timestamp
  expiresAt: string           // ISO timestamp
  features: string[]          // Array of enabled features
  limits: {
    apiCallsPerMonth?: number
    dataVolumeGB?: number
    concurrentConnections?: number
    customConnectors?: number
  }
  metadata: {
    customerName: string
    customerEmail: string
    subscriptionId?: string
    paymentStatus?: 'active' | 'past_due' | 'canceled'
  }
  signature: string           // Cryptographic signature for validation
}

export interface LicenseValidationResult {
  valid: boolean
  license?: License
  reason?: string
  expiresIn?: number          // Days until expiration
  usage?: {
    apiCalls: number
    dataUsed: number
    connectionsUsed: number
  }
}

export interface PremiumFeature {
  id: string
  name: string
  description: string
  category: 'connector' | 'intelligence' | 'enterprise'
  requiredTier: 'basic' | 'professional' | 'enterprise'
  monthlyPrice: number
  yearlyPrice: number
  trialDays: number
}

/**
 * Premium Licensing and Revenue Management System
 */
export class LicensingSystem {
  private licensePath: string
  private premiumFeatures: Map<string, PremiumFeature> = new Map()
  private activeLicenses: Map<string, License> = new Map()
  
  private colors = {
    primary: chalk.hex('#3A5F4A'),
    success: chalk.hex('#2D4A3A'),
    warning: chalk.hex('#D67441'),
    error: chalk.hex('#B85C35'),
    info: chalk.hex('#4A6B5A'),
    dim: chalk.hex('#8A9B8A'),
    highlight: chalk.hex('#E88B5A'),
    accent: chalk.hex('#F5E6D3'),
    brain: chalk.hex('#E88B5A'),
    premium: chalk.hex('#FFD700'),    // Gold for premium features
    enterprise: chalk.hex('#C0C0C0')   // Silver for enterprise
  }
  
  private emojis = {
    brain: '🧠',
    atom: '⚛️',
    premium: '👑',
    enterprise: '🏢',
    trial: '⏰',
    lock: '🔒',
    unlock: '🔓',
    key: '🗝️',
    shield: '🛡️',
    check: '✅',
    cross: '❌',
    warning: '⚠️',
    sparkle: '✨',
    rocket: '🚀',
    money: '💰',
    card: '💳',
    gear: '⚙️'
  }

  constructor() {
    this.licensePath = path.join(process.cwd(), '.cortex', 'licenses.json')
    this.initializePremiumFeatures()
  }

  /**
   * Initialize the licensing system
   */
  async initialize(): Promise<void> {
    await this.loadLicenses()
    await this.validateAllLicenses()
  }

  /**
   * Check if a premium feature is licensed and available
   */
  async validateFeature(featureId: string, customerId?: string): Promise<LicenseValidationResult> {
    const feature = this.premiumFeatures.get(featureId)
    if (!feature) {
      return {
        valid: false,
        reason: `Feature '${featureId}' not found`
      }
    }

    // Find applicable license
    let applicableLicense: License | undefined

    for (const license of this.activeLicenses.values()) {
      if (license.features.includes(featureId) && license.status === 'active') {
        if (!customerId || license.issuedTo === customerId) {
          applicableLicense = license
          break
        }
      }
    }

    if (!applicableLicense) {
      return {
        valid: false,
        reason: 'No valid license found for this feature'
      }
    }

    // Check expiration
    const now = new Date()
    const expiryDate = new Date(applicableLicense.expiresAt)
    const expiresIn = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (expiresIn <= 0) {
      return {
        valid: false,
        license: applicableLicense,
        reason: 'License has expired',
        expiresIn: 0
      }
    }

    // Validate signature
    if (!this.validateLicenseSignature(applicableLicense)) {
      return {
        valid: false,
        license: applicableLicense,
        reason: 'License signature is invalid'
      }
    }

    return {
      valid: true,
      license: applicableLicense,
      expiresIn,
      usage: await this.getCurrentUsage(applicableLicense.id)
    }
  }

  /**
   * Display premium features catalog
   */
  async displayFeatureCatalog(): Promise<void> {
    console.log(boxen(
      `${this.emojis.premium} ${this.colors.brain('BRAINY PREMIUM CATALOG')} ${this.emojis.atom}\n` +
      `${this.colors.dim('Unlock the full potential of your atomic-age vector + graph database')}`,
      { padding: 1, borderStyle: 'double', borderColor: '#FFD700', width: 80 }
    ))

    console.log('\n' + this.colors.brain(`${this.emojis.rocket} API CONNECTORS (Premium)`))
    
    const connectors = Array.from(this.premiumFeatures.values())
      .filter(f => f.category === 'connector')
    
    connectors.forEach(feature => {
      const priceMonthly = this.colors.premium(`$${feature.monthlyPrice}/month`)
      const priceYearly = this.colors.success(`$${feature.yearlyPrice}/year`)
      const savings = Math.round(((feature.monthlyPrice * 12 - feature.yearlyPrice) / (feature.monthlyPrice * 12)) * 100)
      
      console.log(
        `\n  ${this.emojis.gear} ${this.colors.highlight(feature.name)}\n` +
        `    ${this.colors.dim(feature.description)}\n` +
        `    ${this.colors.accent('Pricing:')} ${priceMonthly} | ${priceYearly} ${this.colors.success(`(Save ${savings}%)`)} | ${this.colors.info(`${feature.trialDays} days free trial`)}`
      )
    })

    console.log('\n' + this.colors.brain(`${this.emojis.sparkle} INTELLIGENCE FEATURES (Premium)`))
    
    const intelligence = Array.from(this.premiumFeatures.values())
      .filter(f => f.category === 'intelligence')
    
    intelligence.forEach(feature => {
      console.log(
        `\n  ${this.emojis.brain} ${this.colors.highlight(feature.name)}\n` +
        `    ${this.colors.dim(feature.description)}\n` +
        `    ${this.colors.accent('Tier:')} ${this.colors.premium(feature.requiredTier)} | ${this.colors.accent('Trial:')} ${this.colors.info(`${feature.trialDays} days`)}`
      )
    })

    console.log('\n' + this.colors.enterprise(`${this.emojis.enterprise} ENTERPRISE FEATURES`))
    
    const enterprise = Array.from(this.premiumFeatures.values())
      .filter(f => f.category === 'enterprise')
    
    enterprise.forEach(feature => {
      console.log(
        `\n  ${this.emojis.shield} ${this.colors.highlight(feature.name)}\n` +
        `    ${this.colors.dim(feature.description)}\n` +
        `    ${this.colors.accent('Contact sales for pricing')}`
      )
    })

    console.log('\n' + boxen(
      `${this.emojis.money} ${this.colors.premium('START YOUR ATOMIC AGE TRANSFORMATION')}\n\n` +
      `${this.colors.accent('◆')} Free trial for all premium features\n` +
      `${this.colors.accent('◆')} No credit card required to start\n` +
      `${this.colors.accent('◆')} Cancel anytime, no questions asked\n\n` +
      `${this.colors.dim('Visit https://soulcraft-research.com/brainy/premium to get started')}`,
      { padding: 1, borderStyle: 'round', borderColor: '#FFD700' }
    ))
  }

  /**
   * Activate a trial license for a feature
   */
  async startTrial(featureId: string, customerInfo: { name: string, email: string }): Promise<License | null> {
    const feature = this.premiumFeatures.get(featureId)
    if (!feature) {
      console.log(this.colors.error(`Feature '${featureId}' not found`))
      return null
    }

    console.log(boxen(
      `${this.emojis.trial} ${this.colors.brain('ATOMIC TRIAL ACTIVATION')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('◆')} ${this.colors.dim('Feature:')} ${this.colors.highlight(feature.name)}\n` +
      `${this.colors.accent('◆')} ${this.colors.dim('Trial Duration:')} ${this.colors.success(feature.trialDays + ' days')}\n` +
      `${this.colors.accent('◆')} ${this.colors.dim('Customer:')} ${this.colors.primary(customerInfo.name)}`,
      { padding: 1, borderStyle: 'round', borderColor: '#E88B5A' }
    ))

    const now = new Date()
    const expiryDate = new Date(now.getTime() + (feature.trialDays * 24 * 60 * 60 * 1000))

    const license: License = {
      id: this.generateLicenseId(),
      type: 'trial',
      product: featureId,
      tier: 'basic',
      status: 'active',
      issuedTo: customerInfo.email,
      issuedAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      features: [featureId],
      limits: {
        apiCallsPerMonth: 1000,
        dataVolumeGB: 10,
        concurrentConnections: 3,
        customConnectors: 0
      },
      metadata: {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        paymentStatus: 'active'
      },
      signature: ''
    }

    // Generate signature
    license.signature = this.generateLicenseSignature(license)

    // Store license
    this.activeLicenses.set(license.id, license)
    await this.saveLicenses()

    console.log(this.colors.success(`\n${this.emojis.sparkle} Trial activated! License ID: ${license.id}`))
    console.log(this.colors.dim(`Expires: ${expiryDate.toLocaleDateString()}`))

    return license
  }

  /**
   * Check license status and display information
   */
  async checkLicenseStatus(licenseId?: string): Promise<void> {
    if (licenseId) {
      const license = this.activeLicenses.get(licenseId)
      if (!license) {
        console.log(this.colors.error(`License '${licenseId}' not found`))
        return
      }

      await this.displayLicenseDetails(license)
    } else {
      await this.displayAllLicenses()
    }
  }

  /**
   * Initialize premium features catalog
   */
  private initializePremiumFeatures(): void {
    // API Connectors
    this.premiumFeatures.set('salesforce-connector', {
      id: 'salesforce-connector',
      name: 'Salesforce Connector',
      description: 'Real-time sync with Salesforce CRM data, contacts, opportunities, and accounts',
      category: 'connector',
      requiredTier: 'professional',
      monthlyPrice: 49,
      yearlyPrice: 490, // 2 months free
      trialDays: 14
    })

    this.premiumFeatures.set('slack-connector', {
      id: 'slack-connector',
      name: 'Slack Integration',
      description: 'Import Slack channels, messages, and team data for intelligent search',
      category: 'connector',
      requiredTier: 'basic',
      monthlyPrice: 29,
      yearlyPrice: 290,
      trialDays: 7
    })

    this.premiumFeatures.set('notion-connector', {
      id: 'notion-connector',
      name: 'Notion Workspace Sync',
      description: 'Sync Notion pages, databases, and documentation for semantic search',
      category: 'connector',
      requiredTier: 'professional',
      monthlyPrice: 39,
      yearlyPrice: 390,
      trialDays: 14
    })

    this.premiumFeatures.set('hubspot-connector', {
      id: 'hubspot-connector',
      name: 'HubSpot CRM Integration',
      description: 'Connect HubSpot contacts, deals, and marketing data',
      category: 'connector',
      requiredTier: 'professional',
      monthlyPrice: 59,
      yearlyPrice: 590,
      trialDays: 14
    })

    this.premiumFeatures.set('jira-connector', {
      id: 'jira-connector',
      name: 'Jira Project Sync',
      description: 'Import Jira tickets, projects, and development workflows',
      category: 'connector',
      requiredTier: 'basic',
      monthlyPrice: 34,
      yearlyPrice: 340,
      trialDays: 10
    })

    this.premiumFeatures.set('asana-connector', {
      id: 'asana-connector',
      name: 'Asana Project Integration',
      description: 'Sync Asana tasks, projects, teams, and milestone data for intelligent project insights',
      category: 'connector',
      requiredTier: 'professional',
      monthlyPrice: 44,
      yearlyPrice: 440,
      trialDays: 14
    })

    // Intelligence Features  
    this.premiumFeatures.set('auto-insights', {
      id: 'auto-insights',
      name: 'Proactive AI Insights',
      description: 'Automatic pattern detection and intelligent recommendations',
      category: 'intelligence',
      requiredTier: 'professional',
      monthlyPrice: 79,
      yearlyPrice: 790,
      trialDays: 21
    })

    this.premiumFeatures.set('smart-autocomplete', {
      id: 'smart-autocomplete',
      name: 'Intelligent Auto-Complete',
      description: 'Context-aware search suggestions and query completion',
      category: 'intelligence',
      requiredTier: 'basic',
      monthlyPrice: 19,
      yearlyPrice: 190,
      trialDays: 14
    })

    // Enterprise Features
    this.premiumFeatures.set('advanced-security', {
      id: 'advanced-security',
      name: 'Advanced Security Suite',
      description: 'Enterprise-grade encryption, audit logs, and compliance features',
      category: 'enterprise',
      requiredTier: 'enterprise',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      trialDays: 30
    })

    this.premiumFeatures.set('custom-connectors', {
      id: 'custom-connectors',
      name: 'Custom Connector Development',
      description: 'Build and deploy custom API connectors for your specific needs',
      category: 'enterprise',
      requiredTier: 'enterprise',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      trialDays: 30
    })
  }

  /**
   * Load licenses from storage
   */
  private async loadLicenses(): Promise<void> {
    try {
      const data = await fs.readFile(this.licensePath, 'utf8')
      const licenses: License[] = JSON.parse(data)
      
      for (const license of licenses) {
        this.activeLicenses.set(license.id, license)
      }
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
      this.activeLicenses.clear()
    }
  }

  /**
   * Save licenses to storage
   */
  private async saveLicenses(): Promise<void> {
    const dir = path.dirname(this.licensePath)
    await fs.mkdir(dir, { recursive: true })
    
    const licenses = Array.from(this.activeLicenses.values())
    await fs.writeFile(this.licensePath, JSON.stringify(licenses, null, 2))
  }

  /**
   * Validate all loaded licenses
   */
  private async validateAllLicenses(): Promise<void> {
    const now = new Date()
    const expiredLicenses: string[] = []

    for (const [id, license] of this.activeLicenses) {
      const expiryDate = new Date(license.expiresAt)
      
      if (expiryDate <= now) {
        license.status = 'expired'
        expiredLicenses.push(id)
      } else if (!this.validateLicenseSignature(license)) {
        license.status = 'suspended'
        expiredLicenses.push(id)
      }
    }

    if (expiredLicenses.length > 0) {
      await this.saveLicenses()
    }
  }

  /**
   * Generate cryptographic signature for license
   */
  private generateLicenseSignature(license: License): string {
    const data = `${license.id}:${license.type}:${license.product}:${license.issuedTo}:${license.expiresAt}`
    const secret = process.env.BRAINY_LICENSE_SECRET || 'default-secret-key-change-in-production'
    
    return crypto.createHmac('sha256', secret)
      .update(data)
      .digest('hex')
  }

  /**
   * Validate license signature
   */
  private validateLicenseSignature(license: License): boolean {
    const expectedSignature = this.generateLicenseSignature(license)
    return crypto.timingSafeEqual(
      Buffer.from(license.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  /**
   * Generate unique license ID
   */
  private generateLicenseId(): string {
    return 'lic_' + crypto.randomBytes(16).toString('hex')
  }

  /**
   * Get current usage statistics for a license
   */
  private async getCurrentUsage(licenseId: string): Promise<{ apiCalls: number, dataUsed: number, connectionsUsed: number }> {
    // Placeholder - would track actual usage
    return {
      apiCalls: Math.floor(Math.random() * 500),
      dataUsed: Math.floor(Math.random() * 5),
      connectionsUsed: Math.floor(Math.random() * 3)
    }
  }

  /**
   * Display detailed license information
   */
  private async displayLicenseDetails(license: License): Promise<void> {
    const feature = this.premiumFeatures.get(license.product)
    const now = new Date()
    const expiryDate = new Date(license.expiresAt)
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const usage = await this.getCurrentUsage(license.id)

    const statusColor = license.status === 'active' ? this.colors.success :
                       license.status === 'trial' ? this.colors.warning :
                       license.status === 'expired' ? this.colors.error :
                       this.colors.dim

    const statusIcon = license.status === 'active' ? this.emojis.check :
                      license.status === 'trial' ? this.emojis.trial :
                      license.status === 'expired' ? this.emojis.cross :
                      this.emojis.warning

    console.log(boxen(
      `${this.emojis.key} ${this.colors.brain('LICENSE DETAILS')} ${this.emojis.atom}\n\n` +
      `${this.colors.accent('License ID:')} ${this.colors.primary(license.id)}\n` +
      `${this.colors.accent('Product:')} ${this.colors.highlight(feature?.name || license.product)}\n` +
      `${this.colors.accent('Type:')} ${this.colors.premium(license.type)}\n` +
      `${this.colors.accent('Status:')} ${statusIcon} ${statusColor(license.status)}\n` +
      `${this.colors.accent('Customer:')} ${this.colors.primary(license.metadata.customerName)}\n` +
      `${this.colors.accent('Expires:')} ${daysLeft > 0 ? this.colors.success(`${daysLeft} days`) : this.colors.error('Expired')}`,
      { padding: 1, borderStyle: 'round', borderColor: license.status === 'active' ? '#2D4A3A' : '#D67441' }
    ))

    // Usage statistics
    if (license.status === 'active' || license.status === 'trial') {
      console.log('\n' + this.colors.brain(`${this.emojis.gear} USAGE STATISTICS`))
      
      const apiUsage = license.limits.apiCallsPerMonth ? 
        `${usage.apiCalls}/${license.limits.apiCallsPerMonth}` : 
        usage.apiCalls.toString()
      
      const dataUsage = license.limits.dataVolumeGB ? 
        `${usage.dataUsed}GB/${license.limits.dataVolumeGB}GB` : 
        `${usage.dataUsed}GB`
      
      console.log(`  ${this.colors.accent('API Calls:')} ${this.colors.primary(apiUsage)}`)
      console.log(`  ${this.colors.accent('Data Used:')} ${this.colors.primary(dataUsage)}`)
      console.log(`  ${this.colors.accent('Connections:')} ${this.colors.primary(usage.connectionsUsed.toString())}`)
    }
  }

  /**
   * Display all active licenses
   */
  private async displayAllLicenses(): Promise<void> {
    if (this.activeLicenses.size === 0) {
      console.log(boxen(
        `${this.emojis.lock} ${this.colors.brain('NO ACTIVE LICENSES')} ${this.emojis.atom}\n\n` +
        `${this.colors.dim('Start your atomic transformation with premium features:')}\n` +
        `${this.colors.accent('→')} Run 'cortex license catalog' to browse features\n` +
        `${this.colors.accent('→')} Run 'cortex license trial <feature>' to start free trial`,
        { padding: 1, borderStyle: 'round', borderColor: '#D67441' }
      ))
      return
    }

    console.log(boxen(
      `${this.emojis.premium} ${this.colors.brain('ACTIVE LICENSES')} ${this.emojis.atom}`,
      { padding: 1, borderStyle: 'round', borderColor: '#FFD700' }
    ))

    for (const license of this.activeLicenses.values()) {
      const feature = this.premiumFeatures.get(license.product)
      const expiryDate = new Date(license.expiresAt)
      const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      const statusIcon = license.status === 'active' ? this.emojis.check :
                        license.status === 'trial' ? this.emojis.trial :
                        license.status === 'expired' ? this.emojis.cross : this.emojis.warning

      console.log(
        `\n  ${statusIcon} ${this.colors.highlight(feature?.name || license.product)}\n` +
        `    ${this.colors.dim('License:')} ${this.colors.primary(license.id)}\n` +
        `    ${this.colors.dim('Type:')} ${this.colors.premium(license.type)} | ` +
        `${this.colors.dim('Status:')} ${this.colors.success(license.status)} | ` +
        `${this.colors.dim('Expires:')} ${daysLeft > 0 ? this.colors.info(`${daysLeft} days`) : this.colors.error('Expired')}`
      )
    }

    console.log(`\n${this.colors.dim('Run')} ${this.colors.accent('cortex license status <license-id>')} ${this.colors.dim('for detailed information')}`)
  }
}