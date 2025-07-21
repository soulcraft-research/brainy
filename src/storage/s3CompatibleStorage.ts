import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'

// Type aliases for compatibility
type HNSWNode = HNSWNoun
type Edge = GraphVerb

// Export R2Storage as an alias for S3CompatibleStorage
export { S3CompatibleStorage as R2Storage }

// Constants for S3 bucket prefixes
const NOUNS_PREFIX = 'nouns/'
const VERBS_PREFIX = 'verbs/'
const EDGES_PREFIX = 'verbs/' // Alias for VERBS_PREFIX for edge operations
const METADATA_PREFIX = 'metadata/'

// All nouns now use the same prefix - no separate directories per noun type
const NOUN_PREFIX = 'nouns/' // Single directory for all noun types

/**
 * S3-compatible storage adapter for server environments
 * Uses the AWS S3 client to interact with S3-compatible storage services
 * including Amazon S3, Cloudflare R2, and Google Cloud Storage
 *
 * To use this adapter with Cloudflare R2, you need to provide:
 * - bucketName: Your bucket name
 * - accountId: Your Cloudflare account ID
 * - accessKeyId: R2 access key ID
 * - secretAccessKey: R2 secret access key
 * - serviceType: 'r2'
 *
 * To use this adapter with Amazon S3, you need to provide:
 * - bucketName: Your S3 bucket name
 * - accessKeyId: AWS access key ID
 * - secretAccessKey: AWS secret access key
 * - region: AWS region (e.g., 'us-east-1')
 * - serviceType: 's3'
 *
 * To use this adapter with Google Cloud Storage, you need to provide:
 * - bucketName: Your GCS bucket name
 * - accessKeyId: HMAC access key
 * - secretAccessKey: HMAC secret
 * - endpoint: GCS endpoint (e.g., 'https://storage.googleapis.com')
 * - serviceType: 'gcs'
 *
 * For other S3-compatible services, provide:
 * - bucketName: Your bucket name
 * - accessKeyId: Access key ID
 * - secretAccessKey: Secret access key
 * - endpoint: Service endpoint URL
 * - region: Region (if required)
 * - serviceType: 'custom'
 */
export class S3CompatibleStorage implements StorageAdapter {
  private bucketName: string
  private accessKeyId: string
  private secretAccessKey: string
  private endpoint?: string
  private region?: string
  private accountId?: string
  private serviceType: 'r2' | 's3' | 'gcs' | 'custom'
  private s3Client: any // Will be initialized in init()
  private isInitialized = false

  // Alias methods to match StorageAdapter interface
  public async saveNoun(noun: HNSWNoun): Promise<void> {
    return this.saveNode(noun)
  }

  public async getNoun(id: string): Promise<HNSWNoun | null> {
    return this.getNode(id)
  }

