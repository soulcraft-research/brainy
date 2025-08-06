/**
 * Smart metadata filtering for vector search
 * Filters DURING search to ensure relevant results
 * Simple API that just works without configuration
 */

import { SearchResult, HNSWNoun } from '../coreTypes.js'

/**
 * MongoDB-style query operators
 */
export interface QueryOperators {
  $eq?: any
  $ne?: any
  $gt?: any
  $gte?: any
  $lt?: any
  $lte?: any
  $in?: any[]
  $nin?: any[]
  $exists?: boolean
  $regex?: string | RegExp
  $includes?: any
  $all?: any[]
  $size?: number
  $and?: MetadataFilter[]
  $or?: MetadataFilter[]
  $not?: MetadataFilter
}

/**
 * Metadata filter definition
 */
export interface MetadataFilter {
  [key: string]: any | QueryOperators
}

/**
 * Options for metadata filtering
 */
export interface MetadataFilterOptions {
  metadata?: MetadataFilter
  scoring?: {
    vectorWeight?: number
    metadataWeight?: number
    metadataBoosts?: Record<string, number | ((value: any, query: any) => number)>
  }
}

/**
 * Check if a value matches a query with operators
 */
function matchesQuery(value: any, query: any): boolean {
  // Direct equality check
  if (typeof query !== 'object' || query === null || Array.isArray(query)) {
    return value === query
  }

  // Check for MongoDB-style operators
  for (const [op, operand] of Object.entries(query)) {
    switch (op) {
      case '$eq':
        if (value !== operand) return false
        break
      case '$ne':
        if (value === operand) return false
        break
      case '$gt':
        if (typeof value !== 'number' || typeof operand !== 'number' || !(value > operand)) return false
        break
      case '$gte':
        if (typeof value !== 'number' || typeof operand !== 'number' || !(value >= operand)) return false
        break
      case '$lt':
        if (typeof value !== 'number' || typeof operand !== 'number' || !(value < operand)) return false
        break
      case '$lte':
        if (typeof value !== 'number' || typeof operand !== 'number' || !(value <= operand)) return false
        break
      case '$in':
        if (!Array.isArray(operand) || !operand.includes(value)) return false
        break
      case '$nin':
        if (!Array.isArray(operand) || operand.includes(value)) return false
        break
      case '$exists':
        if ((value !== undefined) !== operand) return false
        break
      case '$regex':
        const regex = typeof operand === 'string' ? new RegExp(operand) : operand as RegExp
        if (!(regex instanceof RegExp) || !regex.test(String(value))) return false
        break
      case '$includes':
        if (!Array.isArray(value) || !value.includes(operand)) return false
        break
      case '$all':
        if (!Array.isArray(value) || !Array.isArray(operand)) return false
        for (const item of operand) {
          if (!value.includes(item)) return false
        }
        break
      case '$size':
        if (!Array.isArray(value) || value.length !== operand) return false
        break
      default:
        // Unknown operator, treat as field name
        if (!matchesFieldQuery(value, op, operand)) return false
    }
  }

  return true
}

/**
 * Check if a field matches a query
 */
function matchesFieldQuery(obj: any, field: string, query: any): boolean {
  const value = getNestedValue(obj, field)
  return matchesQuery(value, query)
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Check if metadata matches the filter
 */
export function matchesMetadataFilter(metadata: any, filter: MetadataFilter): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return true
  }

  for (const [key, query] of Object.entries(filter)) {
    // Handle logical operators
    if (key === '$and') {
      if (!Array.isArray(query)) return false
      for (const subFilter of query) {
        if (!matchesMetadataFilter(metadata, subFilter)) return false
      }
      continue
    }

    if (key === '$or') {
      if (!Array.isArray(query)) return false
      let matched = false
      for (const subFilter of query) {
        if (matchesMetadataFilter(metadata, subFilter)) {
          matched = true
          break
        }
      }
      if (!matched) return false
      continue
    }

    if (key === '$not') {
      if (matchesMetadataFilter(metadata, query)) return false
      continue
    }

    // Handle field queries
    const value = getNestedValue(metadata, key)
    if (!matchesQuery(value, query)) {
      return false
    }
  }

  return true
}

/**
 * Calculate metadata boost score
 */
export function calculateMetadataScore(
  metadata: any,
  filter: MetadataFilter,
  scoring?: MetadataFilterOptions['scoring']
): number {
  if (!scoring || !scoring.metadataBoosts) {
    return 0
  }

  let score = 0

  for (const [field, boost] of Object.entries(scoring.metadataBoosts)) {
    const value = getNestedValue(metadata, field)
    
    if (typeof boost === 'function') {
      score += boost(value, filter)
    } else if (value !== undefined) {
      // Check if the field matches the filter
      const fieldFilter = filter[field]
      if (fieldFilter && matchesQuery(value, fieldFilter)) {
        score += boost
      }
    }
  }

  return score
}

/**
 * Apply compound scoring to search results
 */
export function applyCompoundScoring<T>(
  results: SearchResult<T>[],
  filter: MetadataFilter,
  scoring?: MetadataFilterOptions['scoring']
): SearchResult<T>[] {
  if (!scoring || (!scoring.vectorWeight && !scoring.metadataWeight)) {
    return results
  }

  const vectorWeight = scoring.vectorWeight ?? 1.0
  const metadataWeight = scoring.metadataWeight ?? 0.0

  return results.map(result => {
    const metadataScore = calculateMetadataScore(result.metadata, filter, scoring)
    const combinedScore = (result.score * vectorWeight) + (metadataScore * metadataWeight)
    
    return {
      ...result,
      score: combinedScore
    }
  }).sort((a, b) => b.score - a.score) // Re-sort by combined score
}

/**
 * Filter search results by metadata
 */
export function filterSearchResultsByMetadata<T>(
  results: SearchResult<T>[],
  filter: MetadataFilter
): SearchResult<T>[] {
  if (!filter || Object.keys(filter).length === 0) {
    return results
  }

  return results.filter(result => 
    matchesMetadataFilter(result.metadata, filter)
  )
}

/**
 * Filter nouns by metadata before search
 */
export function filterNounsByMetadata(
  nouns: HNSWNoun[],
  filter: MetadataFilter
): HNSWNoun[] {
  if (!filter || Object.keys(filter).length === 0) {
    return nouns
  }

  return nouns.filter(noun => 
    matchesMetadataFilter(noun.metadata, filter)
  )
}

/**
 * Aggregate search results for faceted search
 */
export interface FacetConfig {
  field: string
  limit?: number
}

export interface FacetResult {
  [value: string]: number
}

export interface AggregationResult<T> {
  results: SearchResult<T>[]
  facets: Record<string, FacetResult>
}

export function aggregateSearchResults<T>(
  results: SearchResult<T>[],
  facets: Record<string, FacetConfig>
): AggregationResult<T> {
  const facetResults: Record<string, FacetResult> = {}

  for (const [facetName, config] of Object.entries(facets)) {
    const counts: Record<string, number> = {}

    for (const result of results) {
      const value = getNestedValue(result.metadata, config.field)
      
      if (value !== undefined) {
        const key = String(value)
        counts[key] = (counts[key] || 0) + 1
      }
    }

    // Sort by count and apply limit
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, config.limit || 10)

    facetResults[facetName] = Object.fromEntries(sorted)
  }

  return {
    results,
    facets: facetResults
  }
}