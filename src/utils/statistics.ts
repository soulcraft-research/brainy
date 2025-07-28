/**
 * Utility functions for retrieving statistics from Brainy
 */

import { BrainyData } from '../brainyData.js'

/**
 * Get statistics about the current state of a BrainyData instance
 * This function provides access to statistics at the root level of the library
 * 
 * @param instance A BrainyData instance to get statistics from
 * @param options Additional options for retrieving statistics
 * @returns Object containing counts of nouns, verbs, metadata entries, and HNSW index size
 * @throws Error if the instance is not provided or if statistics retrieval fails
 */
export async function getStatistics(
    instance: BrainyData,
    options: {
        service?: string | string[] // Filter statistics by service(s)
    } = {}
): Promise<{
    nounCount: number
    verbCount: number
    metadataCount: number
    hnswIndexSize: number
    serviceBreakdown?: {
        [service: string]: {
            nounCount: number
            verbCount: number
            metadataCount: number
        }
    }
}> {
    if (!instance) {
        throw new Error('BrainyData instance must be provided to getStatistics')
    }
    
    try {
        return await instance.getStatistics(options)
    } catch (error) {
        console.error('Failed to get statistics:', error)
        throw new Error(`Failed to get statistics: ${error}`)
    }
}