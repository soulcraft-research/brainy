/**
 * Cross-platform crypto utilities
 * Provides hashing functions that work in both Node.js and browser environments
 */

/**
 * Simple string hash function that works in all environments
 * Uses djb2 algorithm - fast and good distribution
 * @param str - String to hash
 * @returns Positive integer hash
 */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) + hash) + char // hash * 33 + char
  }
  // Ensure positive number
  return Math.abs(hash)
}

/**
 * Alternative: FNV-1a hash algorithm
 * Good distribution and fast
 * @param str - String to hash
 * @returns Positive integer hash
 */
export function fnv1aHash(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash
}

/**
 * Generate a deterministic hash for partitioning
 * Uses the most appropriate algorithm for the environment
 * @param input - Input string to hash
 * @returns Positive integer hash suitable for modulo operations
 */
export function getPartitionHash(input: string): number {
  // Use djb2 by default as it's fast and has good distribution
  // This ensures consistent partitioning across all environments
  return hashString(input)
}