/**
 * Type Utilities Example
 * 
 * This example demonstrates how to use the Brainy library's type utility functions
 * to access lists of noun and verb types at runtime.
 */

import { 
  NounType, 
  VerbType, 
  getNounTypes, 
  getVerbTypes, 
  getNounTypeMap, 
  getVerbTypeMap 
} from '@soulcraft/brainy'

/**
 * Example function that demonstrates how to get and use noun types
 */
function demonstrateNounTypes(): void {
  // Get a list of all noun types
  console.log('=== All Noun Types ===')
  const nounTypes = getNounTypes()
  console.log(nounTypes)
  console.log(`Total noun types: ${nounTypes.length}`)
  
  // Get a map of noun type keys to values
  console.log('\n=== Noun Type Map ===')
  const nounTypeMap = getNounTypeMap()
  console.log(nounTypeMap)
  
  // Using specific noun types
  console.log('\n=== Using Specific Noun Types ===')
  console.log(`Person noun type: ${NounType.Person}`)
  console.log(`Organization noun type: ${NounType.Organization}`)
  console.log(`Location noun type: ${NounType.Location}`)
  
  // Checking if a value is a valid noun type
  console.log('\n=== Checking Valid Noun Types ===')
  const isValidNounType = (value: string): boolean => nounTypes.includes(value)
  console.log(`Is 'person' a valid noun type? ${isValidNounType('person')}`)
  console.log(`Is 'invalid' a valid noun type? ${isValidNounType('invalid')}`)
  
  // Getting the key for a noun type value
  console.log('\n=== Getting Noun Type Keys ===')
  const getNounTypeKey = (value: string): string | null => {
    for (const [key, val] of Object.entries(nounTypeMap)) {
      if (val === value) return key
    }
    return null
  }
  console.log(`Key for 'person' noun type: ${getNounTypeKey('person')}`)
  console.log(`Key for 'organization' noun type: ${getNounTypeKey('organization')}`)
}

/**
 * Example function that demonstrates how to get and use verb types
 */
function demonstrateVerbTypes(): void {
  // Get a list of all verb types
  console.log('\n=== All Verb Types ===')
  const verbTypes = getVerbTypes()
  console.log(verbTypes)
  console.log(`Total verb types: ${verbTypes.length}`)
  
  // Get a map of verb type keys to values
  console.log('\n=== Verb Type Map ===')
  const verbTypeMap = getVerbTypeMap()
  console.log(verbTypeMap)
  
  // Using specific verb types
  console.log('\n=== Using Specific Verb Types ===')
  console.log(`RelatedTo verb type: ${VerbType.RelatedTo}`)
  console.log(`Contains verb type: ${VerbType.Contains}`)
  console.log(`PartOf verb type: ${VerbType.PartOf}`)
  
  // Checking if a value is a valid verb type
  console.log('\n=== Checking Valid Verb Types ===')
  const isValidVerbType = (value: string): boolean => verbTypes.includes(value)
  console.log(`Is 'contains' a valid verb type? ${isValidVerbType('contains')}`)
  console.log(`Is 'invalid' a valid verb type? ${isValidVerbType('invalid')}`)
  
  // Getting the key for a verb type value
  console.log('\n=== Getting Verb Type Keys ===')
  const getVerbTypeKey = (value: string): string | null => {
    for (const [key, val] of Object.entries(verbTypeMap)) {
      if (val === value) return key
    }
    return null
  }
  console.log(`Key for 'contains' verb type: ${getVerbTypeKey('contains')}`)
  console.log(`Key for 'partOf' verb type: ${getVerbTypeKey('partOf')}`)
}

/**
 * Main function to run the example
 */
function main(): void {
  console.log('BRAINY TYPE UTILITIES EXAMPLE')
  console.log('=============================')
  
  demonstrateNounTypes()
  demonstrateVerbTypes()
  
  console.log('\nExample completed!')
}

// Run the example
main()
