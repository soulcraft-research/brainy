/**
 * Tests for type utility functions
 * 
 * This test file verifies that the utility functions for accessing noun and verb types
 * work correctly and return the expected values.
 */

import { describe, it, expect } from 'vitest'
import { 
  NounType, 
  VerbType, 
  getNounTypes, 
  getVerbTypes, 
  getNounTypeMap, 
  getVerbTypeMap 
} from '../src/index.js'

describe('Type Utility Functions', () => {
  describe('getNounTypes', () => {
    it('should return an array of all noun types', () => {
      const nounTypes = getNounTypes()
      
      // Check that the result is an array
      expect(Array.isArray(nounTypes)).toBe(true)
      
      // Check that it contains all the expected values
      expect(nounTypes).toContain(NounType.Person)
      expect(nounTypes).toContain(NounType.Organization)
      expect(nounTypes).toContain(NounType.Location)
      expect(nounTypes).toContain(NounType.Thing)
      expect(nounTypes).toContain(NounType.Concept)
      
      // Check that the length matches the number of properties in NounType
      expect(nounTypes.length).toBe(Object.keys(NounType).length)
    })
  })
  
  describe('getVerbTypes', () => {
    it('should return an array of all verb types', () => {
      const verbTypes = getVerbTypes()
      
      // Check that the result is an array
      expect(Array.isArray(verbTypes)).toBe(true)
      
      // Check that it contains some expected values
      expect(verbTypes).toContain(VerbType.RelatedTo)
      expect(verbTypes).toContain(VerbType.Contains)
      expect(verbTypes).toContain(VerbType.PartOf)
      expect(verbTypes).toContain(VerbType.LocatedAt)
      expect(verbTypes).toContain(VerbType.References)
      
      // Check that the length matches the number of properties in VerbType
      expect(verbTypes.length).toBe(Object.keys(VerbType).length)
    })
  })
  
  describe('getNounTypeMap', () => {
    it('should return a map of all noun type keys to values', () => {
      const nounTypeMap = getNounTypeMap()
      
      // Check that the result is an object
      expect(typeof nounTypeMap).toBe('object')
      
      // Check that it contains all the expected keys and values
      expect(nounTypeMap.Person).toBe(NounType.Person)
      expect(nounTypeMap.Organization).toBe(NounType.Organization)
      expect(nounTypeMap.Location).toBe(NounType.Location)
      expect(nounTypeMap.Thing).toBe(NounType.Thing)
      expect(nounTypeMap.Concept).toBe(NounType.Concept)
      
      // Check that the number of keys matches the number of properties in NounType
      expect(Object.keys(nounTypeMap).length).toBe(Object.keys(NounType).length)
    })
  })
  
  describe('getVerbTypeMap', () => {
    it('should return a map of all verb type keys to values', () => {
      const verbTypeMap = getVerbTypeMap()
      
      // Check that the result is an object
      expect(typeof verbTypeMap).toBe('object')
      
      // Check that it contains all the expected keys and values
      expect(verbTypeMap.RelatedTo).toBe(VerbType.RelatedTo)
      expect(verbTypeMap.Contains).toBe(VerbType.Contains)
      expect(verbTypeMap.PartOf).toBe(VerbType.PartOf)
      expect(verbTypeMap.LocatedAt).toBe(VerbType.LocatedAt)
      expect(verbTypeMap.References).toBe(VerbType.References)
      
      // Check that the number of keys matches the number of properties in VerbType
      expect(Object.keys(verbTypeMap).length).toBe(Object.keys(VerbType).length)
    })
  })
})
