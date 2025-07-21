/**
 * Base Storage Adapter
 * Provides common functionality for all storage adapters
 */

import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'

// Common directory/prefix names
export const NOUNS_DIR = 'nouns'
export const VERBS_DIR = 'verbs'
export const METADATA_DIR = 'metadata'
export const INDEX_DIR = 'index'

/**
 * Base storage adapter that implements common functionality
 * This is an abstract class that should be extended by specific storage adapters
 */
export abstract class BaseStorage implements StorageAdapter {
  protected isInitialized = false

  /**
   * Initialize the storage adapter
   * This method should be implemented by each specific adapter
   */
  public abstract init(): Promise<void>

  /**
   * Ensure the storage adapter is initialized
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * Save a noun to storage
   */
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    await this.ensureInitialized()
    return this.saveNode(noun)
  }

  /**
   * Get a noun from storage
   */
  public async getNoun(id: string): Promise<HNSWNoun | null> {
    await this.ensureInitialized()
    return this.getNode(id)
  }

  /**
   * Get all nouns from storage
   */
  public async getAllNouns(): Promise<HNSWNoun[]> {
    await this.ensureInitialized()
    return this.getAllNodes()
  }

  /**
   * Get nouns by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nouns of the specified noun type
   */
  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    await this.ensureInitialized()
    return this.getNodesByNounType(nounType)
  }

  /**
   * Delete a noun from storage
   */
  public async deleteNoun(id: string): Promise<void> {
    await this.ensureInitialized()
    return this.deleteNode(id)
  }

  /**
   * Save a verb to storage
   */
  public async saveVerb(verb: GraphVerb): Promise<void> {
    await this.ensureInitialized()
    return this.saveEdge(verb)
  }

  /**
   * Get a verb from storage
   */
  public async getVerb(id: string): Promise<GraphVerb | null> {
    await this.ensureInitialized()
    return this.getEdge(id)
  }

  /**
   * Get all verbs from storage
   */
  public async getAllVerbs(): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getAllEdges()
  }

  /**
   * Get verbs by source
   */
  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getEdgesBySource(sourceId)
  }

  /**
   * Get verbs by target
   */
  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getEdgesByTarget(targetId)
  }

  /**
   * Get verbs by type
   */
  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    await this.ensureInitialized()
    return this.getEdgesByType(type)
  }

  /**
   * Delete a verb from storage
   */
  public async deleteVerb(id: string): Promise<void> {
    await this.ensureInitialized()
    return this.deleteEdge(id)
  }

  /**
   * Clear all data from storage
   * This method should be implemented by each specific adapter
   */
  public abstract clear(): Promise<void>

  /**
   * Get information about storage usage and capacity
   * This method should be implemented by each specific adapter
   */
  public abstract getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }>

  /**
   * Save metadata to storage
   * This method should be implemented by each specific adapter
   */
  public abstract saveMetadata(id: string, metadata: any): Promise<void>

  /**
   * Get metadata from storage
   * This method should be implemented by each specific adapter
   */
  public abstract getMetadata(id: string): Promise<any | null>

  /**
   * Save a node to storage
   * This method should be implemented by each specific adapter
   */
  protected abstract saveNode(node: HNSWNoun): Promise<void>

  /**
   * Get a node from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getNode(id: string): Promise<HNSWNoun | null>

  /**
   * Get all nodes from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getAllNodes(): Promise<HNSWNoun[]>

  /**
   * Get nodes by noun type
   * This method should be implemented by each specific adapter
   */
  protected abstract getNodesByNounType(nounType: string): Promise<HNSWNoun[]>

  /**
   * Delete a node from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract deleteNode(id: string): Promise<void>

  /**
   * Save an edge to storage
   * This method should be implemented by each specific adapter
   */
  protected abstract saveEdge(edge: GraphVerb): Promise<void>

  /**
   * Get an edge from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getEdge(id: string): Promise<GraphVerb | null>

  /**
   * Get all edges from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract getAllEdges(): Promise<GraphVerb[]>

  /**
   * Get edges by source
   * This method should be implemented by each specific adapter
   */
  protected abstract getEdgesBySource(sourceId: string): Promise<GraphVerb[]>

  /**
   * Get edges by target
   * This method should be implemented by each specific adapter
   */
  protected abstract getEdgesByTarget(targetId: string): Promise<GraphVerb[]>

  /**
   * Get edges by type
   * This method should be implemented by each specific adapter
   */
  protected abstract getEdgesByType(type: string): Promise<GraphVerb[]>

  /**
   * Delete an edge from storage
   * This method should be implemented by each specific adapter
   */
  protected abstract deleteEdge(id: string): Promise<void>

  /**
   * Helper method to convert a Map to a plain object for serialization
   */
  protected mapToObject<K extends string | number, V>(
    map: Map<K, V>,
    valueTransformer: (value: V) => any = (v) => v
  ): Record<string, any> {
    const obj: Record<string, any> = {}
    for (const [key, value] of map.entries()) {
      obj[key.toString()] = valueTransformer(value)
    }
    return obj
  }
}