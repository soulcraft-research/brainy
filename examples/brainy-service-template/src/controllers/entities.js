import { logger } from '../utils/logger.js'
import { ApiError } from '../utils/errors.js'

export const entitiesController = {
  async create(req, res, next) {
    try {
      const { data, metadata = {}, options = {} } = req.body
      const { brainyService } = req.app.locals

      if (!data) {
        throw new ApiError(400, 'Data is required')
      }

      // Add timestamp and source info to metadata
      const enhancedMetadata = {
        ...metadata,
        createdAt: new Date().toISOString(),
        source: 'api'
      }

      const entityId = await brainyService.addEntity(data, enhancedMetadata, options)

      res.status(201).json({
        success: true,
        id: entityId,
        data: {
          id: entityId,
          data,
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

      const entity = await brainyService.getEntity(id)

      if (!entity) {
        throw new ApiError(404, `Entity with ID ${id} not found`)
      }

      res.json({
        success: true,
        data: entity
      })
    } catch (error) {
      next(error)
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params
      const { data, metadata = {} } = req.body
      const { brainyService } = req.app.locals

      // Check if entity exists
      const existingEntity = await brainyService.getEntity(id)
      if (!existingEntity) {
        throw new ApiError(404, `Entity with ID ${id} not found`)
      }

      // Add update timestamp
      const enhancedMetadata = {
        ...metadata,
        updatedAt: new Date().toISOString()
      }

      await brainyService.updateEntity(id, data, enhancedMetadata)

      res.json({
        success: true,
        message: 'Entity updated successfully',
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

      // Check if entity exists
      const existingEntity = await brainyService.getEntity(id)
      if (!existingEntity) {
        throw new ApiError(404, `Entity with ID ${id} not found`)
      }

      await brainyService.deleteEntity(id)

      res.json({
        success: true,
        message: 'Entity deleted successfully',
        id
      })
    } catch (error) {
      next(error)
    }
  },

  async search(req, res, next) {
    try {
      const { query, limit = 10, threshold = 0.7, includeMetadata = true } = req.body
      const { brainyService } = req.app.locals

      if (!query) {
        throw new ApiError(400, 'Query is required')
      }

      const options = {
        limit: Math.min(limit, 100), // Cap at 100 results
        threshold,
        includeMetadata
      }

      const results = await brainyService.searchEntities(query, options)

      res.json({
        success: true,
        query,
        results: results.map(result => ({
          id: result.id,
          similarity: result.similarity,
          data: result.data,
          metadata: result.metadata
        })),
        count: results.length,
        options
      })
    } catch (error) {
      next(error)
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 50, type } = req.query
      const { brainyService } = req.app.locals

      const options = {
        offset: (page - 1) * limit,
        limit: Math.min(limit, 100)
      }

      // Add type filter if specified
      if (type) {
        options.filter = { type }
      }

      const entities = await brainyService.listEntities(options)

      res.json({
        success: true,
        data: entities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          count: entities.length
        }
      })
    } catch (error) {
      next(error)
    }
  }
}