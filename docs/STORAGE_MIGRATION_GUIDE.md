# Storage Migration Guide: `index` → `_system`

## Overview

Brainy is migrating its system metadata storage from the `index/` directory to `_system/` directory to better reflect its purpose and follow database conventions. This migration is designed to be **zero-downtime** and **backward compatible**.

## Migration Strategy

### Dual Read/Write Approach

The migration uses a **dual-read, migrate-on-write** strategy to ensure compatibility between services running different versions:

1. **Read Priority**: Try new location first (`_system/`), fallback to old (`index/`)
2. **Dual Write**: During migration, write to both locations
3. **Automatic Migration**: When data is found only in old location, it's automatically copied to new
4. **Gradual Rollout**: Services can be updated independently without coordination

## Timeline

### Phase 1: Dual Mode (Current)
- **Duration**: 30 days (configurable via `BRAINY_MIGRATION_GRACE_DAYS`)
- Services write to both `_system/` and `index/`
- Services read from both locations (new first, then old)
- Automatic migration on first read from old location

### Phase 2: New Primary (After Grace Period)
- Services primarily use `_system/`
- Legacy `index/` kept for emergency rollback
- Monitoring for any services still using old location

### Phase 3: Cleanup (After Verification)
- Remove dual-write code
- Archive or delete `index/` directory
- Update documentation

## Deployment Guide

### For S3/Cloud Storage (Most Critical)

**Step 1: Rolling Update**
```bash
# Update services one by one - no coordination needed
kubectl rollout restart deployment/brainy-service-1
# Wait for health checks
kubectl rollout restart deployment/brainy-service-2
# Continue for all services
```

**Step 2: Monitor Migration**
```bash
# Check for migration events in logs
kubectl logs -l app=brainy --since=1h | grep "Storage Migration"

# Verify both directories have data
aws s3 ls s3://your-bucket/_system/
aws s3 ls s3://your-bucket/index/
```

**Step 3: Verify Consistency**
```javascript
// Check that statistics match between locations
const oldStats = await storage.getMetadata('statistics'); // from index/
const newStats = await storage.getStatistics(); // from _system/
console.assert(oldStats.nounCount === newStats.nounCount);
```

### For Local/FileSystem Storage

The migration happens automatically on first run:
```bash
# Before update
brainy-data/
├── index/          # Old location
│   └── statistics.json
└── ...

# After update (automatic)
brainy-data/
├── index/          # Kept for compatibility
│   └── statistics.json
├── _system/        # New location
│   └── statistics.json
└── ...
```

## Configuration Options

### Environment Variables

```bash
# Control migration grace period (default: 30 days)
export BRAINY_MIGRATION_GRACE_DAYS=30

# Force single-write mode (after migration confirmed)
export BRAINY_DISABLE_DUAL_WRITE=true

# Enable verbose migration logging
export BRAINY_MIGRATION_DEBUG=true
```

### Per-Instance Configuration

```javascript
const storage = new FileSystemStorage({
  rootDirectory: './data',
  useDualWrite: true  // Set to false after migration
});
```

## Monitoring

### Key Metrics to Watch

1. **Storage Operations**
   - Successful reads from `_system/`
   - Fallback reads from `index/`
   - Dual write operations
   - Migration events

2. **Performance Impact**
   - Minimal: ~5-10ms additional latency during dual-write
   - No impact on read performance (cache used)

3. **Log Messages**
   ```
   [Brainy Storage Migration] Migrating statistics from legacy location
   [Brainy Storage Migration] Failed to write to legacy location (non-critical)
   [Brainy Storage Migration] Migration completed successfully
   ```

## Rollback Plan

If issues occur, rollback is simple:

1. **Immediate Rollback**: Revert service to previous version
   - Old versions continue using `index/`
   - New versions read from both locations

2. **Data Recovery**: If data corruption occurs
   ```bash
   # Copy data back from index to _system
   aws s3 sync s3://bucket/index/ s3://bucket/_system/
   ```

## FAQ

### Q: What happens if services are on different versions?
**A:** The dual-read/write strategy ensures compatibility. Newer services write to both locations and read from both, while older services continue using only the old location.

### Q: Is there data duplication?
**A:** Yes, temporarily. During the migration period, data exists in both locations. This ensures zero-downtime migration and provides a safety net.

### Q: What about distributed configurations?
**A:** The distributed configuration (previously in metadata) now lives with statistics in `_system/`, making it easier to find and manage.

### Q: Can I disable dual-write immediately?
**A:** Not recommended. Keep dual-write enabled for at least 7 days to ensure all services are updated and caches are refreshed.

### Q: What if a service can't write to the new location?
**A:** The service will log a warning but continue operating using the fallback location. This ensures service availability over migration perfection.

## Testing the Migration

### Unit Test Example
```javascript
describe('Storage Migration', () => {
  it('should read from both locations', async () => {
    // Write to old location
    await fs.writeFile('data/index/statistics.json', oldData);
    
    // Initialize storage (triggers migration)
    const storage = new FileSystemStorage({ rootDir: 'data' });
    
    // Should read and migrate
    const stats = await storage.getStatistics();
    expect(stats).toBeDefined();
    
    // Should now exist in both locations
    expect(fs.existsSync('data/_system/statistics.json')).toBe(true);
    expect(fs.existsSync('data/index/statistics.json')).toBe(true);
  });
});
```

### Integration Test
```bash
# Start with old version
docker run -v data:/data brainy:old-version

# Create some data
curl -X POST localhost:3000/api/data

# Upgrade to new version
docker run -v data:/data brainy:new-version

# Verify data is accessible and migrated
curl localhost:3000/api/stats | jq '.migrationMetadata'
```

## Support

For issues or questions about the migration:
1. Check logs for migration-related messages
2. Verify both directories exist and are accessible
3. Ensure proper permissions for creating `_system/` directory
4. Contact support with migration logs if issues persist

## Summary

This migration is designed to be:
- **Safe**: Dual-read/write prevents data loss
- **Gradual**: No big-bang migration required
- **Automatic**: Minimal manual intervention
- **Reversible**: Easy rollback if needed
- **Transparent**: Services continue operating normally

The key is patience - let the migration happen gradually across your fleet rather than forcing immediate updates.