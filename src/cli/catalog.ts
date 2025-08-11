/**
 * Brain Cloud Catalog Integration for CLI
 * 
 * Fetches and displays augmentation catalog
 * Falls back to local cache if API is unavailable
 */

import chalk from 'chalk'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CATALOG_API = process.env.BRAIN_CLOUD_CATALOG_URL || 'https://catalog.brain-cloud.soulcraft.com'
const CACHE_PATH = join(homedir(), '.brainy', 'catalog-cache.json')
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface Augmentation {
  id: string
  name: string
  description: string
  category: string
  status: 'available' | 'coming_soon' | 'deprecated'
  popular?: boolean
  eta?: string
}

interface Category {
  id: string
  name: string
  icon: string
  description: string
}

interface Catalog {
  version: string
  categories: Category[]
  augmentations: Augmentation[]
}

/**
 * Fetch catalog from API with caching
 */
export async function fetchCatalog(): Promise<Catalog | null> {
  try {
    // Check cache first
    const cached = loadCache()
    if (cached) return cached
    
    // Fetch from API
    const response = await fetch(`${CATALOG_API}/api/catalog/cli`)
    if (!response.ok) throw new Error('API unavailable')
    
    const catalog = await response.json()
    
    // Save to cache
    saveCache(catalog)
    
    return catalog
  } catch (error) {
    // Try loading from cache even if expired
    const cached = loadCache(true)
    if (cached) {
      console.log(chalk.yellow('📡 Using cached catalog (API unavailable)'))
      return cached
    }
    
    // Fall back to hardcoded catalog
    return getDefaultCatalog()
  }
}

/**
 * Display catalog in CLI
 */
export async function showCatalog(options: { 
  category?: string
  search?: string
  detailed?: boolean
}) {
  const catalog = await fetchCatalog()
  if (!catalog) {
    console.log(chalk.red('❌ Could not load augmentation catalog'))
    return
  }
  
  console.log(chalk.cyan.bold('🧠 Brain Cloud Augmentation Catalog'))
  console.log(chalk.gray(`Version ${catalog.version}`))
  console.log('')
  
  // Filter augmentations
  let augmentations = catalog.augmentations
  
  if (options.category) {
    augmentations = augmentations.filter(a => a.category === options.category)
  }
  
  if (options.search) {
    const query = options.search.toLowerCase()
    augmentations = augmentations.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    )
  }
  
  // Group by category
  const grouped = groupByCategory(augmentations, catalog.categories)
  
  // Display
  for (const [category, augs] of Object.entries(grouped)) {
    if (augs.length === 0) continue
    
    const cat = catalog.categories.find(c => c.id === category)
    console.log(chalk.bold(`${cat?.icon || '📦'} ${cat?.name || category}`))
    
    for (const aug of augs) {
      const status = getStatusIcon(aug.status)
      const popular = aug.popular ? chalk.yellow(' ⭐') : ''
      const eta = aug.eta ? chalk.gray(` (${aug.eta})`) : ''
      
      console.log(`  ${status} ${aug.name}${popular}${eta}`)
      if (options.detailed) {
        console.log(chalk.gray(`     ${aug.description}`))
      }
    }
    console.log('')
  }
  
  // Show summary
  const available = augmentations.filter(a => a.status === 'available').length
  const coming = augmentations.filter(a => a.status === 'coming_soon').length
  
  console.log(chalk.gray('─'.repeat(50)))
  console.log(chalk.green(`✅ ${available} available`) + chalk.gray(` • `) + 
              chalk.yellow(`🔜 ${coming} coming soon`))
  console.log('')
  console.log(chalk.dim('Sign up at app.soulcraft.com to activate'))
  console.log(chalk.dim('Run "brainy augment info <name>" for details'))
}

/**
 * Show detailed info about an augmentation
 */
export async function showAugmentationInfo(id: string) {
  const catalog = await fetchCatalog()
  if (!catalog) {
    console.log(chalk.red('❌ Could not load augmentation catalog'))
    return
  }
  
  const aug = catalog.augmentations.find(a => a.id === id)
  if (!aug) {
    console.log(chalk.red(`❌ Augmentation not found: ${id}`))
    console.log('')
    console.log('Available augmentations:')
    catalog.augmentations.forEach(a => {
      console.log(`  • ${a.id}`)
    })
    return
  }
  
  // Fetch full details from API
  try {
    const response = await fetch(`${CATALOG_API}/api/catalog/augmentation/${id}`)
    const details = await response.json()
    
    console.log(chalk.cyan.bold(`📦 ${details.name}`))
    if (details.popular) console.log(chalk.yellow('⭐ Popular'))
    console.log('')
    
    console.log(chalk.bold('Category:'), getCategoryName(details.category, catalog.categories))
    console.log(chalk.bold('Status:'), getStatusText(details.status))
    if (details.eta) console.log(chalk.bold('Expected:'), details.eta)
    console.log('')
    
    console.log(chalk.bold('Description:'))
    console.log(details.longDescription || details.description)
    console.log('')
    
    if (details.features) {
      console.log(chalk.bold('Features:'))
      details.features.forEach((f: string) => console.log(`  ✓ ${f}`))
      console.log('')
    }
    
    if (details.example) {
      console.log(chalk.bold('Example:'))
      console.log(chalk.gray('─'.repeat(50)))
      console.log(details.example.code)
      console.log(chalk.gray('─'.repeat(50)))
      console.log('')
    }
    
    if (details.requirements?.config) {
      console.log(chalk.bold('Required Configuration:'))
      details.requirements.config.forEach((c: string) => console.log(`  • ${c}`))
      console.log('')
    }
    
    if (details.pricing) {
      console.log(chalk.bold('Available in:'))
      details.pricing.tiers.forEach((t: string) => console.log(`  • ${t}`))
      console.log('')
    }
    
    console.log(chalk.dim('To activate: brainy augment activate'))
  } catch (error) {
    // Show basic info if API fails
    console.log(chalk.cyan.bold(`📦 ${aug.name}`))
    console.log(aug.description)
    console.log('')
    console.log(chalk.dim('Full details unavailable (API offline)'))
  }
}

