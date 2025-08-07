import { logger } from '../utils/logger.js'
import { ApiError } from '../utils/errors.js'

export const errorHandler = (error, req, res, next) => {
  // Default error response
  let statusCode = 500
  let message = 'Internal Server Error'
  let details = null

  // Handle known API errors
  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    
    // Add additional details for validation errors
    if (error.field) {
      details = { field: error.field }
    }
    
    if (error.resource) {
      details = { 
        resource: error.resource, 
        resourceId: error.resourceId 
      }
    }
  }
  // Handle Brainy-specific errors
  else if (error.name === 'BrainyError') {
    statusCode = 400
    message = error.message
    details = { type: 'brainy_error' }
  }
  // Handle validation errors from other sources
  else if (error.name === 'ValidationError' || error.name === 'CastError') {
    statusCode = 400
    message = error.message
    details = { type: 'validation_error' }
  }
  // Handle JSON parsing errors
  else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400
    message = 'Invalid JSON format'
    details = { type: 'json_error' }
  }
  // Handle timeout errors
  else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    statusCode = 504
    message = 'Request timeout'
    details = { type: 'timeout_error' }
  }
  // Handle rate limiting
  else if (error.status === 429) {
    statusCode = 429
    message = 'Too Many Requests'
    details = { type: 'rate_limit_error' }
  }

  // Log the error
  const logLevel = statusCode >= 500 ? 'error' : 'warn'
  const logMessage = `${req.method} ${req.originalUrl} - ${statusCode} ${message}`
  const logMeta = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: error.stack
  }

  logger[logLevel](logMessage, logMeta)

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  }

  // Add details if available
  if (details) {
    errorResponse.error.details = details
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.error.requestId = req.id
  }

  res.status(statusCode).json(errorResponse)
}

// 404 handler for unmatched routes
export const notFoundHandler = (req, res) => {
  const message = `Route ${req.method} ${req.originalUrl} not found`
  
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  res.status(404).json({
    success: false,
    error: {
      message,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  })
}

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
}