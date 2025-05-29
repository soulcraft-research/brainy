/**
 * Distance functions for vector similarity calculations
 */

import { DistanceFunction, Vector } from '../coreTypes.ts'

/**
 * Calculates the Euclidean distance between two vectors
 * Lower values indicate higher similarity
 */
export const euclideanDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

/**
 * Calculates the cosine distance between two vectors
 * Lower values indicate higher similarity
 * Range: 0 (identical) to 2 (opposite)
 */
export const cosineDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

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
 */
export const manhattanDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i])
  }

  return sum
}

/**
 * Calculates the dot product similarity between two vectors
 * Higher values indicate higher similarity
 * Converted to a distance metric (lower is better)
 */
export const dotProductDistance: DistanceFunction = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions')
  }

  let dotProduct = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
  }

  // Convert to a distance metric (lower is better)
  return -dotProduct
}
