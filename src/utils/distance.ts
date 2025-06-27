/**
 * Distance functions for vector similarity calculations
 * Optimized for Node.js 23.11+ using enhanced array methods
 * GPU-accelerated versions available for high-performance computing
 */

import { DistanceFunction, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'
import { isThreadingAvailable } from './environment.js'

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
    }
  }, { dotProduct: 0, normA: 0, normB: 0 })

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

/**
 * GPU-accelerated batch distance calculation
 * Uses TensorFlow.js with WebGL backend when available for optimal performance
 * Falls back to CPU processing when GPU is not available
 *
 * @param queryVector The query vector to compare against all vectors
 * @param vectors Array of vectors to compare against
 * @param distanceFunction The distance function to use
 * @returns Promise resolving to array of distances
 */
export async function calculateDistancesWithGPU(
  queryVector: Vector,
  vectors: Vector[],
  distanceFunction: DistanceFunction = euclideanDistance
): Promise<number[]> {
  // For small batches, use the standard distance function
  if (vectors.length < 10) {
    return vectors.map(vector => distanceFunction(queryVector, vector))
  }

  try {
    // Function to be executed in a worker thread
    const distanceCalculator = async (
      args: {
        queryVector: Vector,
        vectors: Vector[],
        distanceFnString: string
      }
    ) => {
      const { queryVector, vectors, distanceFnString } = args

      // Try to use TensorFlow.js with GPU acceleration if available
      const useTensorFlow = async () => {
        try {
          // TensorFlow.js will use its default EPSILON value

          // Dynamically import TensorFlow.js core module and backends
          const tf = await import('@tensorflow/tfjs-core')

          // Import CPU backend as fallback
          await import('@tensorflow/tfjs-backend-cpu')

          let usingGPU = false

          try {
            // Try to import and use WebGL backend (GPU)
            await import('@tensorflow/tfjs-backend-webgl')

            // Check if WebGL is available and set it as the backend
            if (await tf.findBackend('webgl') || await tf.ready().then(() => tf.findBackend('webgl'))) {
              await tf.setBackend('webgl')
              usingGPU = true
            } else {
              await tf.setBackend('cpu')
            }
          } catch (err) {
            // If WebGL fails, use CPU
            await tf.setBackend('cpu')
          }

          // Convert vectors to tensors
          const queryTensor = tf.tensor2d([queryVector])
          const vectorsTensor = tf.tensor2d(vectors)

          let distances: number[]

          // Calculate distances based on the distance function type
          if (distanceFnString.includes('euclideanDistance')) {
            // Euclidean distance using GPU-optimized operations
            // Formula: sqrt(sum((a - b)^2))
            const expanded = tf.sub((queryTensor as any).expandDims(1), (vectorsTensor as any).expandDims(0))
            const squaredDiff = tf.square(expanded)
            const sumSquaredDiff = tf.sum(squaredDiff, -1)
            const distancesTensor = tf.sqrt(sumSquaredDiff)
            distances = await (distancesTensor as any).squeeze().array() as number[]

            // Clean up tensors
            queryTensor.dispose()
            vectorsTensor.dispose()
            expanded.dispose()
            squaredDiff.dispose()
            sumSquaredDiff.dispose()
            distancesTensor.dispose()
          } else if (distanceFnString.includes('cosineDistance')) {
            // Cosine distance using GPU-optimized operations
            // Formula: 1 - (a·b / (||a|| * ||b||))
            const dotProduct = tf.matMul(queryTensor, (vectorsTensor as any).transpose())

            const queryNorm = tf.norm(queryTensor, 2, 1)
            const vectorsNorm = tf.norm(vectorsTensor, 2, 1)

            const normProduct = tf.outerProduct(queryNorm as any, vectorsNorm as any)
            const cosineSimilarity = tf.div(dotProduct, normProduct)
            const distancesTensor = tf.sub(tf.scalar(1), cosineSimilarity)

            distances = await (distancesTensor as any).squeeze().array() as number[]

            // Clean up tensors
            queryTensor.dispose()
            vectorsTensor.dispose()
            dotProduct.dispose()
            queryNorm.dispose()
            vectorsNorm.dispose()
            normProduct.dispose()
            cosineSimilarity.dispose()
            distancesTensor.dispose()
          } else if (distanceFnString.includes('manhattanDistance')) {
            // Manhattan distance using GPU-optimized operations
            // Formula: sum(|a - b|)
            const diff = tf.sub((queryTensor as any).expandDims(1), (vectorsTensor as any).expandDims(0))
            const absDiff = tf.abs(diff)
            const distancesTensor = tf.sum(absDiff, -1)

            distances = await (distancesTensor as any).squeeze().array() as number[]

            // Clean up tensors
            queryTensor.dispose()
            vectorsTensor.dispose()
            diff.dispose()
            absDiff.dispose()
            distancesTensor.dispose()
          } else if (distanceFnString.includes('dotProductDistance')) {
            // Dot product distance using GPU-optimized operations
            // Formula: -sum(a * b)
            const dotProduct = tf.matMul(queryTensor, (vectorsTensor as any).transpose())
            const distancesTensor = tf.neg(dotProduct)

            distances = await (distancesTensor as any).squeeze().array() as number[]

            // Clean up tensors
            queryTensor.dispose()
            vectorsTensor.dispose()
            dotProduct.dispose()
            distancesTensor.dispose()
          } else {
            // For unknown distance functions, fall back to CPU implementation
            throw new Error('Unsupported distance function for GPU acceleration')
          }

          return {
            distances,
            usingGPU
          }
        } catch (error) {
          // If TensorFlow.js fails, fall back to CPU implementation
          throw error
        }
      }

      // Try to use TensorFlow.js with GPU acceleration
      try {
        return await useTensorFlow()
      } catch (error) {
        // Fall back to CPU implementation if TensorFlow.js fails
        // Recreate the distance function from its string representation
        const distanceFunction = new Function('return ' + distanceFnString)() as DistanceFunction

        // Calculate distances for all vectors
        const distances = vectors.map(vector => distanceFunction(queryVector, vector))

        return {
          distances,
          usingGPU: false
        }
      }
    }

    // Execute the distance calculation in a separate thread if threading is available
    if (isThreadingAvailable()) {
      try {
        // Convert the distance function to a string for serialization
        const distanceFnString = distanceFunction.toString()

        // Execute in a separate thread
        const result = await executeInThread<{ distances: number[], usingGPU: boolean }>(
          distanceCalculator.toString(),
          { queryVector, vectors, distanceFnString }
        )

        return result.distances
      } catch (error) {
        // Fall back to main thread if threading fails
        console.warn('Threaded distance calculation failed, falling back to main thread:', error)
      }
    }

    // If threading is not available or failed, calculate distances in the main thread
    return vectors.map(vector => distanceFunction(queryVector, vector))
  } catch (error) {
    // If anything fails, fall back to the standard distance function
    console.error('GPU-accelerated distance calculation failed:', error)
    return vectors.map(vector => distanceFunction(queryVector, vector))
  }
}