  public async getAllNouns(): Promise<HNSWNoun[]> {
    return this.getAllNodes()
  }

  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    return this.getNodesByNounType(nounType)
  }

  public async deleteNoun(id: string): Promise<void> {
    return this.deleteNode(id)
  }

  public async saveVerb(verb: GraphVerb): Promise<void> {
    return this.saveEdge(verb)
  }

  public async getVerb(id: string): Promise<GraphVerb | null> {
    return this.getEdge(id)
  }

  public async getAllVerbs(): Promise<GraphVerb[]> {
    return this.getAllEdges()
  }

  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    return this.getEdgesBySource(sourceId)
  }

  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    return this.getEdgesByTarget(targetId)
  }

  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    return this.getEdgesByType(type)
  }

  public async deleteVerb(id: string): Promise<void> {
    return this.deleteEdge(id)
  }

  constructor(options: {
    bucketName: string
    accessKeyId: string
    secretAccessKey: string
    serviceType: 'r2' | 's3' | 'gcs' | 'custom'
    accountId?: string
    region?: string
    endpoint?: string
  }) {
    this.bucketName = options.bucketName
    this.accessKeyId = options.accessKeyId
    this.secretAccessKey = options.secretAccessKey
    this.serviceType = options.serviceType
    this.accountId = options.accountId
    this.region = options.region
    this.endpoint = options.endpoint
  }

  /**
   * Initialize the storage adapter
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Dynamically import the AWS SDK to avoid bundling it in browser environments
      try {
        const { S3Client } = await import('@aws-sdk/client-s3')

        // Configure the S3 client based on the service type
        const clientConfig: any = {
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey
          }
        }

        switch (this.serviceType) {
          case 'r2':
            if (!this.accountId) {
              throw new Error('accountId is required for Cloudflare R2')
            }
            clientConfig.region = 'auto' // R2 uses 'auto' as the region
            clientConfig.endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`
            break

          case 's3':
            if (!this.region) {
              throw new Error('region is required for Amazon S3')
            }
            clientConfig.region = this.region
            // No endpoint needed for standard S3
            break

          case 'gcs':
            if (!this.endpoint) {
              // Default GCS endpoint if not provided
              this.endpoint = 'https://storage.googleapis.com'
            }
            clientConfig.endpoint = this.endpoint
            clientConfig.region = this.region || 'auto'
            break

          case 'custom':
            if (!this.endpoint) {
              throw new Error(
                'endpoint is required for custom S3-compatible services'
              )
            }
            clientConfig.endpoint = this.endpoint
            if (this.region) {
              clientConfig.region = this.region
            }
            break

          default:
            throw new Error(`Unsupported service type: ${this.serviceType}`)
        }

        // Initialize the S3 client with the configured options
        this.s3Client = new S3Client(clientConfig)

        this.isInitialized = true
      } catch (importError) {
        throw new Error(
          `Failed to import AWS SDK: ${importError}. Make sure @aws-sdk/client-s3 is installed.`
        )
      }
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
  public async saveNode(node: HNSWNode): Promise<void> {
    await this.ensureInitialized()

    try {
      // Convert connections Map to a serializable format
      const serializableNode = {
        ...node,
        connections: this.mapToObject(node.connections, (set) =>
          Array.from(set as Set<string>)
        )
      }

      // Get the appropriate prefix based on the node's metadata
      const nodePrefix = await this.getNodePrefix(node.id)

      // Import the PutObjectCommand only when needed
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')

      // Save the node to S3-compatible storage
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${nodePrefix}${node.id}.json`,
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
  public async getNode(id: string): Promise<HNSWNode | null> {
    await this.ensureInitialized()

    try {
      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      // Try to get the node from the consolidated nouns directory
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: `${NOUN_PREFIX}${id}.json`
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
   * Get nodes by noun type
   * @param nounType The noun type to filter by
   * @returns Promise that resolves to an array of nodes of the specified noun type
   */
  public async getNodesByNounType(nounType: string): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // List all objects in the consolidated nouns directory
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: NOUN_PREFIX
        })
      )

      const nodes: HNSWNode[] = []

      // If there are no objects, return an empty array
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return nodes
      }

      // Get each node and filter by noun type
      const nodePromises = listResponse.Contents.map(
        async (object: { Key: string }) => {
          try {
            // Extract node ID from the key (remove prefix and .json extension)
            const nodeId = object.Key.replace(NOUN_PREFIX, '').replace('.json', '')
            
            // Get the metadata to check the noun type
            const metadata = await this.getMetadata(nodeId)
            
            // Skip if metadata doesn't exist or noun type doesn't match
            if (!metadata || metadata.noun !== nounType) {
              return null
            }

            const response = await this.s3Client.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            const bodyContents = await response.Body.transformToString()
            const parsedNode = JSON.parse(bodyContents)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(
              parsedNode.connections
            )) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
              id: parsedNode.id,
              vector: parsedNode.vector,
              connections
            }
          } catch (error) {
            console.error(`Failed to get node from ${object.Key}:`, error)
            return null
          }
        }
      )

      const nodeResults = await Promise.all(nodePromises)
      return nodeResults.filter((node): node is HNSWNode => node !== null)
    } catch (error) {
      console.error(`Failed to get nodes for noun type ${nounType}:`, error)
      throw new Error(`Failed to get nodes for noun type ${nounType}: ${error}`)
    }
  }

  /**
   * Get all nodes from storage
   */
  public async getAllNodes(): Promise<HNSWNode[]> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // List all objects in the consolidated nouns directory
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: NOUN_PREFIX
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
            const response = await this.s3Client.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            const bodyContents = await response.Body.transformToString()
            const parsedNode = JSON.parse(bodyContents)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(
              parsedNode.connections
            )) {
              connections.set(Number(level), new Set(nodeIds as string[]))
            }

            return {
              id: parsedNode.id,
              vector: parsedNode.vector,
              connections
            }
          } catch (error) {
            console.error(`Failed to get node from ${object.Key}:`, error)
            return null
          }
        }
      )

      const nodeResults = await Promise.all(nodePromises)
      return nodeResults.filter((node): node is HNSWNode => node !== null)
    } catch (error) {
      console.error('Failed to get all nodes:', error)
      throw new Error(`Failed to get all nodes: ${error}`)
    }
  }

  /**
   * Delete a node from storage
   */
  public async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the DeleteObjectCommand only when needed
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

      // Delete the node from the consolidated nouns directory
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: `${NOUN_PREFIX}${id}.json`
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
  public async saveEdge(edge: Edge): Promise<void> {
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
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${VERBS_PREFIX}${edge.id}.json`,
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
  public async getEdge(id: string): Promise<Edge | null> {
    await this.ensureInitialized()

    try {
      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      try {
        // Try to get the edge from S3-compatible storage
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: `${VERBS_PREFIX}${id}.json`
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
      } catch {
        return null // Edge not found
      }
    } catch (error) {
      console.error(`Failed to get edge ${id}:`, error)
      return null
    }
  }

  /**
   * Get all edges from storage
   */
  public async getAllEdges(): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      // List all objects with the edges prefix
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: VERBS_PREFIX
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
            const response = await this.s3Client.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )

            const bodyContents = await response.Body.transformToString()
            const parsedEdge = JSON.parse(bodyContents)

            // Convert serialized connections back to Map<number, Set<string>>
            const connections = new Map<number, Set<string>>()
            for (const [level, nodeIds] of Object.entries(
              parsedEdge.connections
            )) {
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
            console.error(`Failed to get edge from ${object.Key}:`, error)
            return null
          }
        }
      )

      const edgeResults = await Promise.all(edgePromises)
      return edgeResults.filter((edge): edge is Edge => edge !== null)
    } catch (error) {
      console.error('Failed to get all edges:', error)
      throw new Error(`Failed to get all edges: ${error}`)
    }
  }

  /**
   * Get edges by source node ID
   */
  public async getEdgesBySource(sourceId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.sourceId === sourceId)
    } catch (error) {
      console.error(`Failed to get edges by source ${sourceId}:`, error)
      throw new Error(`Failed to get edges by source ${sourceId}: ${error}`)
    }
  }

  /**
   * Get edges by target node ID
   */
  public async getEdgesByTarget(targetId: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.targetId === targetId)
    } catch (error) {
      console.error(`Failed to get edges by target ${targetId}:`, error)
      throw new Error(`Failed to get edges by target ${targetId}: ${error}`)
    }
  }

  /**
   * Get edges by type
   */
  public async getEdgesByType(type: string): Promise<Edge[]> {
    await this.ensureInitialized()

    try {
      const allEdges = await this.getAllEdges()
      return allEdges.filter((edge) => edge.type === type)
    } catch (error) {
      console.error(`Failed to get edges by type ${type}:`, error)
      throw new Error(`Failed to get edges by type ${type}: ${error}`)
    }
  }

  /**
   * Delete an edge from storage
   */
  public async deleteEdge(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      // Import the DeleteObjectCommand and GetObjectCommand only when needed
      const { DeleteObjectCommand, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      )

      try {
        // Check if the edge exists before deleting
        await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: `${EDGES_PREFIX}${id}.json`
          })
        )

        // Delete the edge
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: `${EDGES_PREFIX}${id}.json`
          })
        )
      } catch {
        // Edge not found, nothing to delete
        return
      }
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
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${METADATA_PREFIX}${id}.json`,
          Body: JSON.stringify(metadata, null, 2),
          ContentType: 'application/json'
        })
      )
    } catch (error) {
      console.error(`Failed to save metadata for ${id}:`, error)
      throw new Error(`Failed to save metadata for ${id}: ${error}`)
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

      try {
        // Try to get the metadata from S3-compatible storage
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: `${METADATA_PREFIX}${id}.json`
          })
        )

        // Convert the response body to a string
        const bodyContents = await response.Body.transformToString()
        return JSON.parse(bodyContents)
      } catch {
        return null // Metadata not found
      }
    } catch (error) {
      console.error(`Failed to get metadata for ${id}:`, error)
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

      // List all objects in the bucket
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName
        })
      )

      // If there are no objects, return
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return
      }

      // Delete each object
      const deletePromises = listResponse.Contents.map(
        async (object: { Key: string }) => {
          try {
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: object.Key
              })
            )
          } catch (error) {
            console.error(`Failed to delete object ${object.Key}:`, error)
          }
        }
      )

      await Promise.all(deletePromises)
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

      // List all objects in the bucket to calculate total size
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName
        })
      )

      let totalSize = 0
      let nodeCount = 0
      let edgeCount = 0
      let metadataCount = 0

      // Calculate total size and counts
      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          totalSize += object.Size || 0

          const key = object.Key || ''
          if (key.startsWith(NOUNS_PREFIX)) {
            nodeCount++
          } else if (key.startsWith(VERBS_PREFIX)) {
            edgeCount++
          } else if (key.startsWith(METADATA_PREFIX)) {
            metadataCount++
          }
        }
      }

      // Count nodes by noun type by examining metadata
      const nounTypeCounts: Record<string, number> = {
        person: 0,
        place: 0,
        thing: 0,
        event: 0,
        concept: 0,
        content: 0,
        group: 0,
        list: 0,
        category: 0,
        default: 0
      }

      // List all noun objects and count by type using metadata
      const nounsListResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: NOUN_PREFIX
        })
      )

      if (nounsListResponse.Contents) {
        for (const object of nounsListResponse.Contents) {
          try {
            // Extract node ID from the key
            const nodeId = object.Key?.replace(NOUN_PREFIX, '').replace('.json', '')
            if (nodeId) {
              // Get metadata to determine noun type
              const metadata = await this.getMetadata(nodeId)
              const nounType = metadata?.noun || 'default'
              
              if (nounType in nounTypeCounts) {
                nounTypeCounts[nounType]++
              } else {
                nounTypeCounts.default++
              }
            }
          } catch (error) {
            // If we can't get metadata, count as default
            nounTypeCounts.default++
          }
        }
      }

      return {
        type: this.serviceType,
        used: totalSize,
        quota: null, // S3-compatible services typically don't provide quota information through the API
        details: {
          nodeCount,
          edgeCount,
          metadataCount,
          nounTypes: {
            person: { count: nounTypeCounts.person },
            place: { count: nounTypeCounts.place },
            thing: { count: nounTypeCounts.thing },
            event: { count: nounTypeCounts.event },
            concept: { count: nounTypeCounts.concept },
            content: { count: nounTypeCounts.content },
            group: { count: nounTypeCounts.group },
            list: { count: nounTypeCounts.list },
            category: { count: nounTypeCounts.category },
            default: { count: nounTypeCounts.default }
          }
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

  /**
   * Ensure the storage adapter is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init()
    }
  }

  /**
   * Get the appropriate prefix for a node - now all nouns use the same prefix
   */
  private async getNodePrefix(id: string): Promise<string> {
    // All nouns now use the same prefix regardless of type
    return NOUN_PREFIX
  }

  /**
   * Convert a Map to a plain object for serialization
   */
  private mapToObject<K extends string | number, V>(
    map: Map<K, V>,
    valueTransformer: (value: V) => any = (v) => v
  ): Record<string, any> {
    const obj: Record<string, any> = {}
    for (const [key, value] of map.entries()) {
      obj[key.toString()] = valueTransformer(value)
    }
    return obj
  }
}
