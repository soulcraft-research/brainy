import winston from 'winston'
import config from 'config'

const logLevel = config.get('logging.level') || 'info'
const logFormat = config.get('logging.format') || 'combined'

// Create custom format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Create custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat === 'dev' ? devFormat : prodFormat,
  defaultMeta: { 
    service: 'brainy-service',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ]
})

// Add file logging for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }))

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }))
}

// Capture unhandled errors
logger.exceptions.handle(
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'logs/exceptions.log' })
)

export default logger