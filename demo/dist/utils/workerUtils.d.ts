/**
 * Utility functions for working with Web Workers and Worker Threads
 */
/**
 * Execute a function in a Web Worker (browser environment)
 *
 * @param fn The function to execute
 * @param args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export declare function executeInWebWorker<T>(fn: Function, ...args: any[]): Promise<T>;
/**
 * Execute a function in a Worker Thread (Node.js environment)
 *
 * @param fn The function to execute
 * @param args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export declare function executeInWorkerThread<T>(fn: Function, ...args: any[]): Promise<T>;
/**
 * Execute a function in a separate thread based on the environment
 *
 * @param fn The function to execute
 * @param args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export declare function executeInThread<T>(fn: Function, ...args: any[]): Promise<T>;
//# sourceMappingURL=workerUtils.d.ts.map