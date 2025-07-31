/**
 * Type Utilities Example
 * 
 * This example demonstrates how to use the Brainy library's type utility functions
 * to access lists of noun and verb types at runtime.
 */

/* eslint-disable no-console */

// Import the Brainy library
import { 
  NounType, 
  VerbType, 
  getNounTypes, 
  getVerbTypes, 
  getNounTypeMap, 
  getVerbTypeMap 
} from '@soulcraft/brainy'

// Example 1: Get a list of all noun types
console.log('=== All Noun Types ===')
const nounTypes = getNounTypes()
console.log(nounTypes)
console.log(`Total noun types: ${nounTypes.length}`)
console.log('\n')

// Example 2: Get a list of all verb types
console.log('=== All Verb Types ===')
const verbTypes = getVerbTypes()
console.log(verbTypes)
console.log(`Total verb types: ${verbTypes.length}`)
console.log('\n')

// Example 3: Get a map of noun type keys to values
console.log('=== Noun Type Map ===')
const nounTypeMap = getNounTypeMap()
console.log(nounTypeMap)
console.log('\n')

// Example 4: Get a map of verb type keys to values
console.log('=== Verb Type Map ===')
const verbTypeMap = getVerbTypeMap()
console.log(verbTypeMap)
console.log('\n')

// Example 5: Using specific noun types
console.log('=== Using Specific Noun Types ===')
console.log(`Person noun type: ${NounType.Person}`)
console.log(`Organization noun type: ${NounType.Organization}`)
console.log(`Location noun type: ${NounType.Location}`)
console.log('\n')

// Example 6: Using specific verb types
console.log('=== Using Specific Verb Types ===')
console.log(`RelatedTo verb type: ${VerbType.RelatedTo}`)
console.log(`Contains verb type: ${VerbType.Contains}`)
console.log(`PartOf verb type: ${VerbType.PartOf}`)
console.log('\n')

// Example 7: Checking if a value is a valid noun type
console.log('=== Checking Valid Noun Types ===')
const isValidNounType = (value) => nounTypes.includes(value)
console.log(`Is 'person' a valid noun type? ${isValidNounType('person')}`)
console.log(`Is 'invalid' a valid noun type? ${isValidNounType('invalid')}`)
console.log('\n')

// Example 8: Checking if a value is a valid verb type
console.log('=== Checking Valid Verb Types ===')
const isValidVerbType = (value) => verbTypes.includes(value)
console.log(`Is 'contains' a valid verb type? ${isValidVerbType('contains')}`)
console.log(`Is 'invalid' a valid verb type? ${isValidVerbType('invalid')}`)
console.log('\n')

// Example 9: Getting the key for a noun type value
console.log('=== Getting Noun Type Keys ===')
const getNounTypeKey = (value) => {
  for (const [key, val] of Object.entries(nounTypeMap)) {
    if (val === value) return key
  }
  return null
}
console.log(`Key for 'person' noun type: ${getNounTypeKey('person')}`)
console.log(`Key for 'organization' noun type: ${getNounTypeKey('organization')}`)
console.log('\n')

// Example 10: Getting the key for a verb type value
console.log('=== Getting Verb Type Keys ===')
const getVerbTypeKey = (value) => {
  for (const [key, val] of Object.entries(verbTypeMap)) {
    if (val === value) return key
  }
  return null
}
console.log(`Key for 'contains' verb type: ${getVerbTypeKey('contains')}`)
console.log(`Key for 'partOf' verb type: ${getVerbTypeKey('partOf')}`)
