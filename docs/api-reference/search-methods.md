# Search Methods API Reference

Complete API documentation for Brainy's search methods with MongoDB-style metadata filtering.

## Overview

Brainy provides powerful search capabilities that combine vector similarity with sophisticated metadata filtering. All search methods support the new `metadata` parameter for advanced filtering using MongoDB-style operators.

## Core Search Methods

### `search(queryVector, k, options)`

**Vector-based search with metadata filtering**

```typescript
async search<T = any>(
  queryVector: Vector | any,
  k: number = 10,
  options: SearchOptions<T> = {}
): Promise<SearchResult<T>[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryVector` | `Vector \| any` | Required | Query vector or data to be embedded |
| `k` | `number` | `10` | Maximum number of results to return |
| `options` | `SearchOptions<T>` | `{}` | Search configuration options |

#### Options

```typescript
interface SearchOptions<T> {
  nounTypes?: string[]           // Filter by entity types
  includeVerbs?: boolean         // Include relationships in results
  searchMode?: 'local' | 'remote' | 'combined'
  metadata?: MetadataFilter      // MongoDB-style metadata filtering 🆕
  service?: string              // Filter by service that created the data
  offset?: number               // Pagination offset
  forceEmbed?: boolean          // Force embedding even if input is a vector
}
```

#### Returns

```typescript
interface SearchResult<T> {
  id: string
  score: number        // Similarity score (0-1, higher = more similar)
  vector: Vector
  metadata: T
  nounType?: string
  createdBy?: any
}
```

#### Example

```javascript
const results = await brainy.search("smartphone", 10, {
  metadata: {
    category: { $in: ["electronics", "mobile"] },
    brand: "Apple",
    price: { $lt: 1000 }
  },
  nounTypes: ["product"],
  includeVerbs: true
})
```

---

### `searchText(query, k, options)`

**Text-based search with automatic embedding**

```typescript
async searchText(
  query: string,
  k: number = 10,
  options: TextSearchOptions = {}
): Promise<SearchResult<T>[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | `string` | Required | Text query to search for |
| `k` | `number` | `10` | Maximum number of results to return |
| `options` | `TextSearchOptions` | `{}` | Search configuration options |

#### Options

```typescript
interface TextSearchOptions {
  nounTypes?: string[]          // Filter by entity types
  includeVerbs?: boolean        // Include relationships in results
  searchMode?: 'local' | 'remote' | 'combined'
  metadata?: MetadataFilter     // MongoDB-style metadata filtering 🆕
}
```

#### Example

```javascript
const results = await brainy.searchText("gaming laptop", 15, {
  metadata: {
    availability: { $in: ["in_stock", "preorder"] },
    price: { $lte: 2000 },
    specs: { $all: ["RTX4060", "16GB RAM"] }
  },
  nounTypes: ["product"]
})
```

---

### `searchByNounTypes(queryVector, k, nounTypes, options)`

**Search within specific entity types with metadata filtering**

```typescript
async searchByNounTypes(
  queryVectorOrData: Vector | any,
  k: number = 10,
  nounTypes: string[] | null = null,
  options: SearchByNounTypesOptions = {}
): Promise<SearchResult<T>[]>
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryVectorOrData` | `Vector \| any` | Required | Query vector or data to be embedded |
| `k` | `number` | `10` | Maximum number of results to return |
| `nounTypes` | `string[] \| null` | `null` | Specific entity types to search within |
| `options` | `SearchByNounTypesOptions` | `{}` | Search configuration options |

#### Options

```typescript
interface SearchByNounTypesOptions {
  forceEmbed?: boolean         // Force embedding even if input is a vector
  service?: string            // Filter by service that created the data
  metadata?: MetadataFilter   // MongoDB-style metadata filtering 🆕
  offset?: number            // Pagination offset
}
```

#### Example

```javascript
const results = await brainy.searchByNounTypes(
  "organic coffee beans",
  20,
  ["product", "food_item"],
  {
    metadata: {
      $and: [
        { certification: "organic" },
        { origin: { $includes: "Ethiopia" } },
        { availability: { $ne: "out_of_stock" } }
      ]
    },
    service: "ecommerce_platform"
  }
)
```

---

## Metadata Filtering

### `MetadataFilter` Interface

The metadata filtering system supports MongoDB-style operators for complex queries:

```typescript
type MetadataFilter = {
  [field: string]: any | {
    // Comparison operators
    $eq?: any
    $ne?: any
    $gt?: number | string | Date
    $gte?: number | string | Date
    $lt?: number | string | Date
    $lte?: number | string | Date
    
    // Array operators
    $in?: any[]
    $nin?: any[]
    $all?: any[]
    $includes?: any
    $size?: number
    
    // String operators
    $regex?: string
    $startsWith?: string
    $endsWith?: string
    $contains?: string
    
    // Existence operators
    $exists?: boolean
    $type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  }
  
  // Logical operators
  $and?: MetadataFilter[]
  $or?: MetadataFilter[]
  $not?: MetadataFilter
  $nor?: MetadataFilter[]
}
```

### Operator Examples

#### Comparison Operators

```javascript
// Equal (implicit)
{ category: "books" }

