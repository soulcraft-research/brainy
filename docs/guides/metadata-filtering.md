# MongoDB-Style Metadata Filtering 🆕

**Advanced filtering for vector search with MongoDB-style query operators**

Brainy now supports sophisticated metadata filtering using familiar MongoDB query syntax. Filter your search results with complex criteria while maintaining high performance through automatic indexing.

## 🚀 Quick Start

```javascript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.init()

// Add some data with metadata
await brainy.add("Premium Wireless Headphones", { 
  category: "electronics", 
  brand: "Sony", 
  price: 299,
  rating: 4.8,
  features: ["noise_canceling", "bluetooth"]
})

await brainy.add("Budget Bluetooth Speaker", { 
  category: "electronics", 
  brand: "Anker", 
  price: 49,
  rating: 4.2,
  features: ["bluetooth", "waterproof"]
})

// Search with metadata filtering
const results = await brainy.search("audio device", 10, {
  metadata: {
    category: "electronics",
    price: { $lte: 300 },
    features: { $in: ["bluetooth", "wireless"] }
  }
})
```

## 📋 Query Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal (default) | `{ level: "senior" }` or `{ level: { $eq: "senior" } }` |
| `$ne` | Not equal | `{ status: { $ne: "inactive" } }` |
| `$gt` | Greater than | `{ salary: { $gt: 100000 } }` |
| `$gte` | Greater than or equal | `{ experience: { $gte: 5 } }` |
| `$lt` | Less than | `{ age: { $lt: 30 } }` |
| `$lte` | Less than or equal | `{ rating: { $lte: 4.5 } }` |

### Array Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$in` | Value in array | `{ department: { $in: ["engineering", "product"] } }` |
| `$nin` | Value not in array | `{ status: { $nin: ["fired", "inactive"] } }` |
| `$all` | Array contains all values | `{ skills: { $all: ["React", "TypeScript"] } }` |
| `$includes` | Array includes value | `{ tags: { $includes: "featured" } }` |
| `$size` | Array has specific length | `{ projects: { $size: 3 } }` |

### String Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$regex` | Regular expression | `{ email: { $regex: ".*@company\\.com$" } }` |
| `$startsWith` | String starts with | `{ name: { $startsWith: "John" } }` |
| `$endsWith` | String ends with | `{ domain: { $endsWith: ".edu" } }` |
| `$contains` | String contains | `{ bio: { $contains: "machine learning" } }` |

### Existence Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$exists` | Field exists | `{ linkedin: { $exists: true } }` |
| `$type` | Field has specific type | `{ rating: { $type: "number" } }` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$and` | Logical AND (default) | `{ $and: [{ level: "senior" }, { remote: true }] }` |
| `$or` | Logical OR | `{ $or: [{ location: "SF" }, { remote: true }] }` |
| `$not` | Logical NOT | `{ $not: { status: "inactive" } }` |
| `$nor` | Logical NOR | `{ $nor: [{ fired: true }, { resigned: true }] }` |

## 🎯 Real-World Examples

### E-commerce Platform

```javascript
// Find premium electronics in specific price ranges
const premiumProducts = await brainy.search("smartphone", 20, {
  metadata: {
    category: { $in: ["electronics", "mobile", "phones"] },
    brand: { $in: ["Apple", "Samsung", "Google"] },
    price: { $gte: 800 },
    features: { $all: ["5G", "wireless_charging"] },
    availability: { $ne: "out_of_stock" }
  }
})

