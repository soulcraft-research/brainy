/**
 * Brainy Connector Interface - Atomic Age Integration Framework
 * 
 * 🧠 Base interface for all premium connectors in the Quantum Vault
 * ⚛️ Open source interface, implementations are premium-only
 */

export interface ConnectorConfig {
  /** Connector identifier (e.g., 'notion', 'salesforce') */
  connectorId: string
  
  /** Premium license key (required for Quantum Vault connectors) */
  licenseKey: string
  
  /** API credentials for the external service */
  credentials: {
    apiKey?: string
    accessToken?: string
    refreshToken?: string
    clientId?: string
    clientSecret?: string
    [key: string]: any
  }
  
  /** Connector-specific configuration */
  options?: {
    syncInterval?: number    // Minutes between syncs
    batchSize?: number      // Items per batch
    retryAttempts?: number  // Retry failed operations
    [key: string]: any
  }
  
  /** Brainy database instance configuration */
  brainy?: {
    endpoint?: string       // Custom Brainy endpoint
    storage?: string       // Storage type preference
    [key: string]: any
  }
}

export interface SyncResult {
  /** Number of items successfully synced */
  synced: number
  
  /** Number of items that failed to sync */
  failed: number
  
  /** Number of items skipped (duplicates, etc.) */
  skipped: number
  
  /** Total processing time in milliseconds */
  duration: number
  
  /** Sync operation timestamp */
  timestamp: string
  
  /** Error details for failed items */
  errors?: Array<{
    item: string
    error: string
    retryable: boolean
  }>
  
  /** Metadata about the sync operation */
  metadata?: {
    lastSyncId?: string
    nextPageToken?: string
    hasMore?: boolean
    [key: string]: any
  }
}

export interface ConnectorStatus {
  /** Current connector state */
  status: 'connected' | 'disconnected' | 'error' | 'syncing' | 'paused'
  
  /** Human-readable status message */
  message: string
  
  /** Last successful sync timestamp */
  lastSync?: string
  
  /** Next scheduled sync timestamp */
  nextSync?: string
  
  /** Connection health indicators */
  health: {
    apiReachable: boolean
    credentialsValid: boolean
    licenseValid: boolean
    quotaRemaining?: number
  }
  
  /** Usage statistics */
  stats?: {
    totalSyncs: number
    totalItems: number
    averageDuration: number
    errorRate: number
  }
}

/**
 * Base interface for all Brainy premium connectors
 * 
 * Implementations live in the Quantum Vault (brainy-quantum-vault)
 */
export interface IConnector {
  /** Unique connector identifier */
  readonly id: string
  
  /** Human-readable connector name */
  readonly name: string
  
  /** Connector version */
  readonly version: string
  
  /** Supported data types this connector can handle */
  readonly supportedTypes: string[]
  
  /**
   * Initialize the connector with configuration
   */
  initialize(config: ConnectorConfig): Promise<void>
  
  /**
   * Test connection to the external service
   */
  testConnection(): Promise<boolean>
  
  /**
   * Get current connector status and health
   */
  getStatus(): Promise<ConnectorStatus>
  
  /**
   * Start syncing data from the external service
   */
  startSync(): Promise<SyncResult>
  
  /**
   * Stop any ongoing sync operations
   */
  stopSync(): Promise<void>
  
  /**
   * Perform incremental sync (delta changes only)
   */
  incrementalSync(): Promise<SyncResult>
  
  /**
   * Perform full sync (all data)
   */
  fullSync(): Promise<SyncResult>
  
  /**
   * Preview what would be synced without actually syncing
   */
  previewSync(limit?: number): Promise<{
    items: Array<{
      type: string
      title: string
      preview: string
      relationships: string[]
    }>
    totalCount: number
    estimatedDuration: number
  }>
  
  /**
   * Clean up resources and disconnect
   */
  disconnect(): Promise<void>
}