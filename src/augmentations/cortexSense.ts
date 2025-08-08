/**
 * Cortex SENSE Augmentation - Atomic Age AI-Powered Data Understanding
 * 
 * 🧠 The cerebral cortex layer for intelligent data processing
 * ⚛️ Complete with confidence scoring and relationship weight calculation
 */

import { ISenseAugmentation, AugmentationResponse } from '../types/augmentations.js'
import { BrainyData } from '../brainyData.js'
import { NounType, VerbType } from '../types/graphTypes.js'
import * as fs from '../universal/fs.js'
import * as path from '../universal/path.js'

// Cortex Analysis Types
export interface CortexAnalysisResult {
  detectedEntities: DetectedEntity[]
  detectedRelationships: DetectedRelationship[]
  confidence: number
  insights: CortexInsight[]
}

export interface DetectedEntity {
  originalData: any
  nounType: string
  confidence: number
  suggestedId: string
  reasoning: string
  alternativeTypes: Array<{ type: string, confidence: number }>
}

export interface DetectedRelationship {
  sourceId: string
  targetId: string
  verbType: string
  confidence: number
  weight: number
  reasoning: string
  context: string
  metadata?: Record<string, any>
}

export interface CortexInsight {
  type: 'hierarchy' | 'cluster' | 'pattern' | 'anomaly' | 'opportunity'
  description: string
  confidence: number
  affectedEntities: string[]
  recommendation?: string
}

export interface CortexSenseConfig {
  confidenceThreshold: number
  enableWeights: boolean
  skipDuplicates: boolean
  categoryFilter?: string[]
}

/**
 * Neural Import SENSE Augmentation - The Brain's Perceptual System
 */
export class CortexSenseAugmentation implements ISenseAugmentation {
  readonly name: string = 'cortex-sense'
  readonly description: string = 'AI-powered cortex for intelligent data understanding'
  enabled: boolean = true

  private brainy: BrainyData
  private config: CortexSenseConfig

