export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class ValidationError extends ApiError {
  constructor(message, field = null) {
    super(400, message)
    this.field = field
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource, id = null) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`
    super(404, message)
    this.name = 'NotFoundError'
    this.resource = resource
    this.resourceId = id
  }
}

export class ConflictError extends ApiError {
  constructor(message) {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message, operation = null) {
    super(500, message)
    this.name = 'DatabaseError'
    this.operation = operation
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message)
    this.name = 'AuthorizationError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message)
    this.name = 'RateLimitError'
  }
}

// Error factory for common scenarios
export const createError = {
  validation: (message, field) => new ValidationError(message, field),
  notFound: (resource, id) => new NotFoundError(resource, id),
  conflict: (message) => new ConflictError(message),
  database: (message, operation) => new DatabaseError(message, operation),
  auth: (message) => new AuthenticationError(message),
  forbidden: (message) => new AuthorizationError(message),
  rateLimit: (message) => new RateLimitError(message),
  badRequest: (message) => new ApiError(400, message),
  internal: (message) => new ApiError(500, message)
}

export default {
  ApiError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  createError
}