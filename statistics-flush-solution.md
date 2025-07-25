# Statistics Flush Solution

## Issue Description

When inserting lots of data into Brainy, the statistics do not seem to be changing. This is because statistics are updated in memory but might not be immediately flushed to storage due to the batch update mechanism.

## Root Cause

The Brainy database uses a batch update mechanism for statistics to optimize performance. When data is inserted, statistics are updated in memory and a batch update is scheduled to flush the statistics to storage. However, this batch update might be delayed by up to 30 seconds (as defined by `MAX_FLUSH_DELAY_MS` in `baseStorageAdapter.ts`).

If the user checks statistics shortly after inserting data, or if the database is shut down before the batch update occurs, the statistics might not reflect the recent changes.

## Solution

The solution is to provide a way to force an immediate flush of statistics to storage, and to ensure that statistics are flushed before the database is shut down. The following changes were made:

1. Added a new method `flushStatisticsToStorage()` to the `StorageAdapter` interface in `coreTypes.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    */
   flushStatisticsToStorage(): Promise<void>
   ```

2. Implemented this method in the `BaseStorageAdapter` class in `baseStorageAdapter.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    */
   async flushStatisticsToStorage(): Promise<void> {
     // If there are no statistics in cache or they haven't been modified, nothing to flush
     if (!this.statisticsCache || !this.statisticsModified) {
       return
     }

     // Call the protected flushStatistics method to immediately write to storage
     await this.flushStatistics()
   }
   ```

3. Added a public method `flushStatistics()` to the `BrainyData` class in `brainyData.ts`:
   ```typescript
   /**
    * Force an immediate flush of statistics to storage
    * This ensures that any pending statistics updates are written to persistent storage
    * @returns Promise that resolves when the statistics have been flushed
    */
   public async flushStatistics(): Promise<void> {
     await this.ensureInitialized()

     if (!this.storage) {
       throw new Error('Storage not initialized')
     }

     // Call the flushStatisticsToStorage method on the storage adapter
     await this.storage.flushStatisticsToStorage()
   }
   ```

4. Modified the `shutDown()` method in `BrainyData` to flush statistics before shutting down:
   ```typescript
   /**
    * Shut down the database and clean up resources
    * This should be called when the database is no longer needed
    */
   public async shutDown(): Promise<void> {
     try {
       // Flush statistics to ensure they're saved before shutting down
       if (this.storage && this.isInitialized) {
         try {
           await this.flushStatistics()
         } catch (statsError) {
           console.warn('Failed to flush statistics during shutdown:', statsError)
           // Continue with shutdown even if statistics flush fails
         }
       }

       // Rest of the shutdown process...
     } catch (error) {
       console.error('Failed to shut down BrainyData:', error)
       throw new Error(`Failed to shut down BrainyData: ${error}`)
     }
   }
   ```

## Usage

To ensure statistics are up-to-date after inserting data, you can now call the `flushStatistics()` method on the `BrainyData` instance:

```typescript
// Insert data
await brainyDb.add(vectorOrData, metadata)

// Force a flush of statistics to ensure they're up-to-date
await brainyDb.flushStatistics()

// Get statistics
const stats = await brainyDb.getStatistics()
```

Statistics will also be automatically flushed when the database is shut down, ensuring that no statistics updates are lost.

## Note on "bluesky-package"

The issue description mentioned a "bluesky-package" being used to insert data into Brainy. This package was not found in the project, so it might be a third-party package or a typo. The solution implemented here should work regardless of how data is inserted into Brainy, as long as the `flushStatistics()` method is called after inserting data.