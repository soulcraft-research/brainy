## Recent Changes and Performance Improvements

### Enhanced Memory Management and Scalability

Brainy has been significantly improved to handle larger datasets more efficiently:

- **Pagination Support**: All data retrieval methods now support pagination to avoid loading entire datasets into memory at once. The deprecated `getAllNouns()` and `getAllVerbs()` methods have been replaced with `getNouns()` and `getVerbs()` methods that support pagination, filtering, and cursor-based navigation.

- **Multi-level Caching**: A sophisticated three-level caching strategy has been implemented:
  - **Level 1**: Hot cache (most accessed nodes) - RAM (automatically detecting and adjusting in each environment)
  - **Level 2**: Warm cache (recent nodes) - OPFS, Filesystem or S3 depending on environment
  - **Level 3**: Cold storage (all nodes) - OPFS, Filesystem or S3 depending on environment

- **Adaptive Memory Usage**: The system automatically detects available memory and adjusts cache sizes accordingly:
  - In Node.js: Uses 10% of free memory (minimum 1000 entries)
  - In browsers: Scales based on device memory (500 entries per GB, minimum 1000)

- **Intelligent Cache Eviction**: Implements a Least Recently Used (LRU) policy that evicts the oldest 20% of items when the cache reaches the configured threshold.

- **Prefetching Strategy**: Implements batch prefetching to improve performance while avoiding overwhelming system resources.

### S3-Compatible Storage Improvements

- **Enhanced Cloud Storage**: Improved support for S3-compatible storage services including AWS S3, Cloudflare R2, and others.

- **Optimized Data Access**: Batch operations and error handling for efficient cloud storage access.

- **Change Log Management**: Efficient synchronization through change logs to track updates.

### Data Compatibility

Yes, you can use existing data indexed from an old version. Brainy includes robust data migration capabilities:

- **Vector Regeneration**: If vectors are missing in imported data, they will be automatically created using the embedding function.

- **HNSW Index Reconstruction**: The system can reconstruct the HNSW index from backup data, ensuring compatibility with previous versions.

- **Sparse Data Import**: Support for importing sparse data (without vectors) through the `importSparseData()` method.

### System Requirements

#### Default Mode

- **Memory**: 
  - Minimum: 512MB RAM
  - Recommended: 2GB+ RAM for medium datasets, 8GB+ for large datasets
  
- **CPU**: 
  - Minimum: 2 cores
  - Recommended: 4+ cores for better performance with parallel operations

- **Storage**:
  - Minimum: 1GB available storage
  - Recommended: Storage space at least 3x the size of your dataset

#### Read-Only Mode

Read-only mode prevents all write operations (add, update, delete) and is optimized for search operations.

- **Memory**: 
  - Minimum: 256MB RAM
  - Recommended: 1GB+ RAM
  
- **CPU**: 
  - Minimum: 1 core
  - Recommended: 2+ cores

- **Storage**:
  - Minimum: Storage space equal to the size of your dataset
  - Recommended: 2x the size of your dataset for caching

- **New Feature**: Lazy loading support in read-only mode for improved performance with large datasets.

#### Write-Only Mode

Write-only mode prevents all search operations and is optimized for initial data loading or when you want to optimize for write performance.

- **Memory**: 
  - Minimum: 512MB RAM
  - Recommended: 2GB+ RAM
  
- **CPU**: 
  - Minimum: 2 cores
  - Recommended: 4+ cores for faster data ingestion

- **Storage**:
  - Minimum: Storage space at least 2x the size of your dataset
  - Recommended: 4x the size of your dataset for optimal performance

### Performance Tuning Parameters

Brainy offers several configuration options for performance tuning:

- **Hot Cache Size**: Control the maximum number of items to keep in memory.
- **Eviction Threshold**: Set the threshold at which cache eviction begins (default: 0.8 or 80% of max size).
- **Warm Cache TTL**: Set the time-to-live for items in the warm cache (default: 24 hours).
- **Batch Size**: Control the number of items to process in a single batch for operations like prefetching (default: 10).

#### NEW: Automatic Parameter Tuning

These parameters can now be automatically configured and tuned based on:

- **Environment Detection**: Automatically detects the runtime environment (Node.js, browser, worker) and available resources.
- **Resource Awareness**: Adjusts parameters based on available memory and CPU resources.
- **Usage Statistics**: Analyzes cache hit/miss ratios and operation patterns to optimize parameters.
- **Workload Adaptation**: Tunes parameters differently for read-heavy vs. write-heavy workloads.

Auto-tuning is enabled by default but can be disabled by setting `autoTune: false` in the cache configuration. Manual parameter values will always take precedence over auto-tuned values.

These improvements make Brainy more efficient, scalable, and adaptable to different environments and usage patterns.