// Find budget-friendly options
const budgetOptions = await brainy.search("laptop", 15, {
  metadata: {
    $or: [
      { category: "refurbished" },
      { discount: true },
      { price: { $lte: 500 } }
    ],
    rating: { $gte: 4.0 }
  }
})
```

### E-commerce Product Search

```javascript
// Electronics under $500 with good ratings
const products = await brainy.search("laptop computer", 10, {
  metadata: {
    category: "electronics",
    price: { $lte: 500 },
    rating: { $gte: 4.0 },
    availability: { $ne: "out_of_stock" },
    tags: { $includes: "bestseller" }
  }
})
```

### Academic Research

```javascript
// Recent AI papers from top venues
const papers = await brainy.search("machine learning", 25, {
  metadata: {
    type: "academic_paper",
    year: { $gte: 2022 },
    venue: { $in: ["NeurIPS", "ICML", "ICLR", "AAAI"] },
    citations: { $gt: 10 },
    open_access: true
  }
})
```

### Content Management

```javascript
// Published blog posts by specific authors
const posts = await brainy.search("artificial intelligence", 10, {
  metadata: {
    status: "published",
    author: { $in: ["John Smith", "Jane Doe"] },
    publish_date: { $gte: "2023-01-01" },
    tags: { $all: ["AI", "technology"] },
    word_count: { $gte: 1000, $lte: 5000 }
  }
})
```

## 🌳 Nested Fields (Dot Notation)

Access nested object fields using dot notation:

```javascript
await brainy.add("Gaming Laptop", {
  specs: {
    display: { size: 17.3, resolution: "4K" },
    processor: { brand: "Intel", model: "i9-12900H" }
  },
  ratings: { average: 4.8, total_reviews: 342 }
})

// Search using nested fields
const results = await brainy.search("laptop", 5, {
  metadata: {
    "specs.display.size": { $gte: 15 },
    "specs.processor.brand": "Intel",
    "ratings.average": { $gt: 4.5 }
  }
})
```

## 🚀 Performance Features

### Automatic Indexing

- **Zero Configuration**: Indexes are built automatically when you add data
- **Smart Field Selection**: Common fields like `id`, `createdAt`, `updatedAt` are excluded by default
- **Incremental Updates**: Indexes update automatically when data changes
- **Memory Efficient**: LRU caching with automatic cleanup

### Pre-filtering Optimization

Brainy uses metadata indexes to pre-filter candidates before vector search:

```javascript
// This is FAST! Pre-filters using indexes, then searches only matching vectors
const results = await brainy.search("electronics", 10, {
  metadata: { category: "smartphones" }  // Only searches smartphone vectors
})
```

### Index Statistics

Monitor your metadata indexes:

```javascript
const stats = await brainy.metadataIndex.getStats()
console.log(`Index entries: ${stats.totalEntries}`)
console.log(`Fields indexed: ${stats.fieldsIndexed.join(', ')}`)
console.log(`Memory usage: ${stats.indexSize} bytes`)
```

## ⚙️ Configuration Options

Customize metadata indexing behavior:

```javascript
const brainy = new BrainyData({
  metadataIndex: {
    maxIndexSize: 50000,           // Max entries per field+value
    rebuildThreshold: 0.05,        // Rebuild when 5% stale
    autoOptimize: true,            // Auto-cleanup unused entries
    indexedFields: ["category", "brand"],  // Only index these fields
    excludeFields: ["internal_id", "temp"]  // Never index these fields
  }
})
```

## 🔧 Advanced Patterns

### Complex Logical Queries

```javascript
// Find products matching complex criteria
const results = await brainy.search("kitchen appliances", 10, {
  metadata: {
    $and: [
      {
        $or: [
          { brand: "KitchenAid" },
          { warranty_years: { $gte: 2 } }
        ]
      },
      {
        rating: { $gte: 4.0 }
      },
      {
        features: { $all: ["dishwasher_safe", "BPA_free"] }
      },
      {
        $not: { status: "discontinued" }
      }
    ]
  }
})
```

### Dynamic Query Building

```javascript
function buildProductQuery(filters) {
  const query = {}
  
  if (filters.maxPrice) {
    query.price = { $lte: filters.maxPrice }
  }
  
  if (filters.brands?.length) {
    query.brand = { $in: filters.brands }
  }
  
  if (filters.requiredFeatures?.length) {
    query.features = { $all: filters.requiredFeatures }
  }
  
  if (filters.excludeOutOfStock) {
    query.availability = { $ne: "out_of_stock" }
  }
  
  return query
}

// Use dynamic query
const searchQuery = buildProductQuery({
  maxPrice: 1000,
  brands: ["Apple", "Samsung"],
  requiredFeatures: ["5G", "wireless_charging"],
  excludeOutOfStock: true
})

const results = await brainy.search("smartphone", 10, {
  metadata: searchQuery
})
```

## 📈 Best Practices

### 1. Index Strategy
- **Include searchable fields**: Category, brand, price, features
- **Exclude volatile fields**: Last viewed, view count, temporary flags
- **Use consistent naming**: Prefer `snake_case` or `camelCase` consistently

### 2. Query Optimization
- **Use specific filters**: `{ category: "books" }` is faster than `{ category: { $ne: "magazines" } }`
- **Combine with other filters**: Use `nounTypes` and `metadata` together for best performance
- **Avoid regex on large datasets**: Pre-process text fields when possible

### 3. Data Modeling
```javascript
// Good: Structured metadata
await brainy.add("Smartphone", {
  category: "electronics",     // String enum
  price: 899,                  // Number for range queries
  features: ["5G", "wireless"], // Array for $in/$all queries
  in_stock: true,              // Boolean for exact matching
  brand: "Apple"               // String for exact/regex matching
})

// Avoid: Unstructured metadata
await brainy.add("Smartphone", {
  description: "Premium smartphone with 5G and wireless charging features from Apple"
})
```

## 🔄 Migration from Simple Filtering

If you were using basic filtering, upgrading is seamless:

```javascript
// Before (still works!)
const results = await brainy.search("laptop", 10, {
  filter: { category: "electronics" }
})

// After (more powerful!)
const results = await brainy.search("laptop", 10, {
  metadata: { 
    category: "electronics",
    brand: { $in: ["Apple", "Dell"] },
    features: { $includes: "SSD" }
  }
})
```

## 🚨 Common Gotchas

1. **Case Sensitivity**: String matching is case-sensitive by default
   ```javascript
   // Won't match "Electronics" 
   { category: "electronics" }
   
   // Use regex for case-insensitive
   { category: { $regex: "electronics", $options: "i" } }
   ```

2. **Array vs Single Values**: 
   ```javascript
   // If features is ["bluetooth", "wireless"]
   { features: "bluetooth" }           // ❌ Won't match
   { features: { $includes: "bluetooth" } }  // ✅ Matches
   ```

3. **Nested Field Access**:
   ```javascript
   // Use dot notation for nested fields
   { "specs.display": "4K" }  // ✅ Correct
   { specs: { display: "4K" } }  // ❌ Won't work as expected
   ```

## 🔍 Filter Discovery API (v0.49+)

Discover what filters are available in your data:

```javascript
// Get all available values for a field
const categories = await brainy.getFilterValues('category')
console.log('Available categories:', categories)
// Output: ['electronics', 'books', 'clothing', ...]

// Get all filterable fields
const fields = await brainy.getFilterFields()
console.log('Filterable fields:', fields)
// Output: ['category', 'price', 'brand', 'rating', ...]

// Build dynamic filter UI
for (const field of fields) {
  const values = await brainy.getFilterValues(field)
  createDropdown(field, values)
}
```

## 🎉 What's Next?

This powerful filtering system opens up possibilities for:
- **Advanced search UIs** with multiple filter controls
- **Dynamic filter discovery** to build UIs from actual data
- **Personalized recommendations** based on user preferences  
- **Complex business logic** in search applications
- **Multi-tenant filtering** by organization or user

The filtering happens **during the vector search** (not after), ensuring maximum performance even with complex queries!

Ready to build something amazing? Check out the [API Reference](../api-reference/search-methods.md) for complete method signatures and options.