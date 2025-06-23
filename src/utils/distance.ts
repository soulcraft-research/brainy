/**
 * Distance functions for vector similarity calculations
 * Optimized for Node.js 23.11+ using enhanced array methods
 */

import { DistanceFunction, Vector } from '../coreTypes.js'

/**
 * Calculates the Euclidean distance between two vectors
 * Lower values indicate higher similarity
 * Optimized using array methods for Node.js 23.11+
 */
export const euclideanDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce for better performance in Node.js 23.11+
  const sum = a.reduce((acc, val, i) => {
    const diff = val - b[i]
    return acc + (diff * diff)
  }, 0)

  return Math.sqrt(sum)
}

/**
 * Calculates the cosine distance between two vectors
 * Lower values indicate higher similarity
 * Range: 0 (identical) to 2 (opposite)
 * Optimized using array methods for Node.js 23.11+
 */
export const cosineDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce to calculate all values in a single pass
  const { dotProduct, normA, normB } = a.reduce((acc, val, i) => {
    return {
      dotProduct: acc.dotProduct + (val * b[i]),
      normA: acc.normA + (val * val),
      normB: acc.normB + (b[i] * b[i])
    };
  }, { dotProduct: 0, normA: 0, normB: 0 });

  if (normA === 0 || normB === 0) {
    return 2 // Maximum distance for zero vectors
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  // Convert cosine similarity (-1 to 1) to distance (0 to 2)
  return 1 - similarity
}

/**
 * Calculates the Manhattan (L1) distance between two vectors
 * Lower values indicate higher similarity
 * Optimized using array methods for Node.js 23.11+
 */
export const manhattanDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce for better performance in Node.js 23.11+
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0)
}

/**
 * Calculates the dot product similarity between two vectors
 * Higher values indicate higher similarity
 * Converted to a distance metric (lower is better)
 * Optimized using array methods for Node.js 23.11+
 */
export const dotProductDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce for better performance in Node.js 23.11+
  const dotProduct = a.reduce((sum, val, i) => sum + (val * b[i]), 0)

  // Convert to a distance metric (lower is better)
  return -dotProduct
}
