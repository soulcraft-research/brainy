/**
 * Metadata Index System
 * Maintains inverted indexes for fast metadata filtering
 * Automatically updates indexes when data changes
 */

import { StorageAdapter } from '../coreTypes.js'

export interface MetadataIndexEntry {
  field: string
  value: string | number | boolean
  ids: Set<string>
  lastUpdated: number
}

export interface MetadataIndexStats {
  totalEntries: number
  totalIds: number
  fieldsIndexed: string[]
  lastRebuild: number
  indexSize: number // in bytes
}

export interface MetadataIndexConfig {
  maxIndexSize?: number // Max number of entries per field value (default: 10000)
  rebuildThreshold?: number // Rebuild if index is this % stale (default: 0.1)
  autoOptimize?: boolean // Auto-cleanup unused entries (default: true)
  indexedFields?: string[] // Only index these fields (default: all)
  excludeFields?: string[] // Never index these fields
}

/**
 * Manages metadata indexes for fast filtering
 * Maintains inverted indexes: field+value -> list of IDs
 */
export class MetadataIndexManager {
  private storage: StorageAdapter
  private config: Required<MetadataIndexConfig>
  private indexCache = new Map<string, MetadataIndexEntry>()
  private dirtyEntries = new Set<string>()
  private isRebuilding = false

  constructor(storage: StorageAdapter, config: MetadataIndexConfig = {}) {
    this.storage = storage
    this.config = {
      maxIndexSize: config.maxIndexSize ?? 10000,
      rebuildThreshold: config.rebuildThreshold ?? 0.1,
      autoOptimize: config.autoOptimize ?? true,
      indexedFields: config.indexedFields ?? [],
      excludeFields: config.excludeFields ?? ['id', 'createdAt', 'updatedAt', 'embedding', 'vector', 'embeddings', 'vectors']
    }
  }

  /**
   * Get index key for field and value
   */
  private getIndexKey(field: string, value: any): string {
    const normalizedValue = this.normalizeValue(value)
    return `${field}:${normalizedValue}`
  }

  /**
   * Generate field index filename for filter discovery
   */
  private getFieldIndexFilename(field: string): string {
    return `field_${field}`
  }

  /**
   * Generate value chunk filename for scalable storage
   */
  private getValueChunkFilename(field: string, value: any, chunkIndex: number = 0): string {
    const normalizedValue = this.normalizeValue(value)
    const safeValue = this.makeSafeFilename(normalizedValue)
    return `${field}_${safeValue}_chunk${chunkIndex}`
  }

  /**
   * Make a value safe for use in filenames
   */
  private makeSafeFilename(value: string): string {
    // Replace unsafe characters and limit length
    return value
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50)
      .toLowerCase()
  }

  /**
   * Normalize value for consistent indexing
   */
  private normalizeValue(value: any): string {
    if (value === null || value === undefined) return '__NULL__'
    if (typeof value === 'boolean') return value ? '__TRUE__' : '__FALSE__'
    if (typeof value === 'number') return value.toString()
    if (Array.isArray(value)) {
      const joined = value.map(v => this.normalizeValue(v)).join(',')
      // Hash very long array values to avoid filesystem limits
      if (joined.length > 100) {
        return this.hashValue(joined)
      }
      return joined
    }
    const stringValue = String(value).toLowerCase().trim()
    // Hash very long string values to avoid filesystem limits
    if (stringValue.length > 100) {
      return this.hashValue(stringValue)
    }
    return stringValue
  }

  /**
   * Create a short hash for long values to avoid filesystem filename limits
   */
  private hashValue(value: string): string {
    // Simple hash function to create shorter keys
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `__HASH_${Math.abs(hash).toString(36)}`
  }

  /**
   * Check if field should be indexed
   */
  private shouldIndexField(field: string): boolean {
    if (this.config.excludeFields.includes(field)) return false
    if (this.config.indexedFields.length > 0) {
      return this.config.indexedFields.includes(field)
    }
    return true
  }

  /**
   * Extract indexable field-value pairs from metadata
   */
  private extractIndexableFields(metadata: any): Array<{ field: string, value: any }> {
    const fields: Array<{ field: string, value: any }> = []
    
    const extract = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (!this.shouldIndexField(fullKey)) continue
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recurse into nested objects
          extract(value, fullKey)
        } else {
          // Index this field
          fields.push({ field: fullKey, value })
          
          // If it's an array, also index each element
          if (Array.isArray(value)) {
            for (const item of value) {
              fields.push({ field: fullKey, value: item })
            }
          }
        }
      }
    }
    
    if (metadata && typeof metadata === 'object') {
      extract(metadata)
    }
    
    return fields
  }

  /**
   * Add item to metadata indexes
   */
  async addToIndex(id: string, metadata: any): Promise<void> {
    const fields = this.extractIndexableFields(metadata)
    
    for (const { field, value } of fields) {
      const key = this.getIndexKey(field, value)
      
      // Get or create index entry
      let entry = this.indexCache.get(key)
      if (!entry) {
        const loadedEntry = await this.loadIndexEntry(key)
        entry = loadedEntry ?? {
          field,
          value: this.normalizeValue(value),
          ids: new Set<string>(),
          lastUpdated: Date.now()
        }
        this.indexCache.set(key, entry)
      }
      
      // Add ID to entry
      entry.ids.add(id)
      entry.lastUpdated = Date.now()
      this.dirtyEntries.add(key)
    }
  }

  /**
   * Remove item from metadata indexes
   */
  async removeFromIndex(id: string, metadata?: any): Promise<void> {
    if (metadata) {
      // Remove from specific field indexes
      const fields = this.extractIndexableFields(metadata)
      
      for (const { field, value } of fields) {
        const key = this.getIndexKey(field, value)
        let entry = this.indexCache.get(key)
        if (!entry) {
          const loadedEntry = await this.loadIndexEntry(key)
          entry = loadedEntry ?? undefined
        }
        
        if (entry) {
          entry.ids.delete(id)
          entry.lastUpdated = Date.now()
          this.dirtyEntries.add(key)
          
          // If no IDs left, mark for cleanup
          if (entry.ids.size === 0) {
            this.indexCache.delete(key)
            await this.deleteIndexEntry(key)
          }
        }
      }
    } else {
      // Remove from all indexes (slower, requires scanning)
      for (const [key, entry] of this.indexCache.entries()) {
        if (entry.ids.has(id)) {
          entry.ids.delete(id)
          entry.lastUpdated = Date.now()
          this.dirtyEntries.add(key)
          
          if (entry.ids.size === 0) {
            this.indexCache.delete(key)
            await this.deleteIndexEntry(key)
          }
        }
      }
    }
  }

  /**
   * Get IDs for a specific field-value combination
   */
  async getIds(field: string, value: any): Promise<string[]> {
    const key = this.getIndexKey(field, value)
    
    // Try cache first
    let entry = this.indexCache.get(key)
    
    // Load from storage if not cached
    if (!entry) {
      const loadedEntry = await this.loadIndexEntry(key)
      if (loadedEntry) {
        entry = loadedEntry
        this.indexCache.set(key, entry)
      }
    }
    
    return entry ? Array.from(entry.ids) : []
  }

  /**
   * Convert MongoDB-style filter to simple field-value criteria for indexing
   */
  private convertFilterToCriteria(filter: any): Array<{ field: string, values: any[] }> {
    const criteria: Array<{ field: string, values: any[] }> = []
    
    if (!filter || typeof filter !== 'object') {
      return criteria
    }
    
    for (const [key, value] of Object.entries(filter)) {
      // Skip logical operators for now - handle them separately
      if (key.startsWith('$')) continue
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Handle MongoDB operators
        for (const [op, operand] of Object.entries(value)) {
          switch (op) {
            case '$in':
              if (Array.isArray(operand)) {
                criteria.push({ field: key, values: operand })
              }
              break
            case '$eq':
              criteria.push({ field: key, values: [operand] })
              break
            // For other operators, we can't use index efficiently, skip for now
            default:
              break
          }
        }
      } else {
        // Direct value or array
        const values = Array.isArray(value) ? value : [value]
        criteria.push({ field: key, values })
      }
    }
    
    return criteria
  }

  /**
   * Get IDs matching MongoDB-style metadata filter using indexes where possible
   */
  async getIdsForFilter(filter: any): Promise<string[]> {
    if (!filter || Object.keys(filter).length === 0) {
      return []
    }
    
    // Handle logical operators
    if (filter.$and && Array.isArray(filter.$and)) {
      // For $and, we need intersection of all sub-filters
      const allIds: string[][] = []
      for (const subFilter of filter.$and) {
        const subIds = await this.getIdsForFilter(subFilter)
        allIds.push(subIds)
      }
      
      if (allIds.length === 0) return []
      if (allIds.length === 1) return allIds[0]
      
      // Intersection of all sets
      return allIds.reduce((intersection, currentSet) => 
        intersection.filter(id => currentSet.includes(id))
      )
    }
    
    if (filter.$or && Array.isArray(filter.$or)) {
      // For $or, we need union of all sub-filters
      const unionIds = new Set<string>()
      for (const subFilter of filter.$or) {
        const subIds = await this.getIdsForFilter(subFilter)
        subIds.forEach(id => unionIds.add(id))
      }
      return Array.from(unionIds)
    }
    
    // Handle regular field filters
    const criteria = this.convertFilterToCriteria(filter)
    const idSets: string[][] = []
    
    for (const { field, values } of criteria) {
      const unionIds = new Set<string>()
      for (const value of values) {
        const ids = await this.getIds(field, value)
        ids.forEach(id => unionIds.add(id))
      }
      idSets.push(Array.from(unionIds))
    }
    
    if (idSets.length === 0) return []
    if (idSets.length === 1) return idSets[0]
    
    // Intersection of all field criteria (implicit $and)
    return idSets.reduce((intersection, currentSet) => 
      intersection.filter(id => currentSet.includes(id))
    )
  }

  /**
   * Get IDs matching multiple criteria (intersection) - LEGACY METHOD
   * @deprecated Use getIdsForFilter instead
   */
  async getIdsForCriteria(criteria: Record<string, any>): Promise<string[]> {
    return this.getIdsForFilter(criteria)
  }

  /**
   * Flush dirty entries to storage
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []
    
    for (const key of this.dirtyEntries) {
      const entry = this.indexCache.get(key)
      if (entry) {
        promises.push(this.saveIndexEntry(key, entry))
      }
    }
    
    await Promise.all(promises)
    this.dirtyEntries.clear()
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<MetadataIndexStats> {
    const fields = new Set<string>()
    let totalEntries = 0
    let totalIds = 0
    
    for (const entry of this.indexCache.values()) {
      fields.add(entry.field)
      totalEntries++
      totalIds += entry.ids.size
    }
    
    return {
      totalEntries,
      totalIds,
      fieldsIndexed: Array.from(fields),
      lastRebuild: 0, // TODO: track rebuild timestamp
      indexSize: totalEntries * 100 // rough estimate
    }
  }

  /**
   * Rebuild entire index from scratch
   */
  async rebuild(): Promise<void> {
    if (this.isRebuilding) return
    
    this.isRebuilding = true
    try {
      // Clear existing indexes
      this.indexCache.clear()
      this.dirtyEntries.clear()
      
      // Get all nouns and rebuild their metadata indexes
      const nouns = await this.storage.getAllNouns()
      
      for (const noun of nouns) {
        const metadata = await this.storage.getMetadata(noun.id)
        if (metadata) {
          await this.addToIndex(noun.id, metadata)
        }
      }
      
      // Get all verbs and rebuild their metadata indexes
      const verbs = await this.storage.getAllVerbs()
      
      for (const verb of verbs) {
        const metadata = await this.storage.getVerbMetadata(verb.id)
        if (metadata) {
          await this.addToIndex(verb.id, metadata)
        }
      }
      
      // Flush to storage
      await this.flush()
      
    } finally {
      this.isRebuilding = false
    }
  }

  /**
   * Load index entry from storage using safe filenames
   */
  private async loadIndexEntry(key: string): Promise<MetadataIndexEntry | null> {
    try {
      // Extract field and value from key
      const [field, value] = key.split(':', 2)
      const filename = this.getValueChunkFilename(field, value)
      
      // Load from metadata indexes directory with safe filename
      const indexId = `__metadata_index__${filename}`
      const data = await this.storage.getMetadata(indexId)
      if (data) {
        return {
          field: data.field,
          value: data.value,
          ids: new Set(data.ids || []),
          lastUpdated: data.lastUpdated || Date.now()
        }
      }
    } catch (error) {
      // Index entry doesn't exist yet
    }
    return null
  }

  /**
   * Save index entry to storage using safe filenames
   */
  private async saveIndexEntry(key: string, entry: MetadataIndexEntry): Promise<void> {
    const data = {
      field: entry.field,
      value: entry.value,
      ids: Array.from(entry.ids),
      lastUpdated: entry.lastUpdated
    }
    
    // Extract field and value from key for safe filename generation
    const [field, value] = key.split(':', 2)
    const filename = this.getValueChunkFilename(field, value)
    
    // Store metadata indexes with safe filename
    const indexId = `__metadata_index__${filename}`
    await this.storage.saveMetadata(indexId, data)
  }

  /**
   * Delete index entry from storage using safe filenames
   */
  private async deleteIndexEntry(key: string): Promise<void> {
    try {
      const [field, value] = key.split(':', 2)
      const filename = this.getValueChunkFilename(field, value)
      const indexId = `__metadata_index__${filename}`
      await this.storage.saveMetadata(indexId, null)
    } catch (error) {
      // Entry might not exist
    }
  }
}