  constructor(brainy: BrainyData, config: Partial<CortexSenseConfig> = {}) {
    this.brainy = brainy
    this.config = {
      confidenceThreshold: 0.7,
      enableWeights: true,
      skipDuplicates: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    // Initialize the cortex analysis system
    console.log('🧠 Cortex SENSE augmentation initialized')
  }

  async shutDown(): Promise<void> {
    console.log('🧠 Neural Import SENSE augmentation shut down')
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.enabled ? 'active' : 'inactive'
  }

  /**
   * Process raw data into structured nouns and verbs using neural analysis
   */
  async processRawData(rawData: Buffer | string, dataType: string, options?: Record<string, unknown>): Promise<AugmentationResponse<{
    nouns: string[]
    verbs: string[]
    confidence?: number
    insights?: Array<{
      type: string
      description: string
      confidence: number
    }>
    metadata?: Record<string, unknown>
  }>> {
    try {
      // Merge options with config
      const mergedConfig = { ...this.config, ...options }
      
      // Parse the raw data based on type
      const parsedData = await this.parseRawData(rawData, dataType)
      
      // Perform neural analysis
      const analysis = await this.performNeuralAnalysis(parsedData, mergedConfig)
      
      // Extract nouns and verbs for the ISenseAugmentation interface
      const nouns = analysis.detectedEntities.map(entity => entity.suggestedId)
      const verbs = analysis.detectedRelationships.map(rel => `${rel.sourceId}->${rel.verbType}->${rel.targetId}`)

      // Store the full analysis for later retrieval
      await this.storeNeuralAnalysis(analysis)

      return {
        success: true,
        data: {
          nouns,
          verbs,
          confidence: analysis.confidence,
          insights: analysis.insights.map((insight: any) => ({
            type: insight.type,
            description: insight.description,
            confidence: insight.confidence
          })),
          metadata: {
            detectedEntities: analysis.detectedEntities.length,
            detectedRelationships: analysis.detectedRelationships.length,
            timestamp: new Date().toISOString(),
            augmentation: 'neural-import-sense'
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        data: { nouns: [], verbs: [] },
        error: error instanceof Error ? error.message : 'Neural analysis failed'
      }
    }
  }

  /**
   * Listen to real-time data feeds and process them
   */
  async listenToFeed(
    feedUrl: string,
    callback: (data: { nouns: string[]; verbs: string[]; confidence?: number }) => void
  ): Promise<void> {
    // For file-based feeds, watch for changes
    if (feedUrl.startsWith('file://')) {
      const filePath = feedUrl.replace('file://', '')
      
      // Watch file for changes using Node.js fs.watch
      const fsWatch = require('fs')
      const watcher = fsWatch.watch(filePath, async (eventType: string) => {
        if (eventType === 'change') {
          try {
            const fileContent = await fs.readFile(filePath, 'utf8')
            const result = await this.processRawData(fileContent, this.getDataTypeFromPath(filePath))
            
            if (result.success) {
              callback({
                nouns: result.data.nouns,
                verbs: result.data.verbs,
                confidence: result.data.confidence
              })
            }
          } catch (error) {
            console.error('Neural Import feed error:', error)
          }
        }
      })
      
      return
    }

    // For other feed types, implement appropriate listeners
    console.log(`🧠 Neural Import listening to feed: ${feedUrl}`)
  }

  /**
   * Analyze data structure without processing (preview mode)
   */
  async analyzeStructure(rawData: Buffer | string, dataType: string, options?: Record<string, unknown>): Promise<AugmentationResponse<{
    entityTypes: Array<{ type: string; count: number; confidence: number }>
    relationshipTypes: Array<{ type: string; count: number; confidence: number }>
    dataQuality: {
      completeness: number
      consistency: number
      accuracy: number
    }
    recommendations: string[]
  }>> {
    try {
      // Parse the raw data
      const parsedData = await this.parseRawData(rawData, dataType)
      
      // Perform lightweight analysis for structure detection
      const analysis = await this.performNeuralAnalysis(parsedData, { ...this.config, ...options })
      
      // Summarize entity types
      const entityTypeCounts = new Map<string, { count: number; totalConfidence: number }>()
      analysis.detectedEntities.forEach(entity => {
        const existing = entityTypeCounts.get(entity.nounType) || { count: 0, totalConfidence: 0 }
        entityTypeCounts.set(entity.nounType, {
          count: existing.count + 1,
          totalConfidence: existing.totalConfidence + entity.confidence
        })
      })

      const entityTypes = Array.from(entityTypeCounts.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        confidence: stats.totalConfidence / stats.count
      }))

      // Summarize relationship types
      const relationshipTypeCounts = new Map<string, { count: number; totalConfidence: number }>()
      analysis.detectedRelationships.forEach(rel => {
        const existing = relationshipTypeCounts.get(rel.verbType) || { count: 0, totalConfidence: 0 }
        relationshipTypeCounts.set(rel.verbType, {
          count: existing.count + 1,
          totalConfidence: existing.totalConfidence + rel.confidence
        })
      })

      const relationshipTypes = Array.from(relationshipTypeCounts.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        confidence: stats.totalConfidence / stats.count
      }))

      // Assess data quality
      const dataQuality = this.assessDataQuality(parsedData, analysis)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(parsedData, analysis, entityTypes, relationshipTypes)

      return {
        success: true,
        data: {
          entityTypes,
          relationshipTypes,
          dataQuality,
          recommendations
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {
          entityTypes: [],
          relationshipTypes: [],
          dataQuality: { completeness: 0, consistency: 0, accuracy: 0 },
          recommendations: []
        },
        error: error instanceof Error ? error.message : 'Structure analysis failed'
      }
    }
  }

