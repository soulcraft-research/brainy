/**
 * Utility functions for processing JSON documents for vectorization and search
 */

/**
 * Extracts text from a JSON object for vectorization
 * This function recursively processes the JSON object and extracts text from all fields
 * It can also prioritize specific fields if provided
 * 
 * @param jsonObject The JSON object to extract text from
 * @param options Configuration options for text extraction
 * @returns A string containing the extracted text
 */
export function extractTextFromJson(
  jsonObject: any,
  options: {
    priorityFields?: string[] // Fields to prioritize (will be repeated for emphasis)
    excludeFields?: string[] // Fields to exclude from extraction
    includeFieldNames?: boolean // Whether to include field names in the extracted text
    maxDepth?: number // Maximum depth to recurse into nested objects
    currentDepth?: number // Current recursion depth (internal use)
    fieldPath?: string[] // Current field path (internal use)
  } = {}
): string {
  // Set default options
  const {
    priorityFields = [],
    excludeFields = [],
    includeFieldNames = true,
    maxDepth = 5,
    currentDepth = 0,
    fieldPath = []
  } = options

  // If input is not an object or array, or we've reached max depth, return as string
  if (
    jsonObject === null ||
    jsonObject === undefined ||
    typeof jsonObject !== 'object' ||
    currentDepth >= maxDepth
  ) {
    return String(jsonObject || '')
  }

  const extractedText: string[] = []
  const priorityText: string[] = []

  // Process arrays
  if (Array.isArray(jsonObject)) {
    for (let i = 0; i < jsonObject.length; i++) {
      const value = jsonObject[i]
      const newPath = [...fieldPath, i.toString()]
      
      // Recursively extract text from array items
      const itemText = extractTextFromJson(value, {
        priorityFields,
        excludeFields,
        includeFieldNames,
        maxDepth,
        currentDepth: currentDepth + 1,
        fieldPath: newPath
      })
      
      if (itemText) {
        extractedText.push(itemText)
      }
    }
  } 
  // Process objects
  else {
    for (const [key, value] of Object.entries(jsonObject)) {
      // Skip excluded fields
      if (excludeFields.includes(key)) {
        continue
      }

      const newPath = [...fieldPath, key]
      const fullPath = newPath.join('.')
      
      // Check if this is a priority field
      const isPriority = priorityFields.some(field => {
        // Exact match
        if (field === key) return true
        // Path match
        if (field === fullPath) return true
        // Wildcard match (e.g., "user.*" matches "user.name", "user.email", etc.)
        if (field.endsWith('.*') && fullPath.startsWith(field.slice(0, -2))) return true
        return false
      })

      // Get the field value as text
      let fieldText: string
      
      if (typeof value === 'object' && value !== null) {
        // Recursively extract text from nested objects
        fieldText = extractTextFromJson(value, {
          priorityFields,
          excludeFields,
          includeFieldNames,
          maxDepth,
          currentDepth: currentDepth + 1,
          fieldPath: newPath
        })
      } else {
        fieldText = String(value || '')
      }

      // Add field name if requested
      if (includeFieldNames && fieldText) {
        fieldText = `${key}: ${fieldText}`
      }

      // Add to appropriate collection
      if (fieldText) {
        if (isPriority) {
          priorityText.push(fieldText)
        } else {
          extractedText.push(fieldText)
        }
      }
    }
  }

  // Combine priority text (repeated for emphasis) and regular text
  return [...priorityText, ...priorityText, ...extractedText].join(' ')
}

/**
 * Prepares a JSON document for vectorization
 * This function extracts text from the JSON document and formats it for optimal vectorization
 * 
 * @param jsonDocument The JSON document to prepare
 * @param options Configuration options for preparation
 * @returns A string ready for vectorization
 */
export function prepareJsonForVectorization(
  jsonDocument: any,
  options: {
    priorityFields?: string[]
    excludeFields?: string[]
    includeFieldNames?: boolean
    maxDepth?: number
  } = {}
): string {
  // If input is a string, try to parse it as JSON
  let document = jsonDocument
  if (typeof jsonDocument === 'string') {
    try {
      document = JSON.parse(jsonDocument)
    } catch (e) {
      // If parsing fails, treat it as a plain string
      return jsonDocument
    }
  }

  // If not an object after parsing, return as is
  if (typeof document !== 'object' || document === null) {
    return String(document || '')
  }

  // Extract text from the document
  return extractTextFromJson(document, options)
}

/**
 * Extracts text from a specific field in a JSON document
 * This is useful for searching within specific fields
 * 
 * @param jsonDocument The JSON document to extract from
 * @param fieldPath The path to the field (e.g., "user.name" or "addresses[0].city")
 * @returns The extracted text or empty string if field not found
 */
export function extractFieldFromJson(
  jsonDocument: any,
  fieldPath: string
): string {
  // If input is a string, try to parse it as JSON
  let document = jsonDocument
  if (typeof jsonDocument === 'string') {
    try {
      document = JSON.parse(jsonDocument)
    } catch (e) {
      // If parsing fails, return empty string
      return ''
    }
  }

  // If not an object after parsing, return empty string
  if (typeof document !== 'object' || document === null) {
    return ''
  }

  // Parse the field path
  const parts = fieldPath.split('.')
  let current = document

  // Navigate through the path
  for (const part of parts) {
    // Handle array indexing (e.g., "addresses[0]")
    const match = part.match(/^([^[]+)(?:\[(\d+)\])?$/)
    if (!match) {
      return ''
    }

    const [, key, indexStr] = match
    
    // Move to the next level
    current = current[key]
    
    // If we have an array index, access that element
    if (indexStr !== undefined && Array.isArray(current)) {
      const index = parseInt(indexStr, 10)
      current = current[index]
    }

    // If we've reached a null or undefined value, return empty string
    if (current === null || current === undefined) {
      return ''
    }
  }

  // Convert the final value to string
  return typeof current === 'object' 
    ? JSON.stringify(current) 
    : String(current)
}
