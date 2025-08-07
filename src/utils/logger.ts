/**
 * Centralized logging utility for Brainy
 * Provides configurable log levels and consistent logging across the codebase
 * Automatically reduces logging in production environments to minimize costs
 */

import { isProductionEnvironment, getLogLevel } from './environment.js'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LoggerConfig {
  level: LogLevel
  // Specific module log levels
  modules?: {
    [moduleName: string]: LogLevel
  }
  // Whether to include timestamps
  timestamps?: boolean
  // Whether to include module names
  includeModule?: boolean
  // Custom log handler
  handler?: (level: LogLevel, module: string, message: string, ...args: any[]) => void
}

class Logger {
  private static instance: Logger
  private config: LoggerConfig = {
    level: LogLevel.ERROR, // Default to ERROR in production for cost optimization
    timestamps: false, // Disable timestamps in production to reduce log size
    includeModule: true
  }
  
  private constructor() {
    // Auto-detect production environment and set appropriate defaults
    this.applyEnvironmentDefaults()
    
    // Set log level from environment variable if available (overrides auto-detection)
    const envLogLevel = process.env.BRAINY_LOG_LEVEL
    if (envLogLevel) {
      const level = LogLevel[envLogLevel.toUpperCase() as keyof typeof LogLevel]
      if (level !== undefined) {
        this.config.level = level
      }
    }
    
    // Parse module-specific log levels
    const moduleLogLevels = process.env.BRAINY_MODULE_LOG_LEVELS
    if (moduleLogLevels) {
      try {
        this.config.modules = JSON.parse(moduleLogLevels)
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  
  private applyEnvironmentDefaults(): void {
    const envLogLevel = getLogLevel()
    
    // Convert environment log level to Logger LogLevel
    switch (envLogLevel) {
      case 'silent':
        this.config.level = -1 as LogLevel // Below ERROR to silence all logs
        break
      case 'error':
        this.config.level = LogLevel.ERROR
        this.config.timestamps = false // Minimize log size in production
        break
      case 'warn':
        this.config.level = LogLevel.WARN
        this.config.timestamps = false
        break
      case 'info':
        this.config.level = LogLevel.INFO
        this.config.timestamps = true
        break
      case 'verbose':
        this.config.level = LogLevel.DEBUG
        this.config.timestamps = true
        break
    }
    
    // In production environments, be extra conservative to minimize costs
    if (isProductionEnvironment()) {
      this.config.level = Math.min(this.config.level, LogLevel.ERROR)
      this.config.timestamps = false
      this.config.includeModule = false // Reduce log size
    }
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  private shouldLog(level: LogLevel, module: string): boolean {
    // Check module-specific level first
    if (this.config.modules && this.config.modules[module] !== undefined) {
      return level <= this.config.modules[module]
    }
    // Otherwise use global level
    return level <= this.config.level
  }
  
  private formatMessage(level: LogLevel, module: string, message: string): string {
    const parts: string[] = []
    
    if (this.config.timestamps) {
      parts.push(`[${new Date().toISOString()}]`)
    }
    
    parts.push(`[${LogLevel[level]}]`)
    
    if (this.config.includeModule) {
      parts.push(`[${module}]`)
    }
    
    parts.push(message)
    
    return parts.join(' ')
  }
  
  private log(level: LogLevel, module: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(level, module)) {
      return
    }
    
    if (this.config.handler) {
      this.config.handler(level, module, message, ...args)
      return
    }
    
    const formattedMessage = this.formatMessage(level, module, message)
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args)
        break
      case LogLevel.INFO:
        console.info(formattedMessage, ...args)
        break
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.log(formattedMessage, ...args)
        break
    }
  }
  
  error(module: string, message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, module, message, ...args)
  }
  
  warn(module: string, message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, module, message, ...args)
  }
  
  info(module: string, message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, module, message, ...args)
  }
  
  debug(module: string, message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, module, message, ...args)
  }
  
  trace(module: string, message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, module, message, ...args)
  }
  
  // Create a module-specific logger
  createModuleLogger(module: string) {
    return {
      error: (message: string, ...args: any[]) => this.error(module, message, ...args),
      warn: (message: string, ...args: any[]) => this.warn(module, message, ...args),
      info: (message: string, ...args: any[]) => this.info(module, message, ...args),
      debug: (message: string, ...args: any[]) => this.debug(module, message, ...args),
      trace: (message: string, ...args: any[]) => this.trace(module, message, ...args)
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience function for creating module loggers
export function createModuleLogger(module: string) {
  return logger.createModuleLogger(module)
}

// Export function to configure logger
export function configureLogger(config: Partial<LoggerConfig>) {
  logger.configure(config)
}

/**
 * Smart console replacement that automatically reduces logging in production
 * Dramatically reduces Google Cloud Run logging costs
 * 
 * Usage: Replace console.log with smartConsole.log, etc.
 */
export const smartConsole = {
  log: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.INFO, 'console')) {
      console.log(message, ...args)
    }
  },
  
  info: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.INFO, 'console')) {
      console.info(message, ...args)
    }
  },
  
  warn: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.WARN, 'console')) {
      console.warn(message, ...args)
    }
  },
  
  error: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.ERROR, 'console')) {
      console.error(message, ...args)
    }
  },
  
  debug: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.DEBUG, 'console')) {
      console.debug(message, ...args)
    }
  },
  
  trace: (message?: any, ...args: any[]) => {
    if (logger['shouldLog'](LogLevel.TRACE, 'console')) {
      console.trace(message, ...args)
    }
  }
}

/**
 * Production-optimized logging functions
 * These only log in non-production environments or when explicitly enabled
 */
export const prodLog = {
  // Only log errors in production (always visible)
  error: (message?: any, ...args: any[]) => {
    console.error(message, ...args)
  },
  
  // These are suppressed in production unless BRAINY_LOG_LEVEL is set
  warn: (message?: any, ...args: any[]) => smartConsole.warn(message, ...args),
  info: (message?: any, ...args: any[]) => smartConsole.info(message, ...args),
  debug: (message?: any, ...args: any[]) => smartConsole.debug(message, ...args),
  log: (message?: any, ...args: any[]) => smartConsole.log(message, ...args)
}