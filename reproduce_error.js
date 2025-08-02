#!/usr/bin/env node

/**
 * Script to reproduce the FileSystemStorage initialization error
 */

import { createStorage } from './dist/unified.js'

async function reproduceError() {
  console.log('Attempting to reproduce FileSystemStorage error...')
  
  try {
    // This should trigger the same error as in the test
    const storage = await createStorage({ forceFileSystemStorage: true })
    console.log('Storage created successfully:', storage.constructor.name)
    
    // This should fail with the fs/path modules error
    await storage.init()
    console.log('Storage initialized successfully')
    
  } catch (error) {
    console.error('Error reproduced:', error.message)
    console.error('Full error:', error)
  }
}

reproduceError()
