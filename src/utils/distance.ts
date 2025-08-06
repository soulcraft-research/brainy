/**
 * Distance functions for vector similarity calculations
 * Optimized pure JavaScript implementations using enhanced array methods
 * Faster than GPU for small vectors (384 dims) due to no transfer overhead
 */

import { DistanceFunction, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'
import { isThreadingAvailable } from './environment.js'

/**
 * Calculates the Euclidean distance between two vectors
 * Lower values indicate higher similarity
 * Optimized using array methods for Node.js 23.11+
 */
export const euclideanDistance: DistanceFunction = (
  a: Vector,
  b: Vector
): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce for better performance in Node.js 23.11+
  const sum = a.reduce((acc, val, i) => {
    const diff = val - b[i]
    return acc + diff * diff
  }, 0)

  return Math.sqrt(sum)
}

/**
 * Calculates the cosine distance between two vectors
 * Lower values indicate higher similarity
 * Range: 0 (identical) to 2 (opposite)
 * Optimized using array methods for Node.js 23.11+
 */
export const cosineDistance: DistanceFunction = (
  a: Vector,
  b: Vector
): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce to calculate all values in a single pass
  const { dotProduct, normA, normB } = a.reduce(
    (acc, val, i) => {
      return {
        dotProduct: acc.dotProduct + val * b[i],
        normA: acc.normA + val * val,
        normB: acc.normB + b[i] * b[i]
      }
    },
    { dotProduct: 0, normA: 0, normB: 0 }
  )

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
export const manhattanDistance: DistanceFunction = (
  a: Vector,
  b: Vector
): number => {
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
export const dotProductDistance: DistanceFunction = (
  a: Vector,
  b: Vector
): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  // Use array.reduce for better performance in Node.js 23.11+
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)

  // Convert to a distance metric (lower is better)
  return -dotProduct
}

/**
 * Batch distance calculation using optimized JavaScript
 * More efficient than GPU for small vectors due to no memory transfer overhead
 *
 * @param queryVector The query vector to compare against all vectors
 * @param vectors Array of vectors to compare against
 * @param distanceFunction The distance function to use
 * @returns Promise resolving to array of distances
 */
export async function calculateDistancesBatch(
  queryVector: Vector,
  vectors: Vector[],
  distanceFunction: DistanceFunction = euclideanDistance
): Promise<number[]> {
  // For small batches, use the standard distance function
  if (vectors.length < 10) {
    return vectors.map((vector) => distanceFunction(queryVector, vector))
  }

  try {
    // Function for optimized batch distance calculation
    const distanceCalculator = (args: {
      queryVector: Vector
      vectors: Vector[]
      distanceFnString: string
    }) => {
      const { queryVector, vectors, distanceFnString } = args

      // Optimized JavaScript implementations for different distance functions
      let distances: number[]

      if (distanceFnString.includes('euclideanDistance')) {
        // Euclidean distance: sqrt(sum((a - b)^2))
        distances = vectors.map((vector) => {
          let sum = 0
          for (let i = 0; i < queryVector.length; i++) {
            const diff = queryVector[i] - vector[i]
            sum += diff * diff
          }
          return Math.sqrt(sum)
        })
      } else if (distanceFnString.includes('cosineDistance')) {
        // Cosine distance: 1 - (a·b / (||a|| * ||b||))
        distances = vectors.map((vector) => {
          let dotProduct = 0
          let queryNorm = 0
          let vectorNorm = 0
          
          for (let i = 0; i < queryVector.length; i++) {
            dotProduct += queryVector[i] * vector[i]
            queryNorm += queryVector[i] * queryVector[i]
            vectorNorm += vector[i] * vector[i]
          }
          
          queryNorm = Math.sqrt(queryNorm)
          vectorNorm = Math.sqrt(vectorNorm)
          
          if (queryNorm === 0 || vectorNorm === 0) {
            return 1 // Maximum distance for zero vectors
          }
          
          const cosineSimilarity = dotProduct / (queryNorm * vectorNorm)
          return 1 - cosineSimilarity
        })
      } else if (distanceFnString.includes('manhattanDistance')) {
        // Manhattan distance: sum(|a - b|)
        distances = vectors.map((vector) => {
          let sum = 0
          for (let i = 0; i < queryVector.length; i++) {
            sum += Math.abs(queryVector[i] - vector[i])
          }
          return sum
        })
      } else if (distanceFnString.includes('dotProductDistance')) {
        // Dot product distance: -sum(a * b)
        distances = vectors.map((vector) => {
          let dotProduct = 0
          for (let i = 0; i < queryVector.length; i++) {
            dotProduct += queryVector[i] * vector[i]
          }
          return -dotProduct
        })
      } else {
        // For unknown distance functions, use the provided function
        const distanceFunction = new Function(
          'return ' + distanceFnString
        )() as DistanceFunction

        distances = vectors.map((vector) =>
          distanceFunction(queryVector, vector)
        )
      }

      return { distances }
    }

    // Use the optimized distance calculator
    const result = distanceCalculator({
      queryVector,
      vectors,
      distanceFnString: distanceFunction.toString()
    })

    return result.distances
  } catch (error) {
    // If anything fails, fall back to the standard distance function
    console.error('Batch distance calculation failed:', error)
    return vectors.map((vector) => distanceFunction(queryVector, vector))
  }
}