// Explicit comparison
{ 
  price: { $lte: 50 },
  pages: { $gt: 200 },
  rating: { $ne: null }
}
```

#### Array Operators

```javascript
{
  genres: { $in: ["Fiction", "Mystery", "Thriller"] },  // Has any of these genres
  awards: { $all: ["Hugo", "Nebula"] },                // Has all awards
  chapters: { $size: 12 },                             // Exactly 12 chapters
  tags: { $includes: "bestseller" }                     // Array contains "bestseller"
}
```

#### String Operators

```javascript
{
  isbn: { $regex: "^978-" },                      // ISBN starts with 978
  title: { $startsWith: "The" },                 // Title starts with "The"
  description: { $contains: "adventure" },       // Description contains "adventure"
  publisher: { $endsWith: "Press" }              // Publisher ends with "Press"
}
```

#### Logical Operators

```javascript
{
  $and: [
    { category: "electronics" },
    { warranty: true }
  ],
  $or: [
    { brand: "Apple" },
    { brand: "Samsung" }
  ],
  $not: { status: "discontinued" }
}
```

#### Nested Fields (Dot Notation)

```javascript
{
  "specs.display.size": { $gte: 15 },
  "specs.processor.brand": "Intel",
  "ratings.average": { $gt: 4.5 }
}
```

---

## Advanced Search Options

### Combining Multiple Filters

You can combine `metadata` filtering with other search options:

```javascript
const results = await brainy.search("science textbook", 10, {
  // Entity type filtering
  nounTypes: ["book"],
  
  // Service filtering  
  service: "academic_platform",
  
  // Metadata filtering
  metadata: {
    subject: { $in: ["physics", "chemistry"] },
    format: { $includes: "hardcover" },
    condition: { $ne: "damaged" }
  },
  
  // Include relationships
  includeVerbs: true,
  
  // Pagination
  offset: 20
})
```

### Search Modes

Control how search is performed:

```javascript
const results = await brainy.searchText("cooking recipes", 10, {
  searchMode: "local",     // Search only local data
  // searchMode: "remote",    // Search only remote instances  
  // searchMode: "combined",  // Search local + remote (default)
  
  metadata: {
    cuisine: { $includes: "italian" }
  }
})
```

---

## Performance Considerations

### Index Optimization

Metadata filtering uses automatic indexing for optimal performance:

- **Pre-filtering**: Uses indexes to identify candidates before vector search
- **Automatic maintenance**: Indexes update when data changes
- **Memory efficient**: LRU caching with configurable limits

### Query Performance Tips

1. **Use specific filters first**:
   ```javascript
   // Faster: specific equality
   { category: "books" }
   
   // Slower: negation
   { category: { $ne: "magazines" } }
   ```

2. **Combine filters efficiently**:
   ```javascript
   // Faster: most selective filter first
   {
     isbn: "978-0123456789",       // High selectivity
     genre: { $includes: "mystery" }, // Medium selectivity  
     in_stock: true                 // Low selectivity
   }
   ```

3. **Use appropriate operators**:
   ```javascript
   // For arrays, use array operators
   { genres: { $includes: "mystery" } }   // ✅ Correct
   { genres: "mystery" }                  // ❌ Won't match arrays
   ```

### Index Configuration

Configure indexing behavior:

```javascript
const brainy = new BrainyData({
  metadataIndex: {
    maxIndexSize: 50000,           // Max entries per field+value
    rebuildThreshold: 0.05,        // Rebuild when 5% stale
    autoOptimize: true,            // Auto-cleanup unused entries
    indexedFields: ["category", "brand"],  // Only index specific fields
    excludeFields: ["internal_id", "temp"] // Never index sensitive fields
  }
})
```

---

## Error Handling

### Common Errors

```javascript
try {
  const results = await brainy.search("query", 10, {
    metadata: { level: "senior" }
  })
} catch (error) {
  if (error.message.includes('MetadataIndexError')) {
    // Index-related error
    console.error('Metadata index error:', error)
  } else if (error.message.includes('ValidationError')) {
    // Invalid query format
    console.error('Invalid metadata query:', error)
  } else {
    // Other search errors
    console.error('Search error:', error)
  }
}
```

### Query Validation

Brainy validates metadata queries and provides helpful error messages:

```javascript
// Invalid operator
{ price: { $invalid: 25 } }
// Error: Unknown operator '$invalid'

// Type mismatch
{ pages: { $gt: "not_a_number" } }  
// Error: $gt operator requires number, got string

// Invalid regex
{ title: { $regex: "[invalid" } }
// Error: Invalid regular expression
```

---

## Filter Discovery API (v0.49+)

### getFilterValues(field)

Get all available values for a specific field that can be used in filters:

```javascript
// Get all categories in the database
const categories = await brainy.getFilterValues('category')
// Returns: ['electronics', 'books', 'clothing', 'home', ...]

// Get all brands
const brands = await brainy.getFilterValues('brand')
// Returns: ['apple', 'samsung', 'sony', ...]

// Use discovered values in filters
const results = await brainy.search("products", 10, {
  metadata: {
    category: { $in: categories.slice(0, 3) },  // First 3 categories
    brand: brands[0]                            // Specific brand
  }
})
```

### getFilterFields()

Get all fields that have been indexed and can be used for filtering:

```javascript
// Discover what fields are available
const fields = await brainy.getFilterFields()
// Returns: ['category', 'price', 'brand', 'rating', 'tags', ...]

// Build dynamic filters based on available fields
const filter = {}
if (fields.includes('category')) {
  filter.category = 'electronics'
}
if (fields.includes('price')) {
  filter.price = { $lte: 1000 }
}

const results = await brainy.search("query", 10, { metadata: filter })
```

### Use Cases

1. **Dynamic UI Generation**: Build filter dropdowns from actual data
2. **Data Exploration**: Understand what metadata exists
3. **Validation**: Check if a field exists before filtering
4. **Analytics**: See distribution of values

```javascript
// Build a filter UI dynamically
async function buildFilterUI() {
  const fields = await brainy.getFilterFields()
  
  for (const field of fields) {
    const values = await brainy.getFilterValues(field)
    console.log(`${field}: ${values.length} unique values`)
    
    // Create dropdown/checkbox for each field
    createFilterControl(field, values)
  }
}
```

## Migration Guide

### From Simple Filtering

```javascript
// Before (v0.47.x and earlier)
const results = await brainy.search("laptop", 10, {
  filter: { brand: "Apple" }  // Simple object matching
})

// After (v0.48.x+) - Backward compatible!
const results = await brainy.search("laptop", 10, {
  metadata: { 
    brand: "Apple",                     // Same simple matching
    price: { $lte: 2000 },             // Plus MongoDB operators
    specs: { $includes: "SSD" }         // Plus array operations
  }
})
```

### Automatic Migration

- **No code changes required** - existing searches continue to work
- **Indexes build automatically** - on first startup after upgrade
- **Performance improves gradually** - as indexes populate

---

## Examples by Use Case

### Academic Library

```javascript
// Find advanced textbooks
const textbooks = await brainy.searchText("mathematics textbook", 20, {
  metadata: {
    level: { $in: ["undergraduate", "graduate", "advanced"] },
    subject: { $in: ["calculus", "algebra", "statistics"] },
    format: { $all: ["hardcover", "solutions_manual"] },
    availability: "in_stock"
  }
})

// Find research papers with specific citations
const researchPapers = await brainy.search(queryVector, 15, {
  metadata: {
    citations: { $gte: 10, $lte: 1000 },
    $or: [
      { "author.degree": { $in: ["PhD", "Masters"] } },
      { awards: { $size: { $gte: 1 } } }
    ]
  }
})
```

### E-commerce Platform

```javascript
// Product search with filters
const products = await brainy.searchText("wireless headphones", 25, {
  metadata: {
    category: "electronics",
    price: { $lte: 200 },
    rating: { $gte: 4.0 },
    availability: { $ne: "out_of_stock" },
    features: { $all: ["bluetooth", "noise_canceling"] }
  }
})
```

### Content Management

```javascript
// Find published articles
const articles = await brainy.searchText("climate change", 10, {
  metadata: {
    status: "published",
    publish_date: { $gte: "2023-01-01" },
    author: { $in: ["Dr. Green", "Prof. Earth"] },
    tags: { $includes: "environment" },
    word_count: { $gte: 1000 }
  }
})
```

---

## Performance Monitoring

### Index Statistics

```javascript
// Get index performance metrics
const stats = await brainy.metadataIndex?.getStats()
console.log(`Index entries: ${stats.totalEntries}`)
console.log(`Fields indexed: ${stats.fieldsIndexed}`)
console.log(`Memory usage: ${stats.indexSize} bytes`)
```

### Search Performance

```javascript
// Monitor search performance
const start = Date.now()
const results = await brainy.search("query", 10, {
  metadata: { category: "electronics" }
})
const duration = Date.now() - start
console.log(`Search completed in ${duration}ms`)
console.log(`Found ${results.length} results`)
```

This API reference provides complete documentation for all search methods with metadata filtering. The MongoDB-style operators give you powerful querying capabilities while maintaining high performance through automatic indexing.