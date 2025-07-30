/**
 * Custom error types for Brainy operations
 * Provides better error classification and handling
 */

export type BrainyErrorType = 'TIMEOUT' | 'NETWORK' | 'STORAGE' | 'NOT_FOUND' | 'RETRY_EXHAUSTED'

/**
 * Custom error class for Brainy operations
 * Provides error type classification and retry information
 */
export class BrainyError extends Error {
    public readonly type: BrainyErrorType
    public readonly retryable: boolean
    public readonly originalError?: Error
    public readonly attemptNumber?: number
    public readonly maxRetries?: number

    constructor(
        message: string,
        type: BrainyErrorType,
        retryable: boolean = false,
        originalError?: Error,
        attemptNumber?: number,
        maxRetries?: number
    ) {
        super(message)
        this.name = 'BrainyError'
        this.type = type
        this.retryable = retryable
        this.originalError = originalError
        this.attemptNumber = attemptNumber
        this.maxRetries = maxRetries

        // Maintain proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BrainyError)
        }
    }

    /**
     * Create a timeout error
     */
    static timeout(operation: string, timeoutMs: number, originalError?: Error): BrainyError {
        return new BrainyError(
            `Operation '${operation}' timed out after ${timeoutMs}ms`,
            'TIMEOUT',
            true,
            originalError
        )
    }

    /**
     * Create a network error
     */
    static network(message: string, originalError?: Error): BrainyError {
        return new BrainyError(
            `Network error: ${message}`,
            'NETWORK',
            true,
            originalError
        )
    }

    /**
     * Create a storage error
     */
    static storage(message: string, originalError?: Error): BrainyError {
        return new BrainyError(
            `Storage error: ${message}`,
            'STORAGE',
            true,
            originalError
        )
    }

    /**
     * Create a not found error
     */
    static notFound(resource: string): BrainyError {
        return new BrainyError(
            `Resource not found: ${resource}`,
            'NOT_FOUND',
            false
        )
    }

    /**
     * Create a retry exhausted error
     */
    static retryExhausted(operation: string, maxRetries: number, lastError?: Error): BrainyError {
        return new BrainyError(
            `Operation '${operation}' failed after ${maxRetries} retry attempts`,
            'RETRY_EXHAUSTED',
            false,
            lastError,
            maxRetries,
            maxRetries
        )
    }

    /**
     * Check if an error is retryable
     */
    static isRetryable(error: Error): boolean {
        if (error instanceof BrainyError) {
            return error.retryable
        }

        // Check for common retryable error patterns
        const message = error.message.toLowerCase()
        const name = error.name.toLowerCase()

        // Network-related errors that are typically retryable
        if (
            message.includes('timeout') ||
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('econnreset') ||
            message.includes('enotfound') ||
            message.includes('etimedout') ||
            name.includes('timeout')
        ) {
            return true
        }

        // AWS SDK specific retryable errors
        if (
            message.includes('throttling') ||
            message.includes('rate limit') ||
            message.includes('service unavailable') ||
            message.includes('internal server error') ||
            message.includes('bad gateway') ||
            message.includes('gateway timeout')
        ) {
            return true
        }

        return false
    }

    /**
     * Convert a generic error to a BrainyError with appropriate classification
     */
    static fromError(error: Error, operation?: string): BrainyError {
        if (error instanceof BrainyError) {
            return error
        }

        const message = error.message.toLowerCase()
        const name = error.name.toLowerCase()

        // Classify the error based on common patterns
        if (message.includes('timeout') || name.includes('timeout')) {
            return BrainyError.timeout(operation || 'unknown', 0, error)
        }

        if (
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('econnreset') ||
            message.includes('enotfound') ||
            message.includes('etimedout')
        ) {
            return BrainyError.network(error.message, error)
        }

        if (
            message.includes('nosuchkey') ||
            message.includes('not found') ||
            message.includes('does not exist')
        ) {
            return BrainyError.notFound(operation || 'resource')
        }

        // Default to storage error for unclassified errors
        return BrainyError.storage(error.message, error)
    }
}