/**
 * Show user's available augmentations
 */
export async function showAvailable(licenseKey?: string) {
  const key = licenseKey || process.env.BRAINY_LICENSE_KEY || readLicenseFile()
  
  if (!key) {
    console.log(chalk.yellow('⚠️  No license key found'))
    console.log('')
    console.log('To see your available augmentations:')
    console.log('  1. Sign up at app.soulcraft.com')
    console.log('  2. Run: brainy augment activate')
    return
  }
  
  try {
    const response = await fetch(`${CATALOG_API}/api/catalog/available`, {
      headers: { 'x-license-key': key }
    })
    
    if (!response.ok) {
      throw new Error('Invalid license')
    }
    
    const data = await response.json()
    
    console.log(chalk.cyan.bold('🧠 Your Available Augmentations'))
    console.log(chalk.gray(`Plan: ${data.plan}`))
    console.log('')
    
    const grouped = groupByCategory(data.augmentations, [])
    
    for (const [category, augs] of Object.entries(grouped)) {
      console.log(chalk.bold(category))
      augs.forEach(aug => {
        console.log(`  ✅ ${aug.name}`)
      })
      console.log('')
    }
    
    if (data.operations) {
      const used = data.operations.used || 0
      const limit = data.operations.limit
      const percent = limit === 'unlimited' ? 0 : Math.round((used / limit) * 100)
      
      console.log(chalk.bold('Usage:'))
      if (limit === 'unlimited') {
        console.log(`  Unlimited operations`)
      } else {
        console.log(`  ${used.toLocaleString()} / ${limit.toLocaleString()} operations (${percent}%)`)
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ Could not fetch available augmentations'))
    console.log(chalk.gray((error as Error).message))
  }
}

// Helper functions

function loadCache(ignoreExpiry = false): Catalog | null {
  try {
    if (!existsSync(CACHE_PATH)) return null
    
    const data = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
    
    if (!ignoreExpiry && Date.now() - data.timestamp > CACHE_TTL) {
      return null
    }
    
    return data.catalog
  } catch {
    return null
  }
}

function saveCache(catalog: Catalog): void {
  try {
    const dir = join(homedir(), '.brainy')
    if (!existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true })
    }
    
    writeFileSync(CACHE_PATH, JSON.stringify({
      catalog,
      timestamp: Date.now()
    }))
  } catch {
    // Ignore cache save errors
  }
}

function groupByCategory(augmentations: Augmentation[], categories: Category[]) {
  const grouped: Record<string, Augmentation[]> = {}
  
  for (const aug of augmentations) {
    if (!grouped[aug.category]) {
      grouped[aug.category] = []
    }
    grouped[aug.category].push(aug)
  }
  
  // Sort by category order
  const ordered: Record<string, Augmentation[]> = {}
  const categoryOrder = ['memory', 'coordination', 'enterprise', 'perception', 'dialog', 'activation', 'cognition', 'websocket']
  
  for (const cat of categoryOrder) {
    if (grouped[cat]) {
      ordered[cat] = grouped[cat]
    }
  }
  
  return ordered
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'available': return chalk.green('✅')
    case 'coming_soon': return chalk.yellow('🔜')
    case 'deprecated': return chalk.red('⚠️')
    default: return '❓'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'available': return chalk.green('Available')
    case 'coming_soon': return chalk.yellow('Coming Soon')
    case 'deprecated': return chalk.red('Deprecated')
    default: return 'Unknown'
  }
}

function getCategoryName(categoryId: string, categories: Category[]): string {
  const cat = categories.find(c => c.id === categoryId)
  return cat ? `${cat.icon} ${cat.name}` : categoryId
}

function readLicenseFile(): string | null {
  try {
    const licensePath = join(homedir(), '.brainy', 'license')
    if (existsSync(licensePath)) {
      return readFileSync(licensePath, 'utf8').trim()
    }
  } catch {}
  return null
}

function getDefaultCatalog(): Catalog {
  // Hardcoded fallback catalog
  return {
    version: '1.0.0',
    categories: [
      { id: 'memory', name: 'Memory', icon: '🧠', description: 'AI memory and persistence' },
      { id: 'coordination', name: 'Coordination', icon: '🤝', description: 'Multi-agent orchestration' },
      { id: 'enterprise', name: 'Enterprise', icon: '🏢', description: 'Business integrations' }
    ],
    augmentations: [
      {
        id: 'ai-memory',
        name: 'AI Memory',
        category: 'memory',
        description: 'Persistent memory across all AI sessions',
        status: 'available',
        popular: true
      },
      {
        id: 'agent-coordinator',
        name: 'Agent Coordinator',
        category: 'coordination',
        description: 'Multi-agent handoffs and orchestration',
        status: 'available',
        popular: true
      },
      {
        id: 'notion-sync',
        name: 'Notion Sync',
        category: 'enterprise',
        description: 'Bidirectional Notion database sync',
        status: 'available'
      }
    ]
  }
}