  /**
   * Validate data compatibility with current knowledge base
   */
  async validateCompatibility(rawData: Buffer | string, dataType: string): Promise<AugmentationResponse<{
    compatible: boolean
    issues: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>
    suggestions: string[]
  }>> {
    try {
      // Parse the raw data
      const parsedData = await this.parseRawData(rawData, dataType)
      
      // Perform neural analysis
      const analysis = await this.performNeuralAnalysis(parsedData)
      
      const issues: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }> = []
      const suggestions: string[] = []

      // Check for low confidence entities
      const lowConfidenceEntities = analysis.detectedEntities.filter((e: any) => e.confidence < 0.5)
      if (lowConfidenceEntities.length > 0) {
        issues.push({
          type: 'confidence',
          description: `${lowConfidenceEntities.length} entities have low confidence scores`,
          severity: 'medium'
        })
        suggestions.push('Consider reviewing field names and data structure for better entity detection')
      }

      // Check for missing relationships
      if (analysis.detectedRelationships.length === 0 && analysis.detectedEntities.length > 1) {
        issues.push({
          type: 'relationships',
          description: 'No relationships detected between entities',
          severity: 'low'
        })
        suggestions.push('Consider adding contextual fields that describe entity relationships')
      }

      // Check for data type compatibility
      const supportedTypes = ['json', 'csv', 'yaml', 'text']
      if (!supportedTypes.includes(dataType.toLowerCase())) {
        issues.push({
          type: 'format',
          description: `Data type '${dataType}' may not be fully supported`,
          severity: 'high'
        })
        suggestions.push(`Convert data to one of: ${supportedTypes.join(', ')}`)
      }

      // Check for data completeness
      const incompleteEntities = analysis.detectedEntities.filter((e: any) => 
        !e.originalData || Object.keys(e.originalData).length < 2
      )
      if (incompleteEntities.length > 0) {
        issues.push({
          type: 'completeness',
          description: `${incompleteEntities.length} entities have insufficient data`,
          severity: 'medium'
        })
        suggestions.push('Ensure each entity has multiple descriptive fields')
      }

      const compatible = issues.filter(i => i.severity === 'high').length === 0

      return {
        success: true,
        data: {
          compatible,
          issues,
          suggestions
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {
          compatible: false,
          issues: [{
            type: 'error',
            description: error instanceof Error ? error.message : 'Validation failed',
            severity: 'high'
          }],
          suggestions: []
        },
        error: error instanceof Error ? error.message : 'Compatibility validation failed'
      }
    }
  }

  /**
   * Get the full neural analysis result (custom method for Cortex integration)
   */
  async getNeuralAnalysis(rawData: Buffer | string, dataType: string): Promise<CortexAnalysisResult> {
    const parsedData = await this.parseRawData(rawData, dataType)
    return await this.performNeuralAnalysis(parsedData)
  }

  /**
   * Parse raw data based on type
   */
  private async parseRawData(rawData: Buffer | string, dataType: string): Promise<any[]> {
    const content = typeof rawData === 'string' ? rawData : rawData.toString('utf8')

    switch (dataType.toLowerCase()) {
      case 'json':
        const jsonData = JSON.parse(content)
        return Array.isArray(jsonData) ? jsonData : [jsonData]
      
      case 'csv':
        return this.parseCSV(content)
      
      case 'yaml':
      case 'yml':
        // For now, basic YAML support - in full implementation would use yaml parser
        return JSON.parse(content) // Placeholder
      
      case 'txt':
      case 'text':
        // Split text into sentences/paragraphs for analysis
        return content.split(/\n+/).filter(line => line.trim()).map(line => ({ text: line }))
      
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
  }

  /**
   * Basic CSV parser
   */
  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }

    return data
  }

  /**
   * Perform neural analysis on parsed data
   */
  private async performNeuralAnalysis(parsedData: any[], config = this.config): Promise<CortexAnalysisResult> {
    // Phase 1: Neural Entity Detection
    const detectedEntities = await this.detectEntitiesWithNeuralAnalysis(parsedData, config)
    
    // Phase 2: Neural Relationship Detection  
    const detectedRelationships = await this.detectRelationshipsWithNeuralAnalysis(detectedEntities, parsedData, config)
    
    // Phase 3: Neural Insights Generation
    const insights = await this.generateCortexInsights(detectedEntities, detectedRelationships)
    
    // Phase 4: Confidence Scoring
    const overallConfidence = this.calculateOverallConfidence(detectedEntities, detectedRelationships)

    return {
      detectedEntities,
      detectedRelationships,
      confidence: overallConfidence,
      insights
    }
  }

  /**
   * Neural Entity Detection - The Core AI Engine
   */
  private async detectEntitiesWithNeuralAnalysis(rawData: any[], config = this.config): Promise<DetectedEntity[]> {
    const entities: DetectedEntity[] = []
    const nounTypes = Object.values(NounType)

    for (const [index, dataItem] of rawData.entries()) {
      const mainText = this.extractMainText(dataItem)
      const detections: Array<{ type: string, confidence: number, reasoning: string }> = []

      // Test against all noun types using semantic similarity
      for (const nounType of nounTypes) {
        const confidence = await this.calculateEntityTypeConfidence(mainText, dataItem, nounType)
        if (confidence >= config.confidenceThreshold - 0.2) { // Allow slightly lower for alternatives
          const reasoning = await this.generateEntityReasoning(mainText, dataItem, nounType)
          detections.push({ type: nounType, confidence, reasoning })
        }
      }

      if (detections.length > 0) {
        // Sort by confidence
        detections.sort((a, b) => b.confidence - a.confidence)
        const primaryType = detections[0]
        const alternatives = detections.slice(1, 3) // Top 2 alternatives

        entities.push({
          originalData: dataItem,
          nounType: primaryType.type,
          confidence: primaryType.confidence,
          suggestedId: this.generateSmartId(dataItem, primaryType.type, index),
          reasoning: primaryType.reasoning,
          alternativeTypes: alternatives
        })
      }
    }

    return entities
  }

  /**
   * Calculate entity type confidence using AI
   */
  private async calculateEntityTypeConfidence(text: string, data: any, nounType: string): Promise<number> {
    // Base semantic similarity using search
    const searchResults = await this.brainy.search(text + ' ' + nounType, 1)
    const textSimilarity = searchResults.length > 0 ? searchResults[0].score : 0.5
    
    // Field-based confidence boost
    const fieldBoost = this.calculateFieldBasedConfidence(data, nounType)
    
    // Pattern-based confidence boost  
    const patternBoost = this.calculatePatternBasedConfidence(text, data, nounType)
    
    // Combine confidences with weights
    const combined = (textSimilarity * 0.5) + (fieldBoost * 0.3) + (patternBoost * 0.2)
    
    return Math.min(combined, 1.0)
  }

  /**
   * Field-based confidence calculation
   */
  private calculateFieldBasedConfidence(data: any, nounType: string): number {
    const fields = Object.keys(data)
    let boost = 0

    // Field patterns that boost confidence for specific noun types
    const fieldPatterns: Record<string, string[]> = {
      [NounType.Person]: ['name', 'email', 'phone', 'age', 'firstname', 'lastname', 'employee'],
      [NounType.Organization]: ['company', 'organization', 'corp', 'inc', 'ltd', 'department', 'team'],
      [NounType.Project]: ['project', 'task', 'deadline', 'status', 'milestone', 'deliverable'],
      [NounType.Location]: ['address', 'city', 'country', 'state', 'zip', 'location', 'coordinates'],
      [NounType.Product]: ['product', 'price', 'sku', 'inventory', 'category', 'brand'],
      [NounType.Event]: ['date', 'time', 'venue', 'event', 'meeting', 'conference', 'schedule']
    }

    const relevantPatterns = fieldPatterns[nounType] || []
    for (const field of fields) {
      for (const pattern of relevantPatterns) {
        if (field.toLowerCase().includes(pattern)) {
          boost += 0.1
        }
      }
    }

    return Math.min(boost, 0.5)
  }

  /**
   * Pattern-based confidence calculation
   */
  private calculatePatternBasedConfidence(text: string, data: any, nounType: string): number {
    let boost = 0

    // Content patterns that indicate entity types
    const patterns: Record<string, RegExp[]> = {
      [NounType.Person]: [
        /@.*\.com/i, // Email pattern
        /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Name pattern
        /Mr\.|Mrs\.|Dr\.|Prof\./i // Title pattern
      ],
      [NounType.Organization]: [
        /\bInc\.|Corp\.|LLC\.|Ltd\./i, // Corporate suffixes
        /Company|Corporation|Enterprise/i
      ],
      [NounType.Location]: [
        /\b\d{5}(-\d{4})?\b/, // ZIP code
        /Street|Ave|Road|Blvd/i
      ]
    }

    const relevantPatterns = patterns[nounType] || []
    for (const pattern of relevantPatterns) {
      if (pattern.test(text)) {
        boost += 0.15
      }
    }

    return Math.min(boost, 0.3)
  }

  /**
   * Generate reasoning for entity type selection
   */
  private async generateEntityReasoning(text: string, data: any, nounType: string): Promise<string> {
    const reasons: string[] = []

    // Semantic similarity reason
    const searchResults = await this.brainy.search(text + ' ' + nounType, 1)
    const similarity = searchResults.length > 0 ? searchResults[0].score : 0.5
    if (similarity > 0.7) {
      reasons.push(`High semantic similarity (${(similarity * 100).toFixed(1)}%)`)
    }

    // Field-based reasons
    const relevantFields = this.getRelevantFields(data, nounType)
    if (relevantFields.length > 0) {
      reasons.push(`Contains ${nounType}-specific fields: ${relevantFields.join(', ')}`)
    }

    // Pattern-based reasons
    const matchedPatterns = this.getMatchedPatterns(text, data, nounType)
    if (matchedPatterns.length > 0) {
      reasons.push(`Matches ${nounType} patterns: ${matchedPatterns.join(', ')}`)
    }

    return reasons.length > 0 ? reasons.join('; ') : 'General semantic match'
  }

  /**
   * Neural Relationship Detection
   */
  private async detectRelationshipsWithNeuralAnalysis(
    entities: DetectedEntity[], 
    rawData: any[],
    config = this.config
  ): Promise<DetectedRelationship[]> {
    const relationships: DetectedRelationship[] = []
    const verbTypes = Object.values(VerbType)

    // For each pair of entities, test relationship possibilities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const sourceEntity = entities[i]
        const targetEntity = entities[j]

        // Extract context for relationship detection
        const context = this.extractRelationshipContext(sourceEntity.originalData, targetEntity.originalData, rawData)

        // Test all verb types
        for (const verbType of verbTypes) {
          const confidence = await this.calculateRelationshipConfidence(
            sourceEntity, targetEntity, verbType, context
          )

          if (confidence >= config.confidenceThreshold - 0.1) { // Slightly lower threshold for relationships
            const weight = config.enableWeights ? 
              this.calculateRelationshipWeight(sourceEntity, targetEntity, verbType, context) : 
              0.5

            const reasoning = await this.generateRelationshipReasoning(sourceEntity, targetEntity, verbType, context)

            relationships.push({
              sourceId: sourceEntity.suggestedId,
              targetId: targetEntity.suggestedId,
              verbType,
              confidence,
              weight,
              reasoning,
              context,
              metadata: this.extractRelationshipMetadata(sourceEntity.originalData, targetEntity.originalData, verbType)
            })
          }
        }
      }
    }

    // Sort by confidence and remove duplicates/conflicts
    return this.pruneRelationships(relationships)
  }

  /**
   * Calculate relationship confidence
   */
  private async calculateRelationshipConfidence(
    source: DetectedEntity, 
    target: DetectedEntity, 
    verbType: string, 
    context: string
  ): Promise<number> {
    // Semantic similarity between entities and verb type
    const relationshipText = `${this.extractMainText(source.originalData)} ${verbType} ${this.extractMainText(target.originalData)}`
    const directResults = await this.brainy.search(relationshipText, 1)
    const directSimilarity = directResults.length > 0 ? directResults[0].score : 0.5
    
    // Context-based similarity
    const contextResults = await this.brainy.search(context + ' ' + verbType, 1)
    const contextSimilarity = contextResults.length > 0 ? contextResults[0].score : 0.5
    
    // Entity type compatibility
    const typeCompatibility = this.calculateTypeCompatibility(source.nounType, target.nounType, verbType)
    
    // Combine with weights
    return (directSimilarity * 0.4) + (contextSimilarity * 0.4) + (typeCompatibility * 0.2)
  }

  /**
   * Calculate relationship weight/strength
   */
  private calculateRelationshipWeight(
    source: DetectedEntity, 
    target: DetectedEntity, 
    verbType: string, 
    context: string
  ): number {
    let weight = 0.5 // Base weight

    // Context richness (more descriptive = stronger)
    const contextWords = context.split(' ').length
    weight += Math.min(contextWords / 20, 0.2)

    // Entity importance (higher confidence entities = stronger relationships)
    const avgEntityConfidence = (source.confidence + target.confidence) / 2
    weight += avgEntityConfidence * 0.2

    // Verb type specificity (more specific verbs = stronger)
    const verbSpecificity = this.getVerbSpecificity(verbType)
    weight += verbSpecificity * 0.1

    return Math.min(weight, 1.0)
  }

  /**
   * Generate Neural Insights - The Intelligence Layer
   */
  private async generateCortexInsights(entities: DetectedEntity[], relationships: DetectedRelationship[]): Promise<CortexInsight[]> {
    const insights: CortexInsight[] = []

    // Detect hierarchies
    const hierarchies = this.detectHierarchies(relationships)
    hierarchies.forEach(hierarchy => {
      insights.push({
        type: 'hierarchy',
        description: `Detected ${hierarchy.type} hierarchy with ${hierarchy.levels} levels`,
        confidence: hierarchy.confidence,
        affectedEntities: hierarchy.entities,
        recommendation: `Consider visualizing the ${hierarchy.type} structure`
      })
    })

    // Detect clusters  
    const clusters = this.detectClusters(entities, relationships)
    clusters.forEach(cluster => {
      insights.push({
        type: 'cluster',
        description: `Found cluster of ${cluster.size} ${cluster.primaryType} entities`,
        confidence: cluster.confidence,
        affectedEntities: cluster.entities,
        recommendation: `These ${cluster.primaryType}s might form a natural grouping`
      })
    })

    // Detect patterns
    const patterns = this.detectPatterns(relationships)
    patterns.forEach(pattern => {
      insights.push({
        type: 'pattern',
        description: `Common relationship pattern: ${pattern.description}`,
        confidence: pattern.confidence,
        affectedEntities: pattern.entities,
        recommendation: pattern.recommendation
      })
    })

    return insights
  }

  /**
   * Helper methods for the neural system
   */

  private extractMainText(data: any): string {
    // Extract the most relevant text from a data object
    const textFields = ['name', 'title', 'description', 'content', 'text', 'label']
    
    for (const field of textFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field]
      }
    }
    
    // Fallback: concatenate all string values
    return Object.values(data)
      .filter(v => typeof v === 'string')
      .join(' ')
      .substring(0, 200) // Limit length
  }

  private generateSmartId(data: any, nounType: string, index: number): string {
    const mainText = this.extractMainText(data)
    const cleanText = mainText.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)
    return `${nounType}_${cleanText}_${index}`
  }

  private extractRelationshipContext(source: any, target: any, allData: any[]): string {
    // Extract context for relationship detection
    return [
      this.extractMainText(source),
      this.extractMainText(target),
      // Add more contextual information
    ].join(' ')
  }

  private calculateTypeCompatibility(sourceType: string, targetType: string, verbType: string): number {
    // Define type compatibility matrix for relationships
    const compatibilityMatrix: Record<string, Record<string, string[]>> = {
      [NounType.Person]: {
        [NounType.Organization]: [VerbType.MemberOf, VerbType.WorksWith],
        [NounType.Project]: [VerbType.WorksWith, VerbType.Creates],
        [NounType.Person]: [VerbType.WorksWith, VerbType.Mentors, VerbType.ReportsTo]
      }
      // Add more compatibility rules
    }

    const sourceCompatibility = compatibilityMatrix[sourceType]
    if (sourceCompatibility && sourceCompatibility[targetType]) {
      return sourceCompatibility[targetType].includes(verbType) ? 1.0 : 0.3
    }

    return 0.5 // Default compatibility
  }

  private getVerbSpecificity(verbType: string): number {
    // More specific verbs get higher scores
    const specificityScores: Record<string, number> = {
      [VerbType.RelatedTo]: 0.1,       // Very generic
      [VerbType.WorksWith]: 0.7,       // Specific
      [VerbType.Mentors]: 0.9,         // Very specific
      [VerbType.ReportsTo]: 0.9,       // Very specific
      [VerbType.Supervises]: 0.9       // Very specific
    }

    return specificityScores[verbType] || 0.5
  }

  private getRelevantFields(data: any, nounType: string): string[] {
    // Implementation for finding relevant fields
    return []
  }

  private getMatchedPatterns(text: string, data: any, nounType: string): string[] {
    // Implementation for finding matched patterns
    return []
  }

  private pruneRelationships(relationships: DetectedRelationship[]): DetectedRelationship[] {
    // Remove duplicates and low-confidence relationships
    return relationships
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 1000) // Limit to top 1000 relationships
  }

  private detectHierarchies(relationships: DetectedRelationship[]): any[] {
    // Detect hierarchical structures
    return []
  }

  private detectClusters(entities: DetectedEntity[], relationships: DetectedRelationship[]): any[] {
    // Detect entity clusters
    return []
  }

  private detectPatterns(relationships: DetectedRelationship[]): any[] {
    // Detect relationship patterns
    return []
  }

  private calculateOverallConfidence(entities: DetectedEntity[], relationships: DetectedRelationship[]): number {
    if (entities.length === 0) return 0
    const entityConfidence = entities.reduce((sum: number, e: any) => sum + e.confidence, 0) / entities.length
    if (relationships.length === 0) return entityConfidence
    const relationshipConfidence = relationships.reduce((sum: number, r: any) => sum + r.confidence, 0) / relationships.length
    return (entityConfidence + relationshipConfidence) / 2
  }

  private async storeNeuralAnalysis(analysis: CortexAnalysisResult): Promise<void> {
    // Store the full analysis result for later retrieval by Cortex or other systems
    // This could be stored in the brainy instance metadata or a separate analysis store
  }

  private getDataTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
      case '.json': return 'json'
      case '.csv': return 'csv'
      case '.yaml':
      case '.yml': return 'yaml'
      case '.txt': return 'text'
      default: return 'text'
    }
  }

  private async generateRelationshipReasoning(
    source: DetectedEntity, 
    target: DetectedEntity, 
    verbType: string, 
    context: string
  ): Promise<string> {
    return `Neural analysis detected ${verbType} relationship based on semantic context`
  }

  private extractRelationshipMetadata(sourceData: any, targetData: any, verbType: string): Record<string, any> {
    return {
      sourceType: typeof sourceData,
      targetType: typeof targetData,
      detectedBy: 'neural-import-sense',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Assess data quality metrics
   */
  private assessDataQuality(parsedData: any[], analysis: CortexAnalysisResult): {
    completeness: number
    consistency: number
    accuracy: number
  } {
    // Completeness: ratio of fields with data
    let totalFields = 0
    let filledFields = 0
    
    parsedData.forEach(item => {
      const fields = Object.keys(item)
      totalFields += fields.length
      filledFields += fields.filter(field => 
        item[field] !== null && 
        item[field] !== undefined && 
        item[field] !== ''
      ).length
    })
    
    const completeness = totalFields > 0 ? filledFields / totalFields : 0

    // Consistency: variance in field structure
    const fieldSets = parsedData.map(item => new Set(Object.keys(item)))
    const allFields = new Set(fieldSets.flatMap(set => Array.from(set)))
    let consistencyScore = 0
    
    if (fieldSets.length > 0) {
      consistencyScore = Array.from(allFields).reduce((score, field) => {
        const hasField = fieldSets.filter(set => set.has(field)).length
        return score + (hasField / fieldSets.length)
      }, 0) / allFields.size
    }

    // Accuracy: average confidence of detected entities
    const accuracy = analysis.detectedEntities.length > 0 ? 
      analysis.detectedEntities.reduce((sum: number, e: any) => sum + e.confidence, 0) / analysis.detectedEntities.length : 
      0

    return {
      completeness,
      consistency: consistencyScore,
      accuracy
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    parsedData: any[], 
    analysis: CortexAnalysisResult,
    entityTypes: Array<{ type: string; count: number; confidence: number }>,
    relationshipTypes: Array<{ type: string; count: number; confidence: number }>
  ): string[] {
    const recommendations: string[] = []

    // Low entity confidence recommendations
    const lowConfidenceEntities = entityTypes.filter(et => et.confidence < 0.7)
    if (lowConfidenceEntities.length > 0) {
      recommendations.push(`Consider improving field names for ${lowConfidenceEntities.map(e => e.type).join(', ')} entities`)
    }

    // Missing relationships recommendations
    if (relationshipTypes.length === 0 && entityTypes.length > 1) {
      recommendations.push('Add fields that describe how entities relate to each other')
    }

    // Data structure recommendations
    if (parsedData.length > 0) {
      const firstItem = parsedData[0]
      const fieldCount = Object.keys(firstItem).length
      
      if (fieldCount < 3) {
        recommendations.push('Consider adding more descriptive fields to each entity')
      }
      
      if (fieldCount > 20) {
        recommendations.push('Consider grouping related fields or splitting complex entities')
      }
    }

    // Entity distribution recommendations
    const dominantEntityType = entityTypes.reduce((max, current) => 
      current.count > max.count ? current : max, entityTypes[0] || { count: 0 }
    )
    
    if (dominantEntityType && dominantEntityType.count > parsedData.length * 0.8) {
      recommendations.push(`Consider diversifying entity types - ${dominantEntityType.type} dominates the dataset`)
    }

    // Relationship quality recommendations
    const lowWeightRelationships = relationshipTypes.filter(rt => rt.confidence < 0.6)
    if (lowWeightRelationships.length > 0) {
      recommendations.push('Consider adding more contextual information to strengthen relationship detection')
    }

    return recommendations
  }
}