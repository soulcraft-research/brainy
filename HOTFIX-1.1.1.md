# 🚨 CRITICAL HOTFIX: Brainy v1.1.1

## **The Problem**
Fresh installations of `@soulcraft/brainy@1.1.0` failed with model loading errors, preventing vector operations from working out-of-the-box.

## **Root Cause**
The embedding system defaulted to `localFilesOnly: true` in Node.js environments, which prevented automatic model downloads on fresh installations.

## **The Fix**
**Comprehensive, Multi-Layer Solution:**

### 1. **Smart Defaults** 
- ✅ **Before**: Node.js defaulted to `localFilesOnly: true` (broken for fresh installs)
- ✅ **After**: Node.js defaults to `localFilesOnly: false` (production-friendly)

### 2. **Environment Variable Support**
- ✅ **New**: `BRAINY_ALLOW_REMOTE_MODELS=true|false` now properly respected
- ✅ **Development**: `NODE_ENV=development` automatically enables remote models

### 3. **Graceful Fallbacks**
- ✅ **Smart Retry**: If local models fail, automatically attempts remote download
- ✅ **Clear Errors**: Actionable guidance when both local and remote fail
- ✅ **Zero Config**: Works immediately after `npm install` with no setup

### 4. **Backward Compatibility**
- ✅ **Existing Code**: No changes needed for existing working installations
- ✅ **Explicit Config**: Still honored when provided
- ✅ **Air-Gapped**: Set `BRAINY_ALLOW_REMOTE_MODELS=false` for offline deployments

## **Impact**

### **Before (v1.1.0):**
```bash
npm install @soulcraft/brainy
node -e "import {BrainyData} from '@soulcraft/brainy'; const brain = new BrainyData(); await brain.init(); await brain.add('test')"
# ❌ FAILED: local_files_only=true and file was not found locally
```

### **After (v1.1.1):**
```bash
npm install @soulcraft/brainy
node -e "import {BrainyData} from '@soulcraft/brainy'; const brain = new BrainyData(); await brain.init(); await brain.add('test')"
# ✅ WORKS: Downloads models automatically and processes data
```

## **Deployment Scenarios Now Supported**

### ✅ **Fresh Installation (Default)**
```bash
npm install @soulcraft/brainy
# Just works - downloads models on first use (~50MB)
```

### ✅ **Explicit Remote Enabled**
```bash
export BRAINY_ALLOW_REMOTE_MODELS=true
npm install @soulcraft/brainy
# Guaranteed to work with remote model downloads
```

### ✅ **Air-Gapped/Offline**
```bash
export BRAINY_ALLOW_REMOTE_MODELS=false
# Pre-download models: npm run download-models
npm install @soulcraft/brainy
# Works with local models only
```

### ✅ **Development**
```bash
export NODE_ENV=development
npm install @soulcraft/brainy
# Automatically enables remote models for development
```

## **Migration**
**NO MIGRATION REQUIRED** - This is a hotfix that improves default behavior without breaking existing code.

## **Testing**
- ✅ Fresh npm installations in clean environments
- ✅ All deployment scenarios (dev, prod, air-gapped)  
- ✅ Backward compatibility with existing configurations
- ✅ Error handling and graceful fallbacks
- ✅ All 9 unified methods functionality
- ✅ Triple-power search (vector + graph + facets)

## **Future Prevention**
- ✅ Added production readiness test suite
- ✅ Multi-environment testing protocol
- ✅ Automated deployment scenario validation

---

**This hotfix ensures Brainy works perfectly out-of-the-box for all users.**