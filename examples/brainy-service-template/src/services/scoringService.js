import { logger } from '../utils/logger.js'

export class ScoringService {
  constructor(brainyService) {
    this.brainyService = brainyService
  }

  async provideFeedback(relationshipId, feedbackData) {
    try {
      // Get the relationship to extract source, target, and type
      const relationship = await this.brainyService.getRelationship(relationshipId)
      
      if (!relationship) {
        throw new Error(`Relationship ${relationshipId} not found`)
      }

      // Provide feedback to the intelligent scoring system
      const db = this.brainyService.getDatabase()
      await db.provideFeedbackForVerbScoring(
        relationship.sourceId,
        relationship.targetId,
        relationship.type || relationship.verb,
        feedbackData.weight,
        feedbackData.confidence,
        feedbackData.type || 'correction'
      )

      logger.info('Feedback provided for relationship', { 
        relationshipId,
        feedbackType: feedbackData.type || 'correction',
        weight: feedbackData.weight,
        confidence: feedbackData.confidence
      })

      return {
        success: true,
        message: 'Feedback provided successfully'
      }
    } catch (error) {
      logger.error('Failed to provide feedback:', error)
      throw error
    }
  }

  async getStats() {
    try {
      const db = this.brainyService.getDatabase()
      const stats = db.getVerbScoringStats()
      
      if (!stats) {
        return {
          message: 'Intelligent verb scoring is not enabled or has no data yet',
          stats: null
        }
      }

      logger.debug('Retrieved scoring statistics', { 
        totalRelationships: stats.totalRelationships 
      })

      return {
        stats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Failed to get scoring statistics:', error)
      throw error
    }
  }

  async exportLearningData() {
    try {
      const db = this.brainyService.getDatabase()
      const learningData = db.exportVerbScoringLearningData()
      
      if (!learningData) {
        return {
          message: 'No learning data available for export',
          data: null
        }
      }

      logger.info('Learning data exported successfully')

      return {
        data: learningData,
        timestamp: new Date().toISOString(),
        format: 'json'
      }
    } catch (error) {
      logger.error('Failed to export learning data:', error)
      throw error
    }
  }

  async importLearningData(learningData) {
    try {
      const db = this.brainyService.getDatabase()
      
      // If data is an object, stringify it
      const dataString = typeof learningData === 'string' 
        ? learningData 
        : JSON.stringify(learningData)

      db.importVerbScoringLearningData(dataString)

      logger.info('Learning data imported successfully')

      return {
        success: true,
        message: 'Learning data imported successfully'
      }
    } catch (error) {
      logger.error('Failed to import learning data:', error)
      throw error
    }
  }

  async clearStats() {
    try {
      const db = this.brainyService.getDatabase()
      
      // Access the intelligent scoring system directly if available
      if (db.intelligentVerbScoring && db.intelligentVerbScoring.enabled) {
        db.intelligentVerbScoring.clearStats()
        
        logger.info('Scoring statistics cleared')

        return {
          success: true,
          message: 'Scoring statistics cleared successfully'
        }
      } else {
        return {
          success: false,
          message: 'Intelligent verb scoring is not enabled'
        }
      }
    } catch (error) {
      logger.error('Failed to clear scoring statistics:', error)
      throw error
    }
  }

  // Analysis methods
  async analyzeRelationshipPattern(sourceType, targetType, relationshipType) {
    try {
      const stats = await this.getStats()
      
      if (!stats.stats) {
        return {
          message: 'No data available for pattern analysis'
        }
      }

      // Find patterns for the specific relationship type
      const pattern = `${sourceType}-${relationshipType}-${targetType}`
      const relevantRelationships = stats.stats.topRelationships.filter(rel => 
        rel.relationship.includes(relationshipType)
      )

      return {
        pattern,
        relationships: relevantRelationships,
        analysis: {
          averageWeight: relevantRelationships.reduce((sum, rel) => sum + rel.averageWeight, 0) / relevantRelationships.length || 0,
          totalOccurrences: relevantRelationships.reduce((sum, rel) => sum + rel.count, 0),
          confidence: relevantRelationships.length > 5 ? 'high' : 'low'
        }
      }
    } catch (error) {
      logger.error('Failed to analyze relationship pattern:', error)
      throw error
    }
  }

  async getRecommendations(entityId, limit = 10) {
    try {
      // This would implement recommendation logic based on learned patterns
      // For now, return a placeholder
      return {
        entityId,
        recommendations: [],
        message: 'Recommendation system not yet implemented',
        basedOn: 'intelligent_verb_scoring_patterns'
      }
    } catch (error) {
      logger.error('Failed to get recommendations:', error)
      throw error
    }
  }
}