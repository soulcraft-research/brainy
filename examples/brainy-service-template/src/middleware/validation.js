import { ValidationError } from '../utils/errors.js'

// Validate required fields
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = []
    
    fields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field)
      }
    })
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`)
    }
    
    next()
  }
}

// Validate entity creation
export const validateEntity = (req, res, next) => {
  const { data } = req.body
  
  if (!data) {
    throw new ValidationError('Entity data is required')
  }
  
  if (typeof data !== 'object' && typeof data !== 'string') {
    throw new ValidationError('Entity data must be an object or string')
  }
  
  next()
}

// Validate relationship creation
export const validateRelationship = (req, res, next) => {
  const { sourceId, targetId, type, weight } = req.body
  
  if (!sourceId || !targetId || !type) {
    throw new ValidationError('sourceId, targetId, and type are required')
  }
  
  if (typeof sourceId !== 'string' || typeof targetId !== 'string' || typeof type !== 'string') {
    throw new ValidationError('sourceId, targetId, and type must be strings')
  }
  
  if (sourceId === targetId) {
    throw new ValidationError('sourceId and targetId cannot be the same')
  }
  
  if (weight !== undefined) {
    if (typeof weight !== 'number' || weight < 0 || weight > 1) {
      throw new ValidationError('Weight must be a number between 0 and 1')
    }
  }
  
  next()
}

// Validate search query
export const validateSearch = (req, res, next) => {
  const { query, limit, threshold } = req.body
  
  if (!query) {
    throw new ValidationError('Search query is required')
  }
  
  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new ValidationError('Search query must be a non-empty string')
  }
  
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be an integer between 1 and 100')
    }
  }
  
  if (threshold !== undefined) {
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      throw new ValidationError('Threshold must be a number between 0 and 1')
    }
  }
  
  next()
}

// Validate feedback data
export const validateFeedback = (req, res, next) => {
  const { weight, confidence, type } = req.body
  
  if (weight === undefined) {
    throw new ValidationError('Weight is required for feedback')
  }
  
  if (typeof weight !== 'number' || weight < 0 || weight > 1) {
    throw new ValidationError('Weight must be a number between 0 and 1')
  }
  
  if (confidence !== undefined) {
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      throw new ValidationError('Confidence must be a number between 0 and 1')
    }
  }
  
  if (type !== undefined) {
    const validTypes = ['correction', 'reinforcement', 'adjustment']
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Type must be one of: ${validTypes.join(', ')}`)
    }
  }
  
  next()
}

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  const { page = 1, limit = 50 } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw new ValidationError('Page must be a positive integer')
  }
  
  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Limit must be an integer between 1 and 100')
  }
  
  // Normalize values
  req.query.page = pageNum
  req.query.limit = limitNum
  
  next()
}

// Validate UUID format (basic check)
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName]
    
    if (!id) {
      throw new ValidationError(`${paramName} is required`)
    }
    
    // Basic string validation - Brainy uses various ID formats
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError(`${paramName} must be a valid string`)
    }
    
    next()
  }
}

// Generic validation wrapper
export const validate = (validationFn) => {
  return (req, res, next) => {
    try {
      validationFn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

export default {
  validateRequired,
  validateEntity,
  validateRelationship,
  validateSearch,
  validateFeedback,
  validatePagination,
  validateId,
  validate
}