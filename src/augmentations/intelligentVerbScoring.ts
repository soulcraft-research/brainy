import {
  AugmentationType,
  ICognitionAugmentation,
  AugmentationResponse
} from '../types/augmentations.js'
import { Vector, HNSWNoun } from '../coreTypes.js'
import { cosineDistance } from '../utils/distance.js'

/**
 * Configuration options for the Intelligent Verb Scoring augmentation
 */
export interface IVerbScoringConfig {
  /** Enable semantic proximity scoring based on entity embeddings */
  enableSemanticScoring: boolean
  /** Enable frequency-based weight amplification */
  enableFrequencyAmplification: boolean
  /** Enable temporal decay for weights */
  enableTemporalDecay: boolean
  /** Decay rate per day for temporal scoring (0-1) */
  temporalDecayRate: number
  /** Minimum weight threshold */
  minWeight: number
  /** Maximum weight threshold */
  maxWeight: number
  /** Base confidence score for new relationships */
  baseConfidence: number
  /** Learning rate for adaptive scoring (0-1) */
  learningRate: number
}

/**
 * Default configuration for the Intelligent Verb Scoring augmentation
 */
export const DEFAULT_VERB_SCORING_CONFIG: IVerbScoringConfig = {
  enableSemanticScoring: true,
  enableFrequencyAmplification: true,
  enableTemporalDecay: true,
  temporalDecayRate: 0.01, // 1% decay per day
  minWeight: 0.1,
  maxWeight: 1.0,
  baseConfidence: 0.5,
  learningRate: 0.1
}

/**
 * Relationship statistics for learning and adaptation
 */
interface RelationshipStats {
  count: number
  totalWeight: number
  averageWeight: number
  lastSeen: Date
  firstSeen: Date
  semanticSimilarity?: number
}

/**
 * Intelligent Verb Scoring Cognition Augmentation
 * 
 * Automatically generates intelligent weight and confidence scores for verb relationships
 * using semantic analysis, frequency patterns, and temporal factors.
 */
export class IntelligentVerbScoring implements ICognitionAugmentation {
  readonly name = 'intelligent-verb-scoring'
  readonly description = 'Automatically generates intelligent weight and confidence scores for verb relationships'
  enabled = false // Off by default as requested

  private config: IVerbScoringConfig
  private relationshipStats: Map<string, RelationshipStats> = new Map()
  private brainyInstance: any // Reference to the BrainyData instance
  private isInitialized = false

