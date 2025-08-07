/**
 * Metadata Index System
 * Maintains inverted indexes for fast metadata filtering
 * Automatically updates indexes when data changes
 */

import { StorageAdapter } from '../coreTypes.js'
import { MetadataIndexCache, MetadataIndexCacheConfig } from './metadataIndexCache.js'

export interface MetadataIndexEntry {
  field: string
  value: string | number | boolean
  ids: Set<string>
  lastUpdated: number
}

export interface FieldIndexData {
  // Maps value -> count for quick filter discovery
  values: Record<string, number>
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
  private metadataCache: MetadataIndexCache
  private fieldIndexes = new Map<string, FieldIndexData>()
  private dirtyFields = new Set<string>()
  private lastFlushTime = Date.now()
  private autoFlushThreshold = 10 // Start with 10 for more frequent non-blocking flushes

  constructor(storage: StorageAdapter, config: MetadataIndexConfig = {}) {
    this.storage = storage
    this.config = {
      maxIndexSize: config.maxIndexSize ?? 10000,
      rebuildThreshold: config.rebuildThreshold ?? 0.1,
      autoOptimize: config.autoOptimize ?? true,
      indexedFields: config.indexedFields ?? [],
      excludeFields: config.excludeFields ?? ['id', 'createdAt', 'updatedAt', 'embedding', 'vector', 'embeddings', 'vectors']
    }
    
    // Initialize metadata cache with similar config to search cache
    this.metadataCache = new MetadataIndexCache({
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxSize: 500,          // 500 entries (field indexes + value chunks)
      enabled: true
    })
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
  async addToIndex(id: string, metadata: any, skipFlush: boolean = false): Promise<void> {
    const fields = this.extractIndexableFields(metadata)
    
    for (let i = 0; i < fields.length; i++) {
      const { field, value } = fields[i]
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
      
      // Update field index
      await this.updateFieldIndex(field, value, 1)
      
      // Yield to event loop every 5 fields to prevent blocking
      if (i % 5 === 4) {
        await this.yieldToEventLoop()
      }
    }
    
    // Adaptive auto-flush based on usage patterns
    if (!skipFlush) {
      const timeSinceLastFlush = Date.now() - this.lastFlushTime
      const shouldAutoFlush = 
        this.dirtyEntries.size >= this.autoFlushThreshold || // Size threshold
        (this.dirtyEntries.size > 10 && timeSinceLastFlush > 5000) // Time threshold (5 seconds)
      
      if (shouldAutoFlush) {
        const startTime = Date.now()
        await this.flush()
        const flushTime = Date.now() - startTime
        
        // Adapt threshold based on flush performance
        if (flushTime < 50) {
          // Fast flush, can handle more entries
          this.autoFlushThreshold = Math.min(200, this.autoFlushThreshold * 1.2)
        } else if (flushTime > 200) {
          // Slow flush, reduce batch size
          this.autoFlushThreshold = Math.max(20, this.autoFlushThreshold * 0.8)
        }
        
        // Yield to event loop after flush to prevent blocking
        await this.yieldToEventLoop()
      }
    }
    
    // Invalidate cache for these fields
    for (const { field } of fields) {
      this.metadataCache.invalidatePattern(`field_values_${field}`)
    }
  }

  /**
   * Update field index with value count
   */
  private async updateFieldIndex(field: string, value: any, delta: number): Promise<void> {
    let fieldIndex = this.fieldIndexes.get(field)
    
    if (!fieldIndex) {
      // Load from storage if not in memory
      fieldIndex = await this.loadFieldIndex(field) ?? {
        values: {},
        lastUpdated: Date.now()
      }
      this.fieldIndexes.set(field, fieldIndex)
    }
    
    const normalizedValue = this.normalizeValue(value)
    fieldIndex.values[normalizedValue] = (fieldIndex.values[normalizedValue] || 0) + delta
    
    // Remove if count drops to 0
    if (fieldIndex.values[normalizedValue] <= 0) {
      delete fieldIndex.values[normalizedValue]
    }
    
    fieldIndex.lastUpdated = Date.now()
    this.dirtyFields.add(field)
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
          
          // Update field index
          await this.updateFieldIndex(field, value, -1)
          
          // If no IDs left, mark for cleanup
          if (entry.ids.size === 0) {
            this.indexCache.delete(key)
            await this.deleteIndexEntry(key)
          }
        }
        
        // Invalidate cache
        this.metadataCache.invalidatePattern(`field_values_${field}`)
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
   * Get IDs for a specific field-value combination with caching
   */
  async getIds(field: string, value: any): Promise<string[]> {
    const key = this.getIndexKey(field, value)
    
    // Check metadata cache first
    const cacheKey = `ids_${key}`
    const cachedIds = this.metadataCache.get(cacheKey)
    if (cachedIds) {
      return cachedIds
    }
    
    // Try in-memory cache
    let entry = this.indexCache.get(key)
    
    // Load from storage if not cached
    if (!entry) {
      const loadedEntry = await this.loadIndexEntry(key)
      if (loadedEntry) {
        entry = loadedEntry
        this.indexCache.set(key, entry)
      }
    }
    
    const ids = entry ? Array.from(entry.ids) : []
    
    // Cache the result
    this.metadataCache.set(cacheKey, ids)
    
    return ids
  }

  /**
   * Get all available values for a field (for filter discovery)
   */
  async getFilterValues(field: string): Promise<string[]> {
    // Check cache first
    const cacheKey = `field_values_${field}`
    const cachedValues = this.metadataCache.get(cacheKey)
    if (cachedValues) {
      return cachedValues
    }
    
    // Check in-memory field indexes first
    let fieldIndex = this.fieldIndexes.get(field)
    
    // If not in memory, load from storage
    if (!fieldIndex) {
      const loaded = await this.loadFieldIndex(field)
      if (loaded) {
        fieldIndex = loaded
        this.fieldIndexes.set(field, loaded)
      }
    }
    
    if (!fieldIndex) {
      return []
    }
    
    const values = Object.keys(fieldIndex.values)
    
    // Cache the result
    this.metadataCache.set(cacheKey, values)
    
    return values
  }

  /**
   * Get all indexed fields (for filter discovery)
   */
  async getFilterFields(): Promise<string[]> {
    // Check cache first
    const cacheKey = 'all_filter_fields'
    const cachedFields = this.metadataCache.get(cacheKey)
    if (cachedFields) {
      return cachedFields
    }
    
    // Get fields from in-memory indexes and storage
    const fields = new Set<string>(this.fieldIndexes.keys())
    
    // Also scan storage for persisted field indexes (in case not loaded)
    // This would require a new storage method to list field indexes
    // For now, just use in-memory fields
    
    const fieldsArray = Array.from(fields)
    
    // Cache the result
    this.metadataCache.set(cacheKey, fieldsArray)
    
    return fieldsArray
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
            case '$includes':
              // For $includes, the operand is the value we're looking for in an array field
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
   * Flush dirty entries to storage (non-blocking version)
   */
  async flush(): Promise<void> {
    if (this.dirtyEntries.size === 0 && this.dirtyFields.size === 0) {
      return // Nothing to flush
    }
    
    // Process in smaller batches to avoid blocking
    const BATCH_SIZE = 20
    const allPromises: Promise<void>[] = []
    
    // Flush value entries in batches
    const dirtyEntriesArray = Array.from(this.dirtyEntries)
    for (let i = 0; i < dirtyEntriesArray.length; i += BATCH_SIZE) {
      const batch = dirtyEntriesArray.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(key => {
        const entry = this.indexCache.get(key)
        return entry ? this.saveIndexEntry(key, entry) : Promise.resolve()
      })
      allPromises.push(...batchPromises)
      
      // Yield to event loop between batches
      if (i + BATCH_SIZE < dirtyEntriesArray.length) {
        await this.yieldToEventLoop()
      }
    }
    
    // Flush field indexes in batches  
    const dirtyFieldsArray = Array.from(this.dirtyFields)
    for (let i = 0; i < dirtyFieldsArray.length; i += BATCH_SIZE) {
      const batch = dirtyFieldsArray.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(field => {
        const fieldIndex = this.fieldIndexes.get(field)
        return fieldIndex ? this.saveFieldIndex(field, fieldIndex) : Promise.resolve()
      })
      allPromises.push(...batchPromises)
      
      // Yield to event loop between batches
      if (i + BATCH_SIZE < dirtyFieldsArray.length) {
        await this.yieldToEventLoop()
      }
    }
    
    // Wait for all operations to complete
    await Promise.all(allPromises)
    
    this.dirtyEntries.clear()
    this.dirtyFields.clear()
    this.lastFlushTime = Date.now()
  }
  
  /**
   * Yield control back to the Node.js event loop
   * Prevents blocking during long-running operations
   */
  private async yieldToEventLoop(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve))
  }

  /**
   * Load field index from storage
   */
  private async loadFieldIndex(field: string): Promise<FieldIndexData | null> {
    try {
      const filename = this.getFieldIndexFilename(field)
      const cacheKey = `field_index_${filename}`
      
      // Check cache first
      const cached = this.metadataCache.get(cacheKey)
      if (cached) {
        return cached
      }
      
      // Load from storage
      const indexId = `__metadata_field_index__${filename}`
      const data = await this.storage.getMetadata(indexId)
      
      if (data) {
        const fieldIndex = {
          values: data.values || {},
          lastUpdated: data.lastUpdated || Date.now()
        }
        
        // Cache it
        this.metadataCache.set(cacheKey, fieldIndex)
        
        return fieldIndex
      }
    } catch (error) {
      // Field index doesn't exist yet
    }
    return null
  }

  /**
   * Save field index to storage
   */
  private async saveFieldIndex(field: string, fieldIndex: FieldIndexData): Promise<void> {
    const filename = this.getFieldIndexFilename(field)
    const indexId = `__metadata_field_index__${filename}`
    
    await this.storage.saveMetadata(indexId, {
      values: fieldIndex.values,
      lastUpdated: fieldIndex.lastUpdated
    })
    
    // Invalidate cache
    this.metadataCache.invalidatePattern(`field_index_${filename}`)
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
   * Rebuild entire index from scratch using pagination
   * Non-blocking version that yields control back to event loop
   */
  async rebuild(): Promise<void> {
    if (this.isRebuilding) return
    
    this.isRebuilding = true
    try {
      console.log('🔄 Starting non-blocking metadata index rebuild...')
      
      // Clear existing indexes
      this.indexCache.clear()
      this.dirtyEntries.clear()
      this.fieldIndexes.clear()
      this.dirtyFields.clear()
      
      // Rebuild noun metadata indexes using pagination
      let nounOffset = 0
      const nounLimit = 50 // Smaller batches to reduce blocking
      let hasMoreNouns = true
      let totalNounsProcessed = 0
      
      while (hasMoreNouns) {
        const result = await this.storage.getNouns({
          pagination: { offset: nounOffset, limit: nounLimit }
        })
        
        // Process batch with event loop yields
        for (let i = 0; i < result.items.length; i++) {
          const noun = result.items[i]
          const metadata = await this.storage.getMetadata(noun.id)
          if (metadata) {
            // Skip flush during rebuild for performance
            await this.addToIndex(noun.id, metadata, true)
          }
          
          // Yield to event loop every 10 items to prevent blocking
          if (i % 10 === 9) {
            await this.yieldToEventLoop()
          }
        }
        
        totalNounsProcessed += result.items.length
        hasMoreNouns = result.hasMore
        nounOffset += nounLimit
        
        // Progress logging and event loop yield after each batch
        if (totalNounsProcessed % 100 === 0 || !hasMoreNouns) {
          console.log(`📊 Indexed ${totalNounsProcessed} nouns...`)
        }
        await this.yieldToEventLoop()
      }
      
      // Rebuild verb metadata indexes using pagination
      let verbOffset = 0
      const verbLimit = 50 // Smaller batches to reduce blocking
      let hasMoreVerbs = true
      let totalVerbsProcessed = 0
      
      while (hasMoreVerbs) {
        const result = await this.storage.getVerbs({
          pagination: { offset: verbOffset, limit: verbLimit }
        })
        
        // Process batch with event loop yields
        for (let i = 0; i < result.items.length; i++) {
          const verb = result.items[i]
          const metadata = await this.storage.getVerbMetadata(verb.id)
          if (metadata) {
            // Skip flush during rebuild for performance
            await this.addToIndex(verb.id, metadata, true)
          }
          
          // Yield to event loop every 10 items to prevent blocking
          if (i % 10 === 9) {
            await this.yieldToEventLoop()
          }
        }
        
        totalVerbsProcessed += result.items.length
        hasMoreVerbs = result.hasMore
        verbOffset += verbLimit
        
        // Progress logging and event loop yield after each batch
        if (totalVerbsProcessed % 100 === 0 || !hasMoreVerbs) {
          console.log(`🔗 Indexed ${totalVerbsProcessed} verbs...`)
        }
        await this.yieldToEventLoop()
      }
      
      // Flush to storage with final yield
      console.log('💾 Flushing metadata index to storage...')
      await this.flush()
      await this.yieldToEventLoop()
      
      console.log(`✅ Metadata index rebuild completed! Processed ${totalNounsProcessed} nouns and ${totalVerbsProcessed} verbs`)
      
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