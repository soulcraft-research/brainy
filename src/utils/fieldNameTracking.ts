/**
 * Utility functions for tracking and managing field names in JSON documents
 */

/**
 * Extracts field names from a JSON document
 * @param jsonObject The JSON object to extract field names from
 * @param options Configuration options
 * @returns An array of field paths (e.g., "user.name", "addresses[0].city")
 */
export function extractFieldNamesFromJson(
  jsonObject: any,
  options: {
    maxDepth?: number
    currentDepth?: number
    currentPath?: string
    fieldNames?: Set<string>
  } = {}
): string[] {
  const {
    maxDepth = 5,
    currentDepth = 0,
    currentPath = '',
    fieldNames = new Set<string>()
  } = options
  
  if (
    jsonObject === null ||
    jsonObject === undefined ||
    typeof jsonObject !== 'object' ||
    currentDepth >= maxDepth
  ) {
    return Array.from(fieldNames)
  }
  
  if (Array.isArray(jsonObject)) {
    // For arrays, we'll just check the first item to avoid explosion of paths
    if (jsonObject.length > 0) {
      const arrayPath = currentPath ? `${currentPath}[0]` : '[0]'
      extractFieldNamesFromJson(jsonObject[0], {
        maxDepth,
        currentDepth: currentDepth + 1,
        currentPath: arrayPath,
        fieldNames
      })
    }
  } else {
    // For objects, process each property
    for (const key of Object.keys(jsonObject)) {
      const value = jsonObject[key]
      const fieldPath = currentPath ? `${currentPath}.${key}` : key
      
      // Add this field path
      fieldNames.add(fieldPath)
      
      // Recursively process nested objects
      if (typeof value === 'object' && value !== null) {
        extractFieldNamesFromJson(value, {
          maxDepth,
          currentDepth: currentDepth + 1,
          currentPath: fieldPath,
          fieldNames
        })
      }
    }
  }
  
  return Array.from(fieldNames)
}

/**
 * Maps field names to standard field names based on common patterns
 * @param fieldName The field name to map
 * @returns The standard field name if a match is found, or null if no match
 */
export function mapToStandardField(fieldName: string): string | null {
  // Standard field mappings
  const standardMappings: Record<string, string[]> = {
    'title': ['title', 'name', 'headline', 'subject'],
    'description': ['description', 'summary', 'content', 'text', 'body'],
    'author': ['author', 'creator', 'user', 'owner', 'by'],
    'date': ['date', 'created', 'createdAt', 'timestamp', 'published'],
    'url': ['url', 'link', 'href', 'source'],
    'image': ['image', 'thumbnail', 'photo', 'picture'],
    'tags': ['tags', 'categories', 'keywords', 'topics']
  }
  
  // Check for matches
  for (const [standardField, possibleMatches] of Object.entries(standardMappings)) {
    // Exact match
    if (possibleMatches.includes(fieldName)) {
      return standardField
    }
    
    // Path match (e.g., "user.name" matches "name")
    const parts = fieldName.split('.')
    const lastPart = parts[parts.length - 1]
    if (possibleMatches.includes(lastPart)) {
      return standardField
    }
    
    // Array match (e.g., "items[0].name" matches "name")
    if (fieldName.includes('[')) {
      for (const part of parts) {
        const cleanPart = part.split('[')[0]
        if (possibleMatches.includes(cleanPart)) {
          return standardField
        }
      }
    }
  }
  
  return null
}
