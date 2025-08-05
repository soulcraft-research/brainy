# Migration Plan: Deprecated Methods

## Overview
This document outlines the migration plan for deprecated methods in the Brainy codebase. These methods are marked as deprecated due to potential memory issues with large datasets.

## Deprecated Methods

### 1. Storage Adapter Methods
- `getAllNouns()` → Use `getNouns()` with pagination
- `getAllVerbs()` → Use `getVerbs()` with pagination  
- `getNounsByNounType(nounType)` → Use `getNouns({ nounType })`
- `getVerbsBySource(sourceId)` → Use `getVerbs({ sourceId })`
- `getVerbsByTarget(targetId)` → Use `getVerbs({ targetId })`
- `getVerbsByType(type)` → Use `getVerbs({ verbType: type })`

### 2. HNSW Index Methods
- `getNouns()` → Use `getNounsPaginated()`

## Migration Strategy

### Phase 1: Update Internal BrainyData Usage (High Priority)
**Files to update:**
- `src/brainyData.ts` - 8 usages of deprecated methods
- `src/augmentations/memoryAugmentations.ts` - 1 usage
- `src/mcp/brainyMCPAdapter.ts` - 2 usages

**Specific Changes:**

#### src/brainyData.ts
```typescript
// OLD: 
const nouns = await this.storage!.getAllNouns()

// NEW:
const nouns: HNSWNoun[] = []
let cursor: SearchCursor | undefined
do {
  const result = await this.storage!.getNouns({}, { limit: 1000, cursor })
  nouns.push(...result.results)
  cursor = result.cursor
} while (cursor)
```

#### src/augmentations/memoryAugmentations.ts
```typescript
// OLD:
const nodes = await this.storage.getAllNouns()

// NEW: 
const nodes = await this.storage.getNouns({}, { limit: Number.MAX_SAFE_INTEGER })
```

#### src/mcp/brainyMCPAdapter.ts
```typescript
// OLD:
const outgoing = await (this.brainyData as any).getVerbsBySource?.(id) || []

// NEW:
const outgoing = await this.brainyData.getVerbs({ sourceId: id }, { limit: Number.MAX_SAFE_INTEGER }) || []
```

### Phase 2: Update Storage Adapter Implementations (Medium Priority)
**Files to update:**
- `src/storage/adapters/memoryStorage.ts`
- `src/storage/adapters/fileSystemStorage.ts`
- `src/storage/adapters/opfsStorage.ts`
- `src/storage/adapters/s3CompatibleStorage.ts`

**Strategy:** Keep deprecated methods but mark them as internal-only and implement them using the new filtered methods.

### Phase 3: Update Type Definitions (Low Priority)
**Files to update:**
- `src/coreTypes.ts` - Remove deprecated method signatures
- `src/storage/baseStorage.ts` - Remove deprecated implementations

### Phase 4: Update Tests (Low Priority)
**Files to update:**
- `tests/*.test.ts` - Update test files that use deprecated methods

## Implementation Order

### 1. Immediate (Safe Changes)
- ✅ Remove unused files (tensorflowUtils.ts, etc.)
- ✅ Fix TODO items with version handling
- Update internal BrainyData usage with pagination

### 2. Short-term (1-2 weeks)
- Update augmentation and MCP adapter usage
- Add deprecation warnings to method implementations
- Update storage adapter internal implementations

### 3. Long-term (Next major version)
- Remove deprecated method signatures from interfaces
- Remove deprecated method implementations
- Update all test files

## Backward Compatibility

### Option 1: Gradual Deprecation (Recommended)
- Keep deprecated methods but add console warnings
- Implement them using new filtered methods internally
- Remove in next major version (0.42.0 → 1.0.0)

### Option 2: Immediate Removal
- Remove deprecated methods now
- Update all usage immediately
- Risk: Breaking changes for external users

## Testing Strategy

1. **Unit Tests**: Update existing tests to use new methods
2. **Integration Tests**: Verify pagination works correctly
3. **Performance Tests**: Ensure new implementations don't regress performance
4. **Memory Tests**: Verify large dataset handling improves

## Rollback Plan

If issues arise:
1. Revert to previous implementations
2. Add memory limits as temporary solution
3. Implement pagination more gradually

## Success Criteria

- ✅ All deprecated method usage removed from core files
- ✅ No memory issues with large datasets
- ✅ Performance maintained or improved
- ✅ All tests passing
- ✅ Backward compatibility preserved (if Option 1)

## Timeline

- **Week 1**: Complete Phase 1 (internal usage)
- **Week 2**: Complete Phase 2 (storage adapters)
- **Week 3**: Complete Phase 3 (type definitions)
- **Week 4**: Complete Phase 4 (tests) and validation

## Notes

- The deprecated methods are still widely used, so this migration requires careful planning
- Consider adding configuration option to control pagination limits
- Document the breaking changes clearly in CHANGELOG.md
- Consider providing migration utilities for external users