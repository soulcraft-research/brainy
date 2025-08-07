import { logger } from '../utils/logger.js'
import { ApiError } from '../utils/errors.js'

export const scoringController = {
  async provideFeedback(req, res, next) {
    try {
      const { id } = req.params
      const { weight, confidence, type = 'correction' } = req.body
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      if (weight === undefined) {
        throw new ApiError(400, 'Weight is required for feedback')
      }

      if (weight < 0 || weight > 1) {
        throw new ApiError(400, 'Weight must be between 0 and 1')
      }

      if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
        throw new ApiError(400, 'Confidence must be between 0 and 1')
      }

      const feedbackData = {
        weight,
        confidence,
        type
      }

      const result = await scoringService.provideFeedback(id, feedbackData)

      res.json({
        success: true,
        message: result.message,
        feedback: {
          relationshipId: id,
          weight,
          confidence,
          type,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      next(error)
    }
  },

  async getStats(req, res, next) {
    try {
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      const stats = await scoringService.getStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  },

  async exportLearningData(req, res, next) {
    try {
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      const result = await scoringService.exportLearningData()

      if (!result.data) {
        return res.json({
          success: true,
          message: result.message
        })
      }

      // Set appropriate headers for download
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="brainy-learning-data.json"')

      res.json({
        success: true,
        data: result.data,
        timestamp: result.timestamp,
        format: result.format
      })
    } catch (error) {
      next(error)
    }
  },

  async importLearningData(req, res, next) {
    try {
      const { data } = req.body
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      if (!data) {
        throw new ApiError(400, 'Learning data is required')
      }

      const result = await scoringService.importLearningData(data)

      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  },

  async clearStats(req, res, next) {
    try {
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      const result = await scoringService.clearStats()

      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  },

  async analyzePattern(req, res, next) {
    try {
      const { sourceType, targetType, relationshipType } = req.body
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      if (!sourceType || !targetType || !relationshipType) {
        throw new ApiError(400, 'sourceType, targetType, and relationshipType are required')
      }

      const analysis = await scoringService.analyzeRelationshipPattern(
        sourceType,
        targetType,
        relationshipType
      )

      res.json({
        success: true,
        data: analysis
      })
    } catch (error) {
      next(error)
    }
  },

  async getRecommendations(req, res, next) {
    try {
      const { entityId } = req.params
      const { limit = 10 } = req.query
      const { scoringService } = req.app.locals

      if (!scoringService) {
        throw new ApiError(400, 'Intelligent verb scoring is not enabled')
      }

      const recommendations = await scoringService.getRecommendations(entityId, parseInt(limit))

      res.json({
        success: true,
        data: recommendations
      })
    } catch (error) {
      next(error)
    }
  }
}