/**
 * Types for pagination and filtering in data retrieval operations
 */

/**
 * Pagination options for data retrieval
 */
export interface PaginationOptions {
  /**
   * The number of items to skip (for offset-based pagination)
   */
  offset?: number;
  
  /**
   * The maximum number of items to return
   */
  limit?: number;
  
  /**
   * Token for cursor-based pagination (for continuing from a previous page)
   */
  cursor?: string;
}

/**
 * Filter options for noun retrieval
 */
export interface NounFilterOptions {
  /**
   * Filter by noun type
   */
  nounType?: string | string[];
  
  /**
   * Filter by service
   */
  service?: string | string[];
  
  /**
   * Filter by metadata fields (key-value pairs)
   */
  metadata?: Record<string, any>;
  
  /**
   * Filter by creation date range
   */
  createdAt?: {
    from?: Date | number;
    to?: Date | number;
  };
  
  /**
   * Filter by update date range
   */
  updatedAt?: {
    from?: Date | number;
    to?: Date | number;
  };
}

/**
 * Filter options for verb retrieval
 */
export interface VerbFilterOptions {
  /**
   * Filter by verb type
   */
  verbType?: string | string[];
  
  /**
   * Filter by source noun ID
   */
  sourceId?: string | string[];
  
  /**
   * Filter by target noun ID
   */
  targetId?: string | string[];
  
  /**
   * Filter by service
   */
  service?: string | string[];
  
  /**
   * Filter by metadata fields (key-value pairs)
   */
  metadata?: Record<string, any>;
  
  /**
   * Filter by creation date range
   */
  createdAt?: {
    from?: Date | number;
    to?: Date | number;
  };
  
  /**
   * Filter by update date range
   */
  updatedAt?: {
    from?: Date | number;
    to?: Date | number;
  };
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  /**
   * The items for the current page
   */
  items: T[];
  
  /**
   * The total number of items matching the query (may be estimated)
   */
  totalCount?: number;
  
  /**
   * Whether there are more items available
   */
  hasMore: boolean;
  
  /**
   * Cursor for fetching the next page (for cursor-based pagination)
   */
  nextCursor?: string;
}
