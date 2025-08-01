# JSON Document Search Guide

## Overview

This guide explains how Brainy handles JSON document vectorization and search, including recent improvements to address issues with searching for specific fields within JSON documents.

## How JSON Documents Are Vectorized

When adding a JSON document to Brainy, the document is processed as follows:

1. **Before the improvements**: The entire JSON document was converted to a string using `JSON.stringify()` before being vectorized. This approach had limitations:
   - Field names and structure were lost in the vectorization process
   - Nested fields were not given special attention
   - Important fields like company names in nested objects might not be properly represented in the vector

2. **After the improvements**: JSON documents are now processed with special handling:
   - The document structure is preserved during vectorization
   - Important fields (like names, titles, companies) are prioritized
   - Field names are included in the text representation to improve context
   - Nested fields are properly extracted and included in the vectorization

## Searching Within JSON Documents

The search functionality has been enhanced to provide better results when searching for content within JSON documents:

### Standard Search

When performing a standard search with a text query, Brainy will now:
- Process the query text to create a vector representation
- Find documents with similar vector representations
- Return results ranked by similarity

### Field-Specific Search

You can now search within specific fields of JSON documents:

```javascript
// Search for "Acme Corporation" specifically within the "company" field
const results = await brainyData.search({ searchTerm: "Acme Corporation" }, 10, {
  searchField: "company"
});

// Search within nested fields using dot notation
const results = await brainyData.search({ searchTerm: "John Smith" }, 10, {
  searchField: "person.name"
});
```

### Prioritizing Fields

You can prioritize certain fields during search to improve relevance:

```javascript
// Search with priority given to company and name fields
const results = await brainyData.search("Acme", 10, {
  priorityFields: ["company", "name", "organization"]
});
```

## How This Affects Search Results

These improvements address the issue where searching for an exact company name in a nested field might not return the expected result:

1. **Better representation**: JSON documents are now represented in a way that preserves the importance of key fields like company names
2. **Field-specific searching**: You can now target specific fields in your search queries
3. **Prioritized fields**: Important fields can be given more weight in the vectorization process

## Example: Searching for Company Names

Before the improvements, searching for a company name that was nested in a JSON document might not return the expected results because:
- The company name was just one small part of the entire JSON string
- The vectorization process didn't give special attention to company names
- The structure of the document was lost in the string representation

With the new implementation:
- Company names can be specifically targeted using the `searchField` option
- Company-related fields can be prioritized using the `priorityFields` option
- The structure of the document is preserved during vectorization

## Implementation Details

The improvements are implemented through two main components:

1. **JSON Processing Utilities**: New utility functions in `src/utils/jsonProcessing.ts`:
   - `extractTextFromJson`: Recursively processes JSON objects to extract text
   - `prepareJsonForVectorization`: Prepares JSON documents for optimal vectorization
   - `extractFieldFromJson`: Extracts text from specific fields in JSON documents

2. **Enhanced BrainyData Methods**:
   - The `add` method now uses special processing for JSON objects
   - The `search` method supports field-specific searching and field prioritization

## Best Practices

For optimal search results with JSON documents:

1. **Structure your data consistently**: Use consistent field names for important information
2. **Use descriptive field names**: Field names are included in the vectorization
3. **For company searches**: Use the `searchField` option to target specific fields
4. **Prioritize important fields**: Use the `priorityFields` option to emphasize key fields

## Field Name Discovery and Standardization

When working with multiple data sources (like GitHub, Bluesky, Google, Reddit, etc.), each service might use different field names for similar data. Brainy now provides features to help you understand what fields are available and standardize searches across different services.

### Discovering Available Field Names

You can now see what fields are available for searching from different services:

```javascript
// Get all available field names organized by service
const fieldNames = await brainyData.getAvailableFieldNames();

// Example output:
// {
//   "github": ["repository.name", "repository.description", "user.login", "issue.title", ...],
//   "bluesky": ["post.text", "user.handle", "user.displayName", ...],
//   "reddit": ["title", "selftext", "author.name", "subreddit.name", ...]
// }
```

This helps you understand what fields are available for searching when using the `searchField` option.

### Standard Field Mappings

Brainy automatically maps common field names to standard fields. For example, fields like "title", "name", "headline" from different services are mapped to a standard "title" field. You can see these mappings:

```javascript
// Get standard field mappings
const standardFieldMappings = await brainyData.getStandardFieldMappings();

// Example output:
// {
//   "title": {
//     "github": ["repository.name", "issue.title"],
//     "bluesky": ["post.title", "user.displayName"],
//     "reddit": ["title"]
//   },
//   "description": {
//     "github": ["repository.description", "issue.body"],
//     "bluesky": ["post.text"],
//     "reddit": ["selftext"]
//   },
//   ...
// }
```

### Searching Using Standard Fields

You can now search across multiple services using standard field names:

```javascript
// Search for "climate change" in the "title" field across all services
const results = await brainyData.searchByStandardField("title", "climate change", 10);

// Search in the "author" field but only in GitHub and Reddit
const authorResults = await brainyData.searchByStandardField("author", "johndoe", 10, {
  services: ["github", "reddit"]
});
```

This allows you to search consistently across different data sources without needing to know the specific field names used by each service.

## Conclusion

The improved JSON document handling in Brainy addresses the issue where searching for exact company names in nested fields might not return expected results. By preserving document structure, prioritizing important fields, and enabling field-specific searches, Brainy now provides more accurate and relevant search results for JSON documents.

Additionally, the new field name discovery and standardization features make it easier to work with data from multiple sources, allowing users to understand what fields are available for searching and to search consistently across different services using standard field names.