  constructor(config: Partial<IVerbScoringConfig> = {}) {
    this.config = { ...DEFAULT_VERB_SCORING_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  async shutDown(): Promise<void> {
    this.relationshipStats.clear()
    this.isInitialized = false
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.enabled && this.isInitialized ? 'active' : 'inactive'
  }

  /**
   * Set reference to the BrainyData instance for accessing graph data
   */
  setBrainyInstance(instance: any): void {
    this.brainyInstance = instance
  }

  /**
   * Main reasoning method for generating intelligent verb scores
   */
  reason(
    query: string,
    context?: Record<string, unknown>
  ): AugmentationResponse<{ inference: string; confidence: number }> {
    if (!this.enabled) {
      return {
        success: false,
        data: { inference: 'Augmentation is disabled', confidence: 0 },
        error: 'Intelligent verb scoring is disabled'
      }
    }

    return {
      success: true,
      data: {
        inference: 'Intelligent verb scoring active',
        confidence: 1.0
      }
    }
  }

  infer(dataSubset: Record<string, unknown>): AugmentationResponse<Record<string, unknown>> {
    return {
      success: true,
      data: dataSubset
    }
  }

  executeLogic(ruleId: string, input: Record<string, unknown>): AugmentationResponse<boolean> {
    return {
      success: true,
      data: true
    }
  }

  /**
   * Generate intelligent weight and confidence scores for a verb relationship
   * 
   * @param sourceId - ID of the source entity
   * @param targetId - ID of the target entity  
   * @param verbType - Type of the relationship
   * @param existingWeight - Existing weight if any
   * @param metadata - Additional metadata about the relationship
   * @returns Computed weight and confidence scores
   */
  async computeVerbScores(
    sourceId: string,
    targetId: string,
    verbType: string,
    existingWeight?: number,
    metadata?: any
  ): Promise<{ weight: number; confidence: number; reasoning: string[] }> {
    if (!this.enabled || !this.brainyInstance) {
      return {
        weight: existingWeight ?? 0.5,
        confidence: this.config.baseConfidence,
        reasoning: ['Intelligent scoring disabled']
      }
    }

    const reasoning: string[] = []
    let weight = existingWeight ?? 0.5
    let confidence = this.config.baseConfidence

    try {
      // Get relationship key for statistics
      const relationKey = `${sourceId}-${verbType}-${targetId}`
      
      // Update relationship statistics
      this.updateRelationshipStats(relationKey, weight, metadata)
      
      // Apply semantic scoring if enabled
      if (this.config.enableSemanticScoring) {
        const semanticScore = await this.calculateSemanticScore(sourceId, targetId)
        if (semanticScore !== null) {
          weight = this.blendScores(weight, semanticScore, 0.3)
          confidence = Math.min(confidence + semanticScore * 0.2, 1.0)
          reasoning.push(`Semantic similarity: ${semanticScore.toFixed(3)}`)
        }
      }

      // Apply frequency amplification if enabled
      if (this.config.enableFrequencyAmplification) {
        const frequencyBoost = this.calculateFrequencyBoost(relationKey)
        weight = this.blendScores(weight, frequencyBoost, 0.2)
        if (frequencyBoost > 0.5) {
          confidence = Math.min(confidence + 0.1, 1.0)
          reasoning.push(`Frequency boost: ${frequencyBoost.toFixed(3)}`)
        }
      }

      // Apply temporal decay if enabled
      if (this.config.enableTemporalDecay) {
        const temporalFactor = this.calculateTemporalFactor(relationKey)
        weight *= temporalFactor
        reasoning.push(`Temporal factor: ${temporalFactor.toFixed(3)}`)
      }

      // Apply learning adjustments
      const learningAdjustment = this.calculateLearningAdjustment(relationKey)
      weight = this.blendScores(weight, learningAdjustment, this.config.learningRate)

      // Clamp values to configured bounds
      weight = Math.max(this.config.minWeight, Math.min(this.config.maxWeight, weight))
      confidence = Math.max(0, Math.min(1, confidence))

      reasoning.push(`Final weight: ${weight.toFixed(3)}, confidence: ${confidence.toFixed(3)}`)

      return { weight, confidence, reasoning }
    } catch (error) {
      console.warn('Error computing verb scores:', error)
      return {
        weight: existingWeight ?? 0.5,
        confidence: this.config.baseConfidence,
        reasoning: [`Error in scoring: ${error}`]
      }
    }
  }

  /**
   * Calculate semantic similarity between two entities using their embeddings
   */
  private async calculateSemanticScore(sourceId: string, targetId: string): Promise<number | null> {
    try {
      if (!this.brainyInstance?.storage) return null

      // Get noun embeddings from storage
      const sourceNoun = await this.brainyInstance.storage.getNoun(sourceId)
      const targetNoun = await this.brainyInstance.storage.getNoun(targetId)

      if (!sourceNoun?.vector || !targetNoun?.vector) return null

      // Calculate cosine similarity (1 - distance)
      const distance = cosineDistance(sourceNoun.vector, targetNoun.vector)
      return Math.max(0, 1 - distance)
    } catch (error) {
      console.warn('Error calculating semantic score:', error)
      return null
    }
  }

  /**
   * Calculate frequency-based boost for repeated relationships
   */
  private calculateFrequencyBoost(relationKey: string): number {
    const stats = this.relationshipStats.get(relationKey)
    if (!stats || stats.count <= 1) return 0.5

    // Logarithmic scaling: more occurrences = higher weight, but with diminishing returns
    const boost = Math.log(stats.count + 1) / Math.log(10) // Log base 10
    return Math.min(boost, 1.0)
  }

  /**
   * Calculate temporal decay factor based on recency
   */
  private calculateTemporalFactor(relationKey: string): number {
    const stats = this.relationshipStats.get(relationKey)
    if (!stats) return 1.0

    const daysSinceLastSeen = (Date.now() - stats.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-this.config.temporalDecayRate * daysSinceLastSeen)
    
    return Math.max(0.1, decayFactor) // Minimum 10% of original weight
  }

  /**
   * Calculate learning-based adjustment using historical patterns
   */
  private calculateLearningAdjustment(relationKey: string): number {
    const stats = this.relationshipStats.get(relationKey)
    if (!stats || stats.count <= 1) return 0.5

    // Use moving average of weights as learned baseline
    return Math.max(0, Math.min(1, stats.averageWeight))
  }

  /**
   * Update relationship statistics for learning
   */
  private updateRelationshipStats(relationKey: string, weight: number, metadata?: any): void {
    const now = new Date()
    const existing = this.relationshipStats.get(relationKey)

    if (existing) {
      // Update existing stats
      existing.count++
      existing.totalWeight += weight
      existing.averageWeight = existing.totalWeight / existing.count
      existing.lastSeen = now
    } else {
      // Create new stats entry
      this.relationshipStats.set(relationKey, {
        count: 1,
        totalWeight: weight,
        averageWeight: weight,
        lastSeen: now,
        firstSeen: now
      })
    }
  }

  /**
   * Blend two scores using a weighted average
   */
  private blendScores(score1: number, score2: number, weight2: number): number {
    const weight1 = 1 - weight2
    return score1 * weight1 + score2 * weight2
  }

  /**
   * Get current configuration
   */
  getConfig(): IVerbScoringConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IVerbScoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get relationship statistics (for debugging/monitoring)
   */
  getRelationshipStats(): Map<string, RelationshipStats> {
    return new Map(this.relationshipStats)
  }

  /**
   * Clear relationship statistics
   */
  clearStats(): void {
    this.relationshipStats.clear()
  }

  /**
   * Provide feedback to improve future scoring
   * This allows the system to learn from user corrections or validation
   * 
   * @param sourceId - Source entity ID
   * @param targetId - Target entity ID  
   * @param verbType - Relationship type
   * @param feedbackWeight - The corrected/validated weight (0-1)
   * @param feedbackConfidence - The corrected/validated confidence (0-1)
   * @param feedbackType - Type of feedback ('correction', 'validation', 'enhancement')
   */
  async provideFeedback(
    sourceId: string,
    targetId: string,
    verbType: string,
    feedbackWeight: number,
    feedbackConfidence?: number,
    feedbackType: 'correction' | 'validation' | 'enhancement' = 'correction'
  ): Promise<void> {
    if (!this.enabled) return

    const relationKey = `${sourceId}-${verbType}-${targetId}`
    const existing = this.relationshipStats.get(relationKey)

    if (existing) {
      // Apply feedback with learning rate
      const newWeight = existing.averageWeight * (1 - this.config.learningRate) + 
                       feedbackWeight * this.config.learningRate

      // Update the running average with feedback
      existing.totalWeight = (existing.totalWeight * existing.count + feedbackWeight) / (existing.count + 1)
      existing.averageWeight = existing.totalWeight / existing.count
      existing.count += 1
      existing.lastSeen = new Date()

      if (this.brainyInstance?.loggingConfig?.verbose) {
        console.log(
          `Feedback applied for ${relationKey}: ${feedbackType}, ` +
          `old weight: ${existing.averageWeight.toFixed(3)}, ` +
          `feedback: ${feedbackWeight.toFixed(3)}, ` +
          `new weight: ${newWeight.toFixed(3)}`
        )
      }
    } else {
      // Create new entry with feedback as initial data
      this.relationshipStats.set(relationKey, {
        count: 1,
        totalWeight: feedbackWeight,
        averageWeight: feedbackWeight,
        lastSeen: new Date(),
        firstSeen: new Date()
      })
    }
  }

  /**
   * Get learning statistics for monitoring and debugging
   */
  getLearningStats(): {
    totalRelationships: number
    averageConfidence: number
    feedbackCount: number
    topRelationships: Array<{
      relationship: string
      count: number
      averageWeight: number
    }>
  } {
    const relationships = Array.from(this.relationshipStats.entries())
    const totalRelationships = relationships.length
    const feedbackCount = relationships.reduce((sum, [, stats]) => sum + stats.count, 0)
    
    // Calculate average confidence (approximated from weight patterns)
    const averageWeight = relationships.reduce((sum, [, stats]) => sum + stats.averageWeight, 0) / totalRelationships || 0
    const averageConfidence = Math.min(averageWeight + 0.2, 1.0) // Heuristic: confidence typically higher than weight

    // Get top relationships by count
    const topRelationships = relationships
      .map(([key, stats]) => ({
        relationship: key,
        count: stats.count,
        averageWeight: stats.averageWeight
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalRelationships,
      averageConfidence,
      feedbackCount,
      topRelationships
    }
  }

  /**
   * Export learning data for backup or analysis
   */
  exportLearningData(): string {
    const data = {
      config: this.config,
      stats: Array.from(this.relationshipStats.entries()).map(([key, stats]) => ({
        relationship: key,
        ...stats,
        firstSeen: stats.firstSeen.toISOString(),
        lastSeen: stats.lastSeen.toISOString()
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import learning data from backup
   */
  importLearningData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.version !== '1.0') {
        console.warn('Learning data version mismatch, importing anyway')
      }

      // Update configuration if provided
      if (data.config) {
        this.config = { ...this.config, ...data.config }
      }

      // Import relationship statistics
      if (data.stats && Array.isArray(data.stats)) {
        for (const stat of data.stats) {
          if (stat.relationship) {
            this.relationshipStats.set(stat.relationship, {
              count: stat.count || 1,
              totalWeight: stat.totalWeight || stat.averageWeight || 0.5,
              averageWeight: stat.averageWeight || 0.5,
              firstSeen: new Date(stat.firstSeen || Date.now()),
              lastSeen: new Date(stat.lastSeen || Date.now()),
              semanticSimilarity: stat.semanticSimilarity
            })
          }
        }
      }

      console.log(`Imported learning data: ${this.relationshipStats.size} relationships`)
    } catch (error) {
      console.error('Failed to import learning data:', error)
      throw new Error(`Failed to import learning data: ${error}`)
    }
  }
}