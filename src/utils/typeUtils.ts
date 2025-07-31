/**
 * Type Utilities
 * 
 * This module provides utility functions for working with the Brainy type system,
 * particularly for accessing lists of noun and verb types.
 */

import { NounType, VerbType } from '../types/graphTypes.js'

/**
 * Returns an array of all available noun types
 * 
 * @returns {string[]} Array of all noun type values
 */
export function getNounTypes(): string[] {
  return Object.values(NounType)
}

/**
 * Returns an array of all available verb types
 * 
 * @returns {string[]} Array of all verb type values
 */
export function getVerbTypes(): string[] {
  return Object.values(VerbType)
}

/**
 * Returns a map of noun type keys to their string values
 * 
 * @returns {Record<string, string>} Map of noun type keys to values
 */
export function getNounTypeMap(): Record<string, string> {
  return { ...NounType }
}

/**
 * Returns a map of verb type keys to their string values
 * 
 * @returns {Record<string, string>} Map of verb type keys to values
 */
export function getVerbTypeMap(): Record<string, string> {
  return { ...VerbType }
}
