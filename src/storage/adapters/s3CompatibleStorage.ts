/**
 * S3-Compatible Storage Adapter
 * Uses the AWS S3 client to interact with S3-compatible storage services
 * including Amazon S3, Cloudflare R2, and Google Cloud Storage
 */

import { GraphVerb, HNSWNoun } from '../../coreTypes.js'
import { BaseStorage, NOUNS_DIR, VERBS_DIR, METADATA_DIR, INDEX_DIR } from '../baseStorage.js'

// Type aliases for better readability
type HNSWNode = HNSWNoun
type Edge = GraphVerb

// Export R2Storage as an alias for S3CompatibleStorage
export { S3CompatibleStorage as R2Storage }

// S3 client and command types - dynamically imported to avoid issues in browser environments
type S3Client = any
type S3Command = any

/**
 * S3-compatible storage adapter for server environments
 * Uses the AWS S3 client to interact with S3-compatible storage services
 * including Amazon S3, Cloudflare R2, and Google Cloud Storage
 * 
 * To use this adapter with Amazon S3, you need to provide:
 * - region: AWS region (e.g., 'us-east-1')
 * - credentials: AWS credentials (accessKeyId and secretAccessKey)
 * - bucketName: S3 bucket name
 * 
 * To use this adapter with Cloudflare R2, you need to provide:
 * - accountId: Cloudflare account ID
 * - accessKeyId: R2 access key ID
 * - secretAccessKey: R2 secret access key
 * - bucketName: R2 bucket name
 * 
 * To use this adapter with Google Cloud Storage, you need to provide:
 * - region: GCS region (e.g., 'us-central1')
 * - credentials: GCS credentials (accessKeyId and secretAccessKey)
 * - endpoint: GCS endpoint (e.g., 'https://storage.googleapis.com')
 * - bucketName: GCS bucket name
 */
export class S3CompatibleStorage extends BaseStorage {
  private s3Client: S3Client | null = null
  private bucketName: string
  private serviceType: string
  private region: string
  private endpoint?: string
  private accountId?: string
  private accessKeyId: string
  private secretAccessKey: string
  private sessionToken?: string

  // Prefixes for different types of data
  private nounPrefix: string
  private verbPrefix: string
  private metadataPrefix: string
  private indexPrefix: string

  /**
   * Initialize the storage adapter
   * @param options Configuration options for the S3-compatible storage
   */
  constructor(options: {
    bucketName: string
    region?: string
    endpoint?: string
    accountId?: string
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
    serviceType?: string
  }) {
    super()
    this.bucketName = options.bucketName
    this.region = options.region || 'auto'
    this.endpoint = options.endpoint
    this.accountId = options.accountId
    this.accessKeyId = options.accessKeyId
    this.secretAccessKey = options.secretAccessKey
    this.sessionToken = options.sessionToken
    this.serviceType = options.serviceType || 's3'

    // Set up prefixes for different types of data
    this.nounPrefix = `${NOUNS_DIR}/`
    this.verbPrefix = `${VERBS_DIR}/`
    this.metadataPrefix = `${METADATA_DIR}/`
    this.indexPrefix = `${INDEX_DIR}/`
  }

  /**
   * Initialize the storage adapter
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Import AWS SDK modules only when needed
      const { S3Client } = await import('@aws-sdk/client-s3')

      // Configure the S3 client based on the service type
      const clientConfig: any = {
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        }
      }

      // Add session token if provided
      if (this.sessionToken) {
        clientConfig.credentials.sessionToken = this.sessionToken
      }

      // Add endpoint if provided (for R2, GCS, etc.)
      if (this.endpoint) {
        clientConfig.endpoint = this.endpoint
      }

      // Special configuration for Cloudflare R2
      if (this.serviceType === 'r2' && this.accountId) {
        clientConfig.endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`
      }

      // Create the S3 client
      this.s3Client = new S3Client(clientConfig)

      // Ensure the bucket exists and is accessible
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3')
      await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName
        })
      )

      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.serviceType} storage:`, error)
      throw new Error(
        `Failed to initialize ${this.serviceType} storage: ${error}`
      )
    }
  }

  /**
   * Save a node to storage
   */
  protected async saveNode(node: HNSWNode): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableNode = {
        ...node,
        connections: this.mapToObject(node.connections, (set) =>
          Array.from(set as Set<string>)
        )
      }

      // Import the PutObjectCommand only when needed
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')

      // Save the node to S3-compatible storage
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.nounPrefix}${node.id}.json`,
          Body: JSON.stringify(serializableNode, null, 2),
          ContentType: 'application/json'
        })
      )
    } catch (error) {
      console.error(`Failed to save node ${node.id}:`, error)
      throw new Error(`Failed to save node ${node.id}: ${error}`)
    }
  }

  /**
   * Get a node from storage
   */
  protected async getNode(id: string): Promise<HNSWNode | null> {
    await this.ensureInitialized()

    try {
      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      // Try to get the node from the nouns directory
      const response = await this.s3Client!.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.nounPrefix}${id}.json`
        })
      )

      // Convert the response body to a string
      const bodyContents = await response.Body.transformToString()
      const parsedNode = JSON.parse(bodyContents)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedNode.id,
        vector: parsedNode.vector,
        connections
      }
    } catch (error) {
      // Node not found or other error
      return null
    }
  }

  /**
   * Get all nodes from storage
   */
  protected async getAllNodes(): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // List all objects in the nouns directory
      const listResponse = await this.s3Client!.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: this.nounPrefix
        })
      )

      const nodes: HNSWNode[] = []

      // If there are no objects, return an empty array
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return nodes
      }

      // Get each node
      const nodePromises = listResponse.Contents.map(
        async (object: { Key: string }) => {
          try {
            // Extract node ID from the key (remove prefix and .json extension)
            const nodeId = object.Key.replace(this.nounPrefix, '').replace('.json', '')
            
            // Get the node data
            const response = await this.s3Client!.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            // Convert the response body to a string
            const bodyContents = await response.Body.transformToString()
            const parsedNode = JSON.parse(bodyContents)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
              id: parsedNode.id,
              vector: parsedNode.vector,
              connections
            }
          } catch (error) {
            console.error(`Error getting node from ${object.Key}:`, error)
            return null
          }
        }
      )

      // Wait for all promises to resolve and filter out nulls
      const resolvedNodes = await Promise.all(nodePromises)
      return resolvedNodes.filter((node): node is HNSWNode => node !== null)
    } catch (error) {
      console.error('Failed to get all nodes:', error)
      return []
    }
  }

  /**
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  protected async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      // Get all nodes
      const allNodes = await this.getAllNodes()

      // Filter nodes by noun type using metadata
      const filteredNodes: HNSWNode[] = []
      for (const node of allNodes) {
        const metadata = await this.getMetadata(node.id)
        if (metadata && metadata.noun === nounType) {
          filteredNodes.push(node)
        }
      }

      return filteredNodes
    } catch (error) {
      console.error(`Failed to get nodes by noun type ${nounType}:`, error)
      return []
    }
  }

  /**
   * Delete a node from storage
   */
  protected async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the DeleteObjectCommand only when needed
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

      // Delete the node from S3-compatible storage
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.nounPrefix}${id}.json`
        })
      )
    } catch (error) {
      console.error(`Failed to delete node ${id}:`, error)
      throw new Error(`Failed to delete node ${id}: ${error}`)
    }
  }

  /**
   * Save an edge to storage
   */
  protected async saveEdge(edge: Edge): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableEdge = {
        ...edge,
        connections: this.mapToObject(edge.connections, (set) =>
          Array.from(set as Set<string>)
        )
      }

      // Import the PutObjectCommand only when needed
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')

      // Save the edge to S3-compatible storage
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.verbPrefix}${edge.id}.json`,
          Body: JSON.stringify(serializableEdge, null, 2),
          ContentType: 'application/json'
        })
      )
    } catch (error) {
      console.error(`Failed to save edge ${edge.id}:`, error)
      throw new Error(`Failed to save edge ${edge.id}: ${error}`)
    }
  }

  /**
   * Get an edge from storage
   */
  protected async getEdge(id: string): Promise<Edge | null> {
    await this.ensureInitialized()

    try {
      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      // Try to get the edge from the verbs directory
      const response = await this.s3Client!.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.verbPrefix}${id}.json`
        })
      )

      // Convert the response body to a string
      const bodyContents = await response.Body.transformToString()
      const parsedEdge = JSON.parse(bodyContents)

      // Convert serialized connections back to Map<number, Set<string>>
      const connections = new Map<number, Set<string>>()
      for (const [level, nodeIds] of Object.entries(parsedEdge.connections)) {
        connections.set(Number(level), new Set(nodeIds as string[]))
      }

      return {
        id: parsedEdge.id,
        vector: parsedEdge.vector,
        connections,
        sourceId: parsedEdge.sourceId,
        targetId: parsedEdge.targetId,
        type: parsedEdge.type,
        weight: parsedEdge.weight,
        metadata: parsedEdge.metadata
      }
    } catch (error) {
      // Edge not found or other error
      return null
    }
  }

  /**
   * Get all edges from storage
   */
  protected async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // List all objects in the verbs directory
      const listResponse = await this.s3Client!.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: this.verbPrefix
        })
      )

      const edges: Edge[] = []

      // If there are no objects, return an empty array
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return edges
      }

      // Get each edge
      const edgePromises = listResponse.Contents.map(
        async (object: { Key: string }) => {
          try {
            // Extract edge ID from the key (remove prefix and .json extension)
            const edgeId = object.Key.replace(this.verbPrefix, '').replace('.json', '')
            
            // Get the edge data
            const response = await this.s3Client!.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            // Convert the response body to a string
            const bodyContents = await response.Body.transformToString()
            const parsedEdge = JSON.parse(bodyContents)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(parsedEdge.connections)) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
              id: parsedEdge.id,
              vector: parsedEdge.vector,
              connections,
              sourceId: parsedEdge.sourceId,
              targetId: parsedEdge.targetId,
              type: parsedEdge.type,
              weight: parsedEdge.weight,
              metadata: parsedEdge.metadata
            }
          } catch (error) {
            console.error(`Error getting edge from ${object.Key}:`, error)
            return null
          }
        }
      )

      // Wait for all promises to resolve and filter out nulls
      const resolvedEdges = await Promise.all(edgePromises)
      return resolvedEdges.filter((edge): edge is Edge => edge !== null)
    } catch (error) {
      console.error('Failed to get all edges:', error)
      return []
    }
  }

  /**
   * Get edges by source
   */
  protected async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    const edges = await this.getAllEdges()
    return edges.filter((edge) => edge.sourceId === sourceId)
  }

  /**
   * Get edges by target
   */
  protected async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    const edges = await this.getAllEdges()
    return edges.filter((edge) => edge.targetId === targetId)
  }

  /**
   * Get edges by type
   */
  protected async getEdgesByType(type: string): Promise<Edge[]> {
    const edges = await this.getAllEdges()
    return edges.filter((edge) => edge.type === type)
  }

  /**
   * Delete an edge from storage
   */
  protected async deleteEdge(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the DeleteObjectCommand only when needed
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

      // Delete the edge from S3-compatible storage
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.verbPrefix}${id}.json`
        })
      )
    } catch (error) {
      console.error(`Failed to delete edge ${id}:`, error)
      throw new Error(`Failed to delete edge ${id}: ${error}`)
    }
  }

  /**
   * Save metadata to storage
   */
  public async saveMetadata(id: string, metadata: any): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the PutObjectCommand only when needed
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')

      // Save the metadata to S3-compatible storage
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.metadataPrefix}${id}.json`,
          Body: JSON.stringify(metadata, null, 2),
          ContentType: 'application/json'
        })
      )
    } catch (error) {
      console.error(`Failed to save metadata ${id}:`, error)
      throw new Error(`Failed to save metadata ${id}: ${error}`)
    }
  }

  /**
   * Get metadata from storage
   */
  public async getMetadata(id: string): Promise<any | null> {
    await this.ensureInitialized()

    try {
      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      // Try to get the metadata from the metadata directory
      const response = await this.s3Client!.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: `${this.metadataPrefix}${id}.json`
        })
      )

      // Convert the response body to a string
      const bodyContents = await response.Body.transformToString()
      return JSON.parse(bodyContents)
    } catch (error) {
      // Metadata not found or other error
      return null
    }
  }

  /**
   * Clear all data from storage
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and DeleteObjectCommand only when needed
      const { ListObjectsV2Command, DeleteObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // Helper function to delete all objects with a given prefix
      const deleteObjectsWithPrefix = async (prefix: string): Promise<void> => {
        // List all objects with the given prefix
        const listResponse = await this.s3Client!.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix
          })
        )

        // If there are no objects, return
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
          return
        }

        // Delete each object
        for (const object of listResponse.Contents) {
          await this.s3Client!.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key
            })
          )
        }
      }

      // Delete all objects in the nouns directory
      await deleteObjectsWithPrefix(this.nounPrefix)

      // Delete all objects in the verbs directory
      await deleteObjectsWithPrefix(this.verbPrefix)

      // Delete all objects in the metadata directory
      await deleteObjectsWithPrefix(this.metadataPrefix)

      // Delete all objects in the index directory
      await deleteObjectsWithPrefix(this.indexPrefix)
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw new Error(`Failed to clear storage: ${error}`)
    }
  }

  /**
   * Get information about storage usage and capacity
   */
  public async getStorageStatus(): Promise<{
    type: string
    used: number
    quota: number | null
    details?: Record<string, any>
  }> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command only when needed
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')

      // Calculate the total size of all objects in the storage
      let totalSize = 0
      let nodeCount = 0
      let edgeCount = 0
      let metadataCount = 0

      // Helper function to calculate size and count for a given prefix
      const calculateSizeAndCount = async (
        prefix: string
      ): Promise<{ size: number; count: number }> => {
        let size = 0
        let count = 0

        // List all objects with the given prefix
        const listResponse = await this.s3Client!.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix
          })
        )

        // If there are no objects, return
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
          return { size, count }
        }

        // Calculate size and count
        for (const object of listResponse.Contents) {
          size += object.Size || 0
          count++
        }

        return { size, count }
      }

      // Calculate size and count for each directory
      const nounsResult = await calculateSizeAndCount(this.nounPrefix)
      const verbsResult = await calculateSizeAndCount(this.verbPrefix)
      const metadataResult = await calculateSizeAndCount(this.metadataPrefix)
      const indexResult = await calculateSizeAndCount(this.indexPrefix)

      totalSize = nounsResult.size + verbsResult.size + metadataResult.size + indexResult.size
      nodeCount = nounsResult.count
      edgeCount = verbsResult.count
      metadataCount = metadataResult.count

      // Count nouns by type using metadata
      const nounTypeCounts: Record<string, number> = {}

      // List all objects in the metadata directory
      const metadataListResponse = await this.s3Client!.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: this.metadataPrefix
        })
      )

      if (metadataListResponse.Contents) {
        // Import the GetObjectCommand only when needed
        const { GetObjectCommand } = await import('@aws-sdk/client-s3')

        for (const object of metadataListResponse.Contents) {
          try {
            // Get the metadata
            const response = await this.s3Client!.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            // Convert the response body to a string
            const bodyContents = await response.Body.transformToString()
            const metadata = JSON.parse(bodyContents)

            // Count by noun type
            if (metadata.noun) {
              nounTypeCounts[metadata.noun] = (nounTypeCounts[metadata.noun] || 0) + 1
            }
          } catch (error) {
            console.error(`Error getting metadata from ${object.Key}:`, error)
          }
        }
      }

      return {
        type: this.serviceType,
        used: totalSize,
        quota: null, // S3-compatible services typically don't provide quota information through the API
        details: {
          bucketName: this.bucketName,
          region: this.region,
          endpoint: this.endpoint,
          nodeCount,
          edgeCount,
          metadataCount,
          nounTypes: nounTypeCounts
        }
      }
    } catch (error) {
      console.error('Failed to get storage status:', error)
      return {
        type: this.serviceType,
        used: 0,
        quota: null,
        details: { error: String(error) }
      }
    }
  }
}