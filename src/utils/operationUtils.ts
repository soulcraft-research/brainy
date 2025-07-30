/**
 * Utility functions for timeout and retry logic
 * Used by storage adapters to handle network operations reliably
 */

import { BrainyError } from '../errors/brainyError.js'

export interface TimeoutConfig {
    get?: number
    add?: number
    delete?: number
}

export interface RetryConfig {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
}

export interface OperationConfig {
    timeouts?: TimeoutConfig
    retryPolicy?: RetryConfig
}

// Default configuration values
export const DEFAULT_TIMEOUTS: Required<TimeoutConfig> = {
    get: 30000,      // 30 seconds
    add: 60000,      // 1 minute
    delete: 30000    // 30 seconds
}

export const DEFAULT_RETRY_POLICY: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
}

/**
 * Wraps a promise with a timeout
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(BrainyError.timeout(operation, timeoutMs))
        }, timeoutMs)

        promise
            .then((result) => {
                clearTimeout(timeoutId)
                resolve(result)
            })
            .catch((error) => {
                clearTimeout(timeoutId)
                reject(error)
            })
    })
}

/**
 * Calculates the delay for exponential backoff
 */
function calculateBackoffDelay(
    attemptNumber: number,
    initialDelay: number,
    maxDelay: number,
    backoffMultiplier: number
): number {
    const delay = initialDelay * Math.pow(backoffMultiplier, attemptNumber - 1)
    return Math.min(delay, maxDelay)
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Executes an operation with retry logic and exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_RETRY_POLICY.maxRetries,
        initialDelay = DEFAULT_RETRY_POLICY.initialDelay,
        maxDelay = DEFAULT_RETRY_POLICY.maxDelay,
        backoffMultiplier = DEFAULT_RETRY_POLICY.backoffMultiplier
    } = config

    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))

            // If this is the last attempt, don't retry
            if (attempt > maxRetries) {
                break
            }

            // Check if the error is retryable
            if (!BrainyError.isRetryable(lastError)) {
                throw BrainyError.fromError(lastError, operationName)
            }

            // Calculate delay for exponential backoff
            const delay = calculateBackoffDelay(attempt, initialDelay, maxDelay, backoffMultiplier)
            
            console.warn(
                `Operation '${operationName}' failed on attempt ${attempt}/${maxRetries + 1}. ` +
                `Retrying in ${delay}ms. Error: ${lastError.message}`
            )

            // Wait before retrying
            await sleep(delay)
        }
    }

    // All retries exhausted
    throw BrainyError.retryExhausted(operationName, maxRetries, lastError)
}

/**
 * Executes an operation with both timeout and retry logic
 */
export async function withTimeoutAndRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    timeoutMs: number,
    retryConfig: RetryConfig = {}
): Promise<T> {
    return withRetry(
        () => withTimeout(operation(), timeoutMs, operationName),
        operationName,
        retryConfig
    )
}

/**
 * Creates a configured operation executor for a specific operation type
 */
export function createOperationExecutor(
    operationType: keyof TimeoutConfig,
    config: OperationConfig = {}
) {
    const timeouts = { ...DEFAULT_TIMEOUTS, ...config.timeouts }
    const retryPolicy = { ...DEFAULT_RETRY_POLICY, ...config.retryPolicy }
    const timeoutMs = timeouts[operationType]

    return async function executeOperation<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        return withTimeoutAndRetry(operation, operationName, timeoutMs, retryPolicy)
    }
}

/**
 * Storage operation executors for different operation types
 */
export class StorageOperationExecutors {
    private getExecutor: ReturnType<typeof createOperationExecutor>
    private addExecutor: ReturnType<typeof createOperationExecutor>
    private deleteExecutor: ReturnType<typeof createOperationExecutor>

    constructor(config: OperationConfig = {}) {
        this.getExecutor = createOperationExecutor('get', config)
        this.addExecutor = createOperationExecutor('add', config)
        this.deleteExecutor = createOperationExecutor('delete', config)
    }

    /**
     * Execute a get operation with timeout and retry
     */
    async executeGet<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
        return this.getExecutor(operation, operationName)
    }

    /**
     * Execute an add operation with timeout and retry
     */
    async executeAdd<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
        return this.addExecutor(operation, operationName)
    }

    /**
     * Execute a delete operation with timeout and retry
     */
    async executeDelete<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
        return this.deleteExecutor(operation, operationName)
    }
}
