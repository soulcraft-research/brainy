import { logger } from '../utils/logger.js'
import { ApiError } from '../utils/errors.js'

export const relationshipsController = {
  async create(req, res, next) {
    try {
      const { sourceId, targetId, type, weight, metadata = {}, autoCreateMissingNouns = false } = req.body
      const { brainyService } = req.app.locals

      if (!sourceId || !targetId || !type) {
        throw new ApiError(400, 'sourceId, targetId, and type are required')
      }

      // Add timestamp and source info to metadata
      const enhancedMetadata = {
        ...metadata,
        createdAt: new Date().toISOString(),
        source: 'api'
      }

      const options = {
        weight,
        metadata: enhancedMetadata,
        autoCreateMissingNouns
      }

      const relationshipId = await brainyService.addRelationship(sourceId, targetId, type, options)

      // Get the created relationship to return full details
      const relationship = await brainyService.getRelationship(relationshipId)

      res.status(201).json({
        success: true,
        id: relationshipId,
        data: {
          id: relationshipId,
          sourceId,
          targetId,
          type,
          weight: relationship?.metadata?.weight,
          confidence: relationship?.metadata?.confidence,
          intelligentScoring: relationship?.metadata?.intelligentScoring,
          metadata: enhancedMetadata
        }
      })
    } catch (error) {
      next(error)
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params
      const { brainyService } = req.app.locals

      const relationship = await brainyService.getRelationship(id)

      if (!relationship) {
        throw new ApiError(404, `Relationship with ID ${id} not found`)
      }

      res.json({
        success: true,
        data: relationship
      })
    } catch (error) {
      next(error)
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params
      const { weight, metadata = {} } = req.body
      const { brainyService } = req.app.locals

      // Check if relationship exists
      const existingRelationship = await brainyService.getRelationship(id)
      if (!existingRelationship) {
        throw new ApiError(404, `Relationship with ID ${id} not found`)
      }

      // Prepare updates
      const updates = {}
      if (weight !== undefined) updates.weight = weight
      if (Object.keys(metadata).length > 0) {
        updates.metadata = {
          ...metadata,
          updatedAt: new Date().toISOString()
        }
      }

      await brainyService.updateRelationship(id, updates)

      res.json({
        success: true,
        message: 'Relationship updated successfully',
        id
      })
    } catch (error) {
      next(error)
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params
      const { brainyService } = req.app.locals

      // Check if relationship exists
      const existingRelationship = await brainyService.getRelationship(id)
      if (!existingRelationship) {
        throw new ApiError(404, `Relationship with ID ${id} not found`)
      }

      await brainyService.deleteRelationship(id)

      res.json({
        success: true,
        message: 'Relationship deleted successfully',
        id
      })
    } catch (error) {
      next(error)
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 50, sourceId, targetId, type } = req.query
      const { brainyService } = req.app.locals

      const options = {
        pagination: {
          offset: (page - 1) * limit,
          limit: Math.min(limit, 100)
        }
      }

      // Add filters if specified
      const filter = {}
      if (sourceId) filter.sourceId = sourceId
      if (targetId) filter.targetId = targetId
      if (type) filter.verbType = type

      if (Object.keys(filter).length > 0) {
        options.filter = filter
      }

      const result = await brainyService.listRelationships(options)

      res.json({
        success: true,
        data: result.items || result,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          count: result.items ? result.items.length : result.length,
          hasMore: result.hasMore || false,
          totalCount: result.totalCount
        }
      })
    } catch (error) {
      next(error)
    }
  }
}