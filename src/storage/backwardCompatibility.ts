/**
 * Backward Compatibility Layer for Storage Migration
 * 
 * Handles the transition from 'index' to '_system' directory
 * Ensures services running different versions can coexist
 */

import { StatisticsData } from '../coreTypes.js'

export interface MigrationMetadata {
  schemaVersion: number
  migrationStarted?: string
  migrationCompleted?: string
  lastUpdatedBy?: string
}

/**
 * Backward compatibility strategy for directory migration
 */
export class StorageCompatibilityLayer {
  private migrationMetadata: MigrationMetadata | null = null
  
  /**
   * Determines the read strategy based on what's available
   * @returns Priority-ordered list of directories to try
   */
  static getReadPriority(): string[] {
    return ['_system', 'index']  // Try new location first, fallback to old
  }
  
  /**
   * Determines write strategy based on migration state
   * @param migrationComplete Whether migration is complete
   * @returns List of directories to write to
   */
  static getWriteTargets(migrationComplete: boolean = false): string[] {
    if (migrationComplete) {
      return ['_system']  // Only write to new location
    }
    // During migration, write to both for compatibility
    return ['_system', 'index']
  }
  
  /**
   * Check if we should perform migration based on service coordination
   * @param existingStats Statistics from storage
   * @returns Whether to initiate migration
   */
  static shouldMigrate(existingStats: StatisticsData | null): boolean {
    if (!existingStats) return true  // No data yet, use new structure
    
    // Check if we have migration metadata in stats
    const migrationData = (existingStats as any).migrationMetadata
    if (!migrationData) return true  // No migration data, start migration
    
    // Check schema version
    if (migrationData.schemaVersion < 2) return true
    
    // Already migrated
    return false
  }
  
  /**
   * Creates migration metadata
   */
  static createMigrationMetadata(): MigrationMetadata {
    return {
      schemaVersion: 2,
      migrationStarted: new Date().toISOString(),
      lastUpdatedBy: process.env.HOSTNAME || process.env.INSTANCE_ID || 'unknown'
    }
  }
  
  /**
   * Merge statistics from multiple locations (deduplication)
   */
  static mergeStatistics(
    primary: StatisticsData | null,
    fallback: StatisticsData | null
  ): StatisticsData | null {
    if (!primary && !fallback) return null
    if (!fallback) return primary
    if (!primary) return fallback
    
    // Return the most recently updated
    const primaryTime = new Date(primary.lastUpdated).getTime()
    const fallbackTime = new Date(fallback.lastUpdated).getTime()
    
    return primaryTime >= fallbackTime ? primary : fallback
  }
  
  /**
   * Determines if dual-write is needed based on environment
   * @param storageType The type of storage being used
   * @returns Whether to write to both old and new locations
   */
  static needsDualWrite(storageType: string): boolean {
    // Only need dual-write for shared storage systems
    const sharedStorageTypes = ['s3', 'r2', 'gcs', 'filesystem']
    return sharedStorageTypes.includes(storageType.toLowerCase())
  }
  
  /**
   * Grace period for migration (30 days default)
   * After this period, services can stop reading from old location
   */
  static getMigrationGracePeriodMs(): number {
    const days = parseInt(process.env.BRAINY_MIGRATION_GRACE_DAYS || '30', 10)
    return days * 24 * 60 * 60 * 1000
  }
  
  /**
   * Check if migration grace period has expired
   */
  static isGracePeriodExpired(migrationStarted: string): boolean {
    const startTime = new Date(migrationStarted).getTime()
    const now = Date.now()
    const gracePeriod = this.getMigrationGracePeriodMs()
    
    return (now - startTime) > gracePeriod
  }
  
  /**
   * Log migration events for monitoring
   */
  static logMigrationEvent(event: string, details?: any): void {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Brainy Storage Migration] ${event}`, details || '')
    }
  }
}

/**
 * Storage paths helper for migration
 */
export class StoragePaths {
  /**
   * Get the statistics file path for a given directory
   */
  static getStatisticsPath(baseDir: string, filename: string = 'statistics'): string {
    return `${baseDir}/${filename}.json`
  }
  
  /**
   * Get distributed config path
   */
  static getDistributedConfigPath(baseDir: string): string {
    return `${baseDir}/distributed_config.json`
  }
  
  /**
   * Check if a path is using the old structure
   */
  static isLegacyPath(path: string): boolean {
    return path.includes('/index/') || path.endsWith('/index')
  }
  
  /**
   * Convert legacy path to new structure
   */
  static modernizePath(path: string): string {
    return path.replace('/index/', '/_system/').replace('/index', '/_system')
  }
}