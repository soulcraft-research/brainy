import { GraphVerb, HNSWNoun, StorageAdapter } from '../coreTypes.js'

// Type aliases for compatibility
type HNSWNode = HNSWNoun;
type Edge = GraphVerb;

// Constants for S3 bucket prefixes
const NODES_PREFIX = 'nodes/'
const EDGES_PREFIX = 'edges/'
const METADATA_PREFIX = 'metadata/'

// Constants for noun type prefixes
const PERSON_PREFIX = 'nodes/person/'
const PLACE_PREFIX = 'place/'
const THING_PREFIX = 'thing/'
const EVENT_PREFIX = 'event/'
const CONCEPT_PREFIX = 'concept/'
const CONTENT_PREFIX = 'content/'
const DEFAULT_PREFIX = 'default/' // For nodes without a noun type

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
    return this.saveNode(noun);
  }

  public async getNoun(id: string): Promise<HNSWNoun | null> {
    return this.getNode(id);
  }

  public async getAllNouns(): Promise<HNSWNoun[]> {
    return this.getAllNodes();
  }

  public async getNounsByNounType(nounType: string): Promise<HNSWNoun[]> {
    return this.getNodesByNounType(nounType);
  }

  public async deleteNoun(id: string): Promise<void> {
    return this.deleteNode(id);
  }

  public async saveVerb(verb: GraphVerb): Promise<void> {
    return this.saveEdge(verb);
  }

  public async getVerb(id: string): Promise<GraphVerb | null> {
    return this.getEdge(id);
  }

  public async getAllVerbs(): Promise<GraphVerb[]> {
    return this.getAllEdges();
  }

  public async getVerbsBySource(sourceId: string): Promise<GraphVerb[]> {
    return this.getEdgesBySource(sourceId);
  }

  public async getVerbsByTarget(targetId: string): Promise<GraphVerb[]> {
    return this.getEdgesByTarget(targetId);
  }

  public async getVerbsByType(type: string): Promise<GraphVerb[]> {
    return this.getEdgesByType(type);
  }

  public async deleteVerb(id: string): Promise<void> {
    return this.deleteEdge(id);
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
              throw new Error('endpoint is required for custom S3-compatible services')
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
        throw new Error(`Failed to import AWS SDK: ${importError}. Make sure @aws-sdk/client-s3 is installed.`)
      }
    } catch (error) {
      console.error(`Failed to initialize ${this.serviceType} storage:`, error)
      throw new Error(`Failed to initialize ${this.serviceType} storage: ${error}`)
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
        connections: this.mapToObject(node.connections, (set) => Array.from(set as Set<string>))
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
      // Get the appropriate prefix based on the node's metadata
      const nodePrefix = await this.getNodePrefix(id)

      // Import the GetObjectCommand only when needed
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')

      try {
        // Try to get the node from S3-compatible storage
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: `${nodePrefix}${id}.json`
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
        // If the node is not found in the expected prefix, try other prefixes
        if (nodePrefix !== DEFAULT_PREFIX) {
          // Try the default prefix
          try {
            const response = await this.s3Client.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: `${NODES_PREFIX}${DEFAULT_PREFIX}${id}.json`
              })
            )

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
          } catch {
            // If not found in default prefix, try all other prefixes
            const prefixes = [
              PERSON_PREFIX,
              PLACE_PREFIX,
              THING_PREFIX,
              EVENT_PREFIX,
              CONCEPT_PREFIX,
              CONTENT_PREFIX
            ]

            for (const prefix of prefixes) {
              if (prefix === nodePrefix) continue // Skip the already checked prefix

              try {
                const response = await this.s3Client.send(
                  new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: `${NODES_PREFIX}${prefix}${id}.json`
                  })
                )

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
              } catch {
                // Continue to the next prefix
              }
            }
          }
        }

        return null // Node not found in any prefix
      }
    } catch (error) {
      console.error(`Failed to get node ${id}:`, error)
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
      // Determine the prefix based on the noun type
      let prefix: string
      switch (nounType) {
        case 'person':
          prefix = PERSON_PREFIX
          break
        case 'place':
          prefix = PLACE_PREFIX
          break
        case 'thing':
          prefix = THING_PREFIX
          break
        case 'event':
          prefix = EVENT_PREFIX
          break
        case 'concept':
          prefix = CONCEPT_PREFIX
          break
        case 'content':
          prefix = CONTENT_PREFIX
          break
        default:
          prefix = DEFAULT_PREFIX
      }

      // Import the ListObjectsV2Command and GetObjectCommand only when needed
      const { ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3')

      // List all objects with the specified prefix
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: `${NODES_PREFIX}${prefix}`
        })
      )

      const nodes: HNSWNode[] = []

      // If there are no objects, return an empty array
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return nodes
      }

      // Get each node
      const nodePromises = listResponse.Contents.map(async (object: { Key: string }) => {
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
          for (const [level, nodeIds] of Object.entries(parsedNode.connections)) {
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
      })

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
      // Get all noun types
      const nounTypes = [
        'person',
        'place',
        'thing',
        'event',
        'concept',
        'content',
        'default'
      ]

      // Run searches in parallel for all noun types
      const nodePromises = nounTypes.map(nounType => this.getNodesByNounType(nounType))
      const nodeArrays = await Promise.all(nodePromises)

      // Combine all results
      const allNodes: HNSWNode[] = []
      for (const nodes of nodeArrays) {
        allNodes.push(...nodes)
      }

      return allNodes
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
      // Get the appropriate prefix based on the node's metadata
      const nodePrefix = await this.getNodePrefix(id)

      // Import the DeleteObjectCommand only when needed
      const { DeleteObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3')

      try {
        // Check if the node exists before deleting
        await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: `${nodePrefix}${id}.json`
          })
        )

        // Delete the node
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: `${nodePrefix}${id}.json`
          })
        )
        return // Node found and deleted
      } catch {
        // If the node is not found in the expected prefix, try other prefixes
        if (nodePrefix !== DEFAULT_PREFIX) {
          try {
            // Try the default prefix
            await this.s3Client.send(
              new GetObjectCommand({
                Bucket: this.bucketName,
                Key: `${NODES_PREFIX}${DEFAULT_PREFIX}${id}.json`
              })
            )

            // Delete the node
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: `${NODES_PREFIX}${DEFAULT_PREFIX}${id}.json`
              })
            )
            return // Node found and deleted
          } catch {
            // If not found in default prefix, try all other prefixes
            const prefixes = [
              PERSON_PREFIX,
              PLACE_PREFIX,
              THING_PREFIX,
              EVENT_PREFIX,
              CONCEPT_PREFIX,
              CONTENT_PREFIX
            ]

            for (const prefix of prefixes) {
              if (prefix === nodePrefix) continue // Skip the already checked prefix

              try {
                await this.s3Client.send(
                  new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: `${NODES_PREFIX}${prefix}${id}.json`
                  })
                )

                // Delete the node
                await this.s3Client.send(
                  new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: `${NODES_PREFIX}${prefix}${id}.json`
                  })
                )
                return // Node found and deleted
              } catch {
                // Continue to the next prefix
              }
            }
          }
        }

        return // Node not found in any prefix, nothing to delete
      }
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
        connections: this.mapToObject(edge.connections, (set) => Array.from(set as Set<string>))
      }

      // Import the PutObjectCommand only when needed
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')

      // Save the edge to S3-compatible storage
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: `${EDGES_PREFIX}${edge.id}.json`,
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
            Key: `${EDGES_PREFIX}${id}.json`
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
      const { ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3')

      // List all objects with the edges prefix
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: EDGES_PREFIX
        })
      )

      const edges: Edge[] = []

      // If there are no objects, return an empty array
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        return edges
      }

      // Get each edge
      const edgePromises = listResponse.Contents.map(async (object: { Key: string }) => {
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
          console.error(`Failed to get edge from ${object.Key}:`, error)
          return null
        }
      })

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
      return allEdges.filter(edge => edge.sourceId === sourceId)
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
      return allEdges.filter(edge => edge.targetId === targetId)
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
      return allEdges.filter(edge => edge.type === type)
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
      const { DeleteObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3')

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
      const { ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

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
      const deletePromises = listResponse.Contents.map(async (object: { Key: string }) => {
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
      })

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
    type: string;
    used: number;
    quota: number | null;
    details?: Record<string, any>;
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
          if (key.startsWith(NODES_PREFIX)) {
            nodeCount++
          } else if (key.startsWith(EDGES_PREFIX)) {
            edgeCount++
          } else if (key.startsWith(METADATA_PREFIX)) {
            metadataCount++
          }
        }
      }

      // Count nodes by noun type
      const nounTypeCounts: Record<string, number> = {
        person: 0,
        place: 0,
        thing: 0,
        event: 0,
        concept: 0,
        content: 0,
        default: 0
      }

      // List objects for each noun type prefix
      const nounTypes = [
        { type: 'person', prefix: PERSON_PREFIX },
        { type: 'place', prefix: PLACE_PREFIX },
        { type: 'thing', prefix: THING_PREFIX },
        { type: 'event', prefix: EVENT_PREFIX },
        { type: 'concept', prefix: CONCEPT_PREFIX },
        { type: 'content', prefix: CONTENT_PREFIX },
        { type: 'default', prefix: DEFAULT_PREFIX }
      ]

      for (const { type, prefix } of nounTypes) {
        const listResponse = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: `${NODES_PREFIX}${prefix}`
          })
        )

        nounTypeCounts[type] = listResponse.Contents?.length || 0
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
   * Get the appropriate prefix for a node based on its metadata
   */
  private async getNodePrefix(id: string): Promise<string> {
    try {
      // Try to get the metadata for the node
      const metadata = await this.getMetadata(id)

      // If metadata exists and has a noun field, use the corresponding prefix
      if (metadata && metadata.noun) {
        switch (metadata.noun) {
          case 'person':
            return PERSON_PREFIX
          case 'place':
            return PLACE_PREFIX
          case 'thing':
            return THING_PREFIX
          case 'event':
            return EVENT_PREFIX
          case 'concept':
            return CONCEPT_PREFIX
          case 'content':
            return CONTENT_PREFIX
          default:
            return DEFAULT_PREFIX
        }
      }

      // If no metadata or no noun field, use the default prefix
      return DEFAULT_PREFIX
    } catch (error) {
      // If there's an error getting the metadata, use the default prefix
      return DEFAULT_PREFIX
    }
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

/**
 * Cloudflare R2 storage adapter for server environments
 * This class is maintained for backward compatibility
 * It is recommended to use S3CompatibleStorage directly for new code
 * 
 * @deprecated Use S3CompatibleStorage with serviceType: 'r2' instead
 */
export class R2Storage extends S3CompatibleStorage {
  constructor(options: {
    bucketName: string
    accountId: string
    accessKeyId: string
    secretAccessKey: string
  }) {
    super({
      bucketName: options.bucketName,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      accountId: options.accountId,
      serviceType: 'r2'
    });
  }
}
