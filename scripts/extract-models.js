#!/usr/bin/env node

/**
 * Extract Brainy Models Script
 * 
 * Automatically extracts models from @soulcraft/brainy-models during Docker builds
 * Works across all cloud providers (Google Cloud Run, AWS Lambda/ECS, Azure Container Instances, Cloudflare Workers)
 */

import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function log(message) {
  console.log(`[Brainy Model Extractor] ${message}`)
}

async function extractModels() {
  try {
    log('🔍 Checking for @soulcraft/brainy-models...')
    
    // Get the project root (one level up from scripts/)
    const projectRoot = join(__dirname, '..')
    const modelsPackagePath = join(projectRoot, 'node_modules', '@soulcraft', 'brainy-models')
    
    if (!existsSync(modelsPackagePath)) {
      log('⚠️ @soulcraft/brainy-models not found - skipping model extraction')
      log('   Models will be downloaded at runtime (slower startup)')
      return false
    }
    
    log('✅ Found @soulcraft/brainy-models package')
    
    // Create the models directory in the project root
    const targetModelsDir = join(projectRoot, 'models')
    
    if (existsSync(targetModelsDir)) {
      log('📁 Models directory already exists - removing old version')
      // Remove existing models directory to ensure clean extraction
      try {
        import('fs').then(fs => {
          fs.rmSync(targetModelsDir, { recursive: true, force: true })
        })
      } catch (error) {
        log(`⚠️ Could not remove existing models directory: ${error.message}`)
      }
    }
    
    log('📦 Creating models directory...')
    mkdirSync(targetModelsDir, { recursive: true })
    
    // Look for models in the package
    const possibleModelsPaths = [
      join(modelsPackagePath, 'models'),
      join(modelsPackagePath, 'dist', 'models'),
      modelsPackagePath // Root of the package
    ]
    
    let modelsSourcePath = null
    for (const path of possibleModelsPaths) {
      if (existsSync(path)) {
        // Check if this directory contains model files
        try {
          const fs = await import('fs')
          const files = fs.readdirSync(path)
          if (files.length > 0) {
            modelsSourcePath = path
            break
          }
        } catch (error) {
          continue
        }
      }
    }
    
    if (!modelsSourcePath) {
      log('❌ Could not find models in @soulcraft/brainy-models package')
      return false
    }
    
    log(`📋 Copying models from: ${modelsSourcePath}`)
    log(`📋 Copying models to: ${targetModelsDir}`)
    
    // Copy all models
    try {
      cpSync(modelsSourcePath, targetModelsDir, { 
        recursive: true,
        force: true,
        filter: (src, dest) => {
          // Skip node_modules and other unnecessary files
          const filename = src.split('/').pop() || ''
          return !filename.startsWith('.') && filename !== 'node_modules'
        }
      })
      
      log('✅ Models extracted successfully!')
      
      // Create a marker file to indicate successful extraction
      const markerFile = join(targetModelsDir, '.brainy-models-extracted')
      writeFileSync(markerFile, JSON.stringify({
        extractedAt: new Date().toISOString(),
        sourcePackage: '@soulcraft/brainy-models',
        extractorVersion: '1.0.0'
      }, null, 2))
      
      // List extracted models
      try {
        const fs = await import('fs')
        const extractedItems = fs.readdirSync(targetModelsDir)
        log(`📊 Extracted items: ${extractedItems.join(', ')}`)
      } catch (error) {
        log('📊 Model extraction completed (could not list contents)')
      }
      
      return true
      
    } catch (error) {
      log(`❌ Failed to copy models: ${error.message}`)
      return false
    }
    
  } catch (error) {
    log(`❌ Model extraction failed: ${error.message}`)
    return false
  }
}

// Auto-detect environment and provide helpful information
function detectEnvironment() {
  const envs = []
  
  // Docker detection
  if (existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER) {
    envs.push('Docker')
  }
  
  // Cloud provider detection
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GAE_SERVICE) {
    envs.push('Google Cloud')
  }
  
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    envs.push('AWS')
  }
  
  if (process.env.AZURE_CLIENT_ID || process.env.WEBSITE_SITE_NAME) {
    envs.push('Azure')
  }
  
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ACCOUNT_ID) {
    envs.push('Cloudflare')
  }
  
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    envs.push('Vercel')
  }
  
  if (process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE) {
    envs.push('Netlify')
  }
  
  return envs
}

// Main execution
async function main() {
  log('🚀 Starting Brainy model extraction...')
  
  const detectedEnvs = detectEnvironment()
  if (detectedEnvs.length > 0) {
    log(`🌐 Detected environment(s): ${detectedEnvs.join(', ')}`)
  }
  
  const success = await extractModels()
  
  if (success) {
    log('🎉 Model extraction completed successfully!')
    log('💡 Models are now embedded in your container/deployment')
    log('💡 No runtime model downloads required!')
    
    // Set environment variable hint for runtime
    log('💡 Runtime will automatically detect extracted models')
  } else {
    log('⚠️ Model extraction failed or skipped')
    log('💡 Application will fall back to runtime model downloads')
    log('💡 Consider installing @soulcraft/brainy-models for better performance')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { extractModels, detectEnvironment }