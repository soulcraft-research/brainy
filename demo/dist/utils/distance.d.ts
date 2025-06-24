/**
 * Distance functions for vector similarity calculations
 * Optimized for Node.js 23.11+ using enhanced array methods
 */
import { DistanceFunction } from '../coreTypes.js';
/**
 * Calculates the Euclidean distance between two vectors
 * Lower values indicate higher similarity
 * Optimized using array methods for Node.js 23.11+
 */
export declare const euclideanDistance: DistanceFunction;
/**
 * Calculates the cosine distance between two vectors
 * Lower values indicate higher similarity
 * Range: 0 (identical) to 2 (opposite)
 * Optimized using array methods for Node.js 23.11+
 */
export declare const cosineDistance: DistanceFunction;
/**
 * Calculates the Manhattan (L1) distance between two vectors
 * Lower values indicate higher similarity
 * Optimized using array methods for Node.js 23.11+
 */
export declare const manhattanDistance: DistanceFunction;
/**
 * Calculates the dot product similarity between two vectors
 * Higher values indicate higher similarity
 * Converted to a distance metric (lower is better)
 * Optimized using array methods for Node.js 23.11+
 */
export declare const dotProductDistance: DistanceFunction;
//# sourceMappingURL=distance.d.ts.map