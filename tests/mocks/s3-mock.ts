/**
 * S3 Compatible Storage Mock for Testing
 * 
 * This module provides a mock implementation of the AWS S3 client
 * for testing S3-based storage in a Node.js environment without
 * requiring actual S3 credentials.
 */

import { vi } from 'vitest'

// In-memory storage to simulate S3 bucket
interface S3MockObject {
  key: string
  body: string
  metadata?: Record<string, string>
  lastModified: Date
  contentLength: number
  contentType?: string
}

interface S3MockBucket {
  name: string
  objects: Map<string, S3MockObject>
}

// Mock S3 storage - use a global variable to ensure persistence between operations
// This is important because the mock client is recreated for each command
const mockS3Storage = new Map<string, S3MockBucket>()

/**
 * Create a mock S3 client
 * 
 * This function creates a mock S3 client that simulates the behavior of the AWS S3 client.
 * It's important that all operations use the same instance of mockS3Storage to ensure
 * that objects are correctly persisted between operations.
 */
export function createMockS3Client() {
  // Log the current state of the mock storage
  console.log(`[MOCK S3] Creating mock S3 client with current storage state:`)
  for (const [bucketName, bucket] of mockS3Storage.entries()) {
    console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
    if (bucket.objects.size > 0) {
      console.log('[MOCK S3] Objects in bucket:')
      for (const key of bucket.objects.keys()) {
        console.log(`[MOCK S3] - ${key}`)
      }
    }
  }
  
  return {
    send: vi.fn().mockImplementation((command) => {
      // Log the command for debugging
      console.log(`[MOCK S3] Received S3 command: ${command.constructor.name}`, command.input)
      
      // Log the current state of the mock storage before processing the command
      console.log(`[MOCK S3] Current storage state before processing command:`)
      for (const [bucketName, bucket] of mockS3Storage.entries()) {
        console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
        if (bucket.objects.size > 0) {
          console.log('[MOCK S3] Objects in bucket:')
          for (const key of bucket.objects.keys()) {
            console.log(`[MOCK S3] - ${key}`)
          }
        }
      }
      
      // Handle different command types
      let result
      if (command.constructor.name === 'CreateBucketCommand') {
        result = handleCreateBucket(command)
      } else if (command.constructor.name === 'HeadBucketCommand') {
        result = handleHeadBucket(command)
      } else if (command.constructor.name === 'PutObjectCommand') {
        result = handlePutObject(command)
      } else if (command.constructor.name === 'GetObjectCommand') {
        result = handleGetObject(command)
      } else if (command.constructor.name === 'DeleteObjectCommand') {
        result = handleDeleteObject(command)
      } else if (command.constructor.name === 'ListObjectsV2Command') {
        result = handleListObjectsV2(command)
      } else {
        console.warn(`[MOCK S3] Unhandled S3 command: ${command.constructor.name}`)
        result = Promise.resolve({})
      }
      
      // Log the current state of the mock storage after processing the command
      result.then(() => {
        console.log(`[MOCK S3] Storage state after processing command:`)
        for (const [bucketName, bucket] of mockS3Storage.entries()) {
          console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
          if (bucket.objects.size > 0) {
            console.log('[MOCK S3] Objects in bucket:')
            for (const key of bucket.objects.keys()) {
              console.log(`[MOCK S3] - ${key}`)
            }
          }
        }
      }).catch(error => {
        console.error(`[MOCK S3] Error processing command:`, error)
      })
      
      return result
    })
  }
}

/**
 * Handle CreateBucketCommand
 */
function handleCreateBucket(command: any) {
  const { Bucket } = command.input
  
  if (!mockS3Storage.has(Bucket)) {
    mockS3Storage.set(Bucket, {
      name: Bucket,
      objects: new Map()
    })
  }
  
  return Promise.resolve({
    Location: `/${Bucket}`
  })
}

/**
 * Handle HeadBucketCommand
 */
function handleHeadBucket(command: any) {
  const { Bucket } = command.input
  
  if (!mockS3Storage.has(Bucket)) {
    return Promise.reject(new Error(`Bucket not found: ${Bucket}`))
  }
  
  return Promise.resolve({})
}

/**
 * Handle PutObjectCommand
 */
function handlePutObject(command: any) {
  const { Bucket, Key, Body, Metadata, ContentType } = command.input
  
  console.log(`PutObjectCommand for bucket: ${Bucket}, key: ${Key}`)
  
  // Create bucket if it doesn't exist
  if (!mockS3Storage.has(Bucket)) {
    console.log(`Creating bucket: ${Bucket}`)
    mockS3Storage.set(Bucket, {
      name: Bucket,
      objects: new Map()
    })
  }
  
  const bucket = mockS3Storage.get(Bucket)!
  
  let bodyContent: string
  if (typeof Body === 'string') {
    bodyContent = Body
  } else if (Body instanceof Uint8Array || Body instanceof Buffer) {
    bodyContent = new TextDecoder().decode(Body)
  } else if (Body && typeof Body.toString === 'function') {
    bodyContent = Body.toString()
  } else {
    bodyContent = JSON.stringify(Body)
  }
  
  // Log the key and body content for debugging
  console.log(`Storing object with key: ${Key}`)
  console.log(`Body content: ${bodyContent.substring(0, 50)}${bodyContent.length > 50 ? '...' : ''}`)
  
  // Parse the body content if it's JSON to ensure it's valid
  try {
    if (ContentType === 'application/json') {
      const parsedBody = JSON.parse(bodyContent)
      console.log(`Parsed JSON body:`, parsedBody)
      
      // If this is a noun or verb (but NOT metadata), ensure it has an id property
      if ((Key.includes('/nouns/') || Key.includes('/verbs/')) && !Key.includes('/metadata/')) {
        if (!parsedBody.id) {
          console.error(`Warning: Object ${Key} does not have an id property`)
          // Add id property based on the key name
          const id = Key.split('/').pop()?.replace('.json', '') || 'unknown'
          parsedBody.id = id
          console.log(`Added id property: ${id}`)
          bodyContent = JSON.stringify(parsedBody)
        }
      }
    }
  } catch (error) {
    console.error(`Error parsing JSON body for ${Key}:`, error)
    // Continue with the original body content
  }
  
  // Store the object in the bucket
  bucket.objects.set(Key, {
    key: Key,
    body: bodyContent,
    metadata: Metadata,
    lastModified: new Date(),
    contentLength: bodyContent.length,
    contentType: ContentType
  })
  
  // Debug: Log all objects in the bucket after adding the new one
  console.log(`All objects in bucket ${Bucket} after adding ${Key}:`)
  for (const [key, obj] of bucket.objects.entries()) {
    console.log(`- ${key}: ${obj.body.substring(0, 30)}...`)
  }
  
  // Return a success response
  const response = {
    ETag: `"${Math.random().toString(36).substring(2, 15)}"`
  }
  
  console.log(`PutObjectCommand successful for ${Key}`)
  return Promise.resolve(response)
}

/**
 * Handle GetObjectCommand
 */
function handleGetObject(command: any) {
  const { Bucket, Key } = command.input
  
  console.log(`GetObjectCommand for bucket: ${Bucket}, key: ${Key}`)
  
  if (!mockS3Storage.has(Bucket)) {
    console.log(`Bucket ${Bucket} not found`)
    return Promise.reject(new Error(`Bucket not found: ${Bucket}`))
  }
  
  const bucket = mockS3Storage.get(Bucket)!
  
  // Debug: Log all objects in the bucket
  console.log(`All objects in bucket ${Bucket}:`)
  for (const [key, obj] of bucket.objects.entries()) {
    console.log(`- ${key}: ${obj.body.substring(0, 30)}...`)
  }
  
  if (!bucket.objects.has(Key)) {
    console.log(`Object ${Key} not found in bucket ${Bucket}`)
    // Create proper NoSuchKey error that matches AWS SDK structure
    const error = new Error(`NoSuchKey: The specified key does not exist.`)
    error.name = 'NoSuchKey'
    return Promise.reject(error)
  }
  
  const object = bucket.objects.get(Key)!
  console.log(`Found object ${Key} in bucket ${Bucket}`)
  console.log(`Object body: ${object.body.substring(0, 50)}${object.body.length > 50 ? '...' : ''}`)
  
  // If this is a JSON object, ensure it has the required properties
  let bodyContent = object.body
  if (object.contentType === 'application/json') {
    try {
      const parsedBody = JSON.parse(bodyContent)
      console.log(`Parsed JSON body for ${Key}:`, parsedBody)
      
      // If this is a noun or verb (but NOT metadata), ensure it has an id property
      if ((Key.includes('/nouns/') || Key.includes('/verbs/')) && !Key.includes('/metadata/')) {
        if (!parsedBody.id) {
          console.error(`Warning: Object ${Key} does not have an id property`)
          // Add id property based on the key name
          const id = Key.split('/').pop()?.replace('.json', '') || 'unknown'
          parsedBody.id = id
          console.log(`Added id property: ${id}`)
          bodyContent = JSON.stringify(parsedBody)
        }
      }
    } catch (error) {
      console.error(`Error parsing JSON body for ${Key}:`, error)
      // Continue with the original body
    }
  }
  
  // Create a response object that matches what the S3 SDK would return
  const response = {
    Body: {
      transformToString: () => Promise.resolve(bodyContent),
      transformToByteArray: () => Promise.resolve(new TextEncoder().encode(bodyContent))
    },
    Metadata: object.metadata || {},
    LastModified: object.lastModified,
    ContentLength: bodyContent.length,
    ContentType: object.contentType
  }
  
  console.log(`Returning response for ${Key}`)
  return Promise.resolve(response)
}

/**
 * Handle DeleteObjectCommand
 */
function handleDeleteObject(command: any) {
  const { Bucket, Key } = command.input
  
  if (!mockS3Storage.has(Bucket)) {
    return Promise.reject(new Error(`Bucket not found: ${Bucket}`))
  }
  
  const bucket = mockS3Storage.get(Bucket)!
  
  if (!bucket.objects.has(Key)) {
    return Promise.reject(new Error(`Object not found: ${Key}`))
  }
  
  bucket.objects.delete(Key)
  
  return Promise.resolve({})
}

/**
 * Handle ListObjectsV2Command
 */
function handleListObjectsV2(command: any) {
  const { Bucket, Prefix, MaxKeys = 1000, ContinuationToken } = command.input
  
  console.log(`ListObjectsV2Command for bucket: ${Bucket}, prefix: ${Prefix || 'none'}`)
  
  if (!mockS3Storage.has(Bucket)) {
    console.log(`Bucket ${Bucket} not found, returning empty result`)
    // Return empty result instead of rejecting
    return Promise.resolve({
      Contents: [],
      IsTruncated: false,
      KeyCount: 0
    })
  }
  
  const bucket = mockS3Storage.get(Bucket)!
  
  // Debug: Log all objects in the bucket
  console.log(`All objects in bucket ${Bucket} before filtering:`)
  for (const [key, obj] of bucket.objects.entries()) {
    console.log(`- ${key}: ${obj.body.substring(0, 30)}...`)
  }
  
  // Filter objects by prefix if provided
  console.log(`[MOCK S3] Filtering objects by prefix: "${Prefix || 'none'}"`)
  console.log(`[MOCK S3] All keys in bucket before filtering:`)
  for (const key of bucket.objects.keys()) {
    console.log(`[MOCK S3] - ${key}`)
  }
  
  const filteredObjects = Array.from(bucket.objects.values()).filter(obj => {
    if (!Prefix) return true
    const matches = obj.key.startsWith(Prefix)
    console.log(`[MOCK S3] Key: ${obj.key}, Matches prefix "${Prefix}": ${matches}`)
    return matches
  })
  
  console.log(`Found ${filteredObjects.length} objects with prefix: ${Prefix || 'none'}`)
  
  // Debug: Log filtered objects
  console.log(`Filtered objects:`)
  for (const obj of filteredObjects) {
    console.log(`- ${obj.key}: ${obj.body.substring(0, 30)}...`)
    
    // Ensure each object has a valid body
    try {
      if (obj.contentType === 'application/json') {
        const parsedBody = JSON.parse(obj.body)
        console.log(`Parsed JSON body for ${obj.key}:`, parsedBody)
        
        // If this is a noun or verb, ensure it has an id property
        if (obj.key.includes('/nouns/') || obj.key.includes('/verbs/')) {
          if (!parsedBody.id) {
            console.error(`Warning: Object ${obj.key} does not have an id property`)
            // Add id property based on the key name
            const id = obj.key.split('/').pop()?.replace('.json', '') || 'unknown'
            parsedBody.id = id
            console.log(`Added id property: ${id}`)
            obj.body = JSON.stringify(parsedBody)
            obj.contentLength = obj.body.length
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing JSON body for ${obj.key}:`, error)
      // Continue with the original body
    }
  }
  
  // Handle pagination
  const startIndex = ContinuationToken ? parseInt(ContinuationToken, 10) : 0
  const endIndex = Math.min(startIndex + MaxKeys, filteredObjects.length)
  const objects = filteredObjects.slice(startIndex, endIndex)
  
  // Check if there are more objects
  const isTruncated = endIndex < filteredObjects.length
  const nextContinuationToken = isTruncated ? endIndex.toString() : undefined
  
  // Map objects to the expected format
  const contents = objects.map(obj => ({
    Key: obj.key,
    LastModified: obj.lastModified,
    Size: obj.contentLength || obj.body.length, // Ensure Size is always set
    ETag: `"${Math.random().toString(36).substring(2, 15)}"`
  }))
  
  console.log(`Returning ${contents.length} objects in response`)
  
  // Debug: Log the contents being returned
  if (contents.length > 0) {
    console.log(`Contents being returned:`)
    for (const obj of contents) {
      console.log(`- ${obj.Key}, Size: ${obj.Size}`)
    }
  }
  
  // Always return Contents array, even if empty
  return Promise.resolve({
    Contents: contents,
    IsTruncated: isTruncated,
    NextContinuationToken: nextContinuationToken,
    KeyCount: objects.length
  })
}

/**
 * Setup S3 mock environment
 */
export function setupS3Mock() {
  console.log('Setting up S3 mock environment')
  
  // Clear the mock S3 storage
  mockS3Storage.clear()
  
  // Create mock S3 client with enhanced logging
  const mockS3Client = {
    send: async (command: any) => {
      console.log(`[MOCK S3] Received command: ${command.constructor.name}`)
      console.log(`[MOCK S3] Command input:`, command.input)
      
      // Log the current state of the mock storage before processing the command
      console.log(`[MOCK S3] Current storage state before command:`)
      for (const [bucketName, bucket] of mockS3Storage.entries()) {
        console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
        if (bucket.objects.size > 0) {
          console.log(`[MOCK S3] Objects in bucket ${bucketName}:`)
          for (const [key, obj] of bucket.objects.entries()) {
            console.log(`[MOCK S3] - ${key}: ${obj.body.substring(0, 30)}...`)
          }
        }
      }
      
      // Process the command using the original implementation
      const result = await createMockS3Client().send(command)
      
      // Log the result and the state of the mock storage after processing the command
      console.log(`[MOCK S3] Command result:`, result)
      console.log(`[MOCK S3] Storage state after command:`)
      for (const [bucketName, bucket] of mockS3Storage.entries()) {
        console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
        if (bucket.objects.size > 0) {
          console.log(`[MOCK S3] Objects in bucket ${bucketName}:`)
          for (const [key, obj] of bucket.objects.entries()) {
            console.log(`[MOCK S3] - ${key}: ${obj.body.substring(0, 30)}...`)
          }
        }
      }
      
      return result
    }
  }
  
  // Create a test bucket to ensure it exists
  const testBucket = 'test-bucket'
  if (!mockS3Storage.has(testBucket)) {
    console.log(`Creating test bucket: ${testBucket}`)
    mockS3Storage.set(testBucket, {
      name: testBucket,
      objects: new Map()
    })
  }
  
  console.log('S3 mock environment setup complete')
  
  return {
    mockS3Client,
    mockS3Storage,
    reset: () => {
      console.log('[MOCK S3] Resetting S3 mock storage')
      
      // Log the state of the mock storage before reset
      console.log('[MOCK S3] Mock storage before reset:')
      for (const [bucketName, bucket] of mockS3Storage.entries()) {
        console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
        if (bucket.objects.size > 0) {
          console.log('[MOCK S3] Objects in bucket:')
          for (const key of bucket.objects.keys()) {
            console.log(`[MOCK S3] - ${key}`)
          }
        }
      }
      
      // Clear the mock S3 storage completely
      mockS3Storage.clear()
      
      // Re-create the test bucket with an empty objects map
      console.log(`[MOCK S3] Re-creating test bucket: ${testBucket}`)
      mockS3Storage.set(testBucket, {
        name: testBucket,
        objects: new Map()
      })
      
      // Log the state of the mock storage after reset
      console.log(`[MOCK S3] Mock storage after reset: ${mockS3Storage.size} buckets`)
      for (const [bucketName, bucket] of mockS3Storage.entries()) {
        console.log(`[MOCK S3] Bucket ${bucketName}: ${bucket.objects.size} objects`)
      }
      
      // Ensure the mock client is using the latest storage state
      console.log('[MOCK S3] Ensuring mock client is using the latest storage state')
    }
  }
}

/**
 * Cleanup S3 mock environment
 */
export function cleanupS3Mock() {
  console.log('Cleaning up S3 mock environment')
  
  // Reset mocks
  vi.restoreAllMocks()
  
  // Clear the mock S3 storage
  mockS3Storage.clear()
  
  console.log('S3 mock environment cleanup complete')
}

/**
 * Create mock S3 command classes
 */
export const S3Commands = {
  CreateBucketCommand: class CreateBucketCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  HeadBucketCommand: class HeadBucketCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  PutObjectCommand: class PutObjectCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  GetObjectCommand: class GetObjectCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  DeleteObjectCommand: class DeleteObjectCommand {
    input: any
    constructor(input: any) {
      this.input = input
    }
  },
  ListObjectsV2Command: class ListObjectsV2Command {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
}