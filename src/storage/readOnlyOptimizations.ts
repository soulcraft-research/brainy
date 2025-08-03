/**
 * Read-Only Storage Optimizations for Production Deployments
 * Implements compression, memory-mapping, and pre-built index segments
 */

import { HNSWNoun, HNSWVerb, Vector } from '../coreTypes.js'

// Compression types supported
enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  BROTLI = 'brotli',
  QUANTIZATION = 'quantization',
  HYBRID = 'hybrid'
}

// Vector quantization methods
enum QuantizationType {
  SCALAR = 'scalar',      // 8-bit scalar quantization
  PRODUCT = 'product',    // Product quantization
  BINARY = 'binary'       // Binary quantization
}

interface CompressionConfig {
  vectorCompression: CompressionType
  metadataCompression: CompressionType
  quantizationType?: QuantizationType
  quantizationBits?: number
  compressionLevel?: number
}

interface ReadOnlyConfig {
  prebuiltIndexPath?: string
  memoryMapped?: boolean
  compression: CompressionConfig
  segmentSize?: number // For index segmentation
  prefetchSegments?: number
  cacheIndexInMemory?: boolean
}

interface IndexSegment {
  id: string
  nodeCount: number
  vectorDimension: number
  compression: CompressionType
  s3Key?: string
  localPath?: string
  loadedInMemory: boolean
  lastAccessed: number
}

/**
 * Read-only storage optimizations for high-performance production deployments
 */
export class ReadOnlyOptimizations {
  private config: Required<ReadOnlyConfig>
  private segments: Map<string, IndexSegment> = new Map()
  private compressionStats = {
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    decompressionTime: 0
  }

  // Quantization codebooks for vector compression
  private quantizationCodebooks: Map<string, Float32Array> = new Map()
  
  // Memory-mapped buffers for large datasets
  private memoryMappedBuffers: Map<string, ArrayBuffer> = new Map()

  constructor(config: Partial<ReadOnlyConfig> = {}) {
    this.config = {
      prebuiltIndexPath: '',
      memoryMapped: true,
      compression: {
        vectorCompression: CompressionType.QUANTIZATION,
        metadataCompression: CompressionType.GZIP,
        quantizationType: QuantizationType.SCALAR,
        quantizationBits: 8,
        compressionLevel: 6
      },
      segmentSize: 10000, // 10k nodes per segment
      prefetchSegments: 3,
      cacheIndexInMemory: false,
      ...config
    }

    if (config.compression) {
      this.config.compression = { ...this.config.compression, ...config.compression }
    }
  }

  /**
   * Compress vector data using specified compression method
   */
  public async compressVector(vector: Vector, segmentId: string): Promise<ArrayBuffer> {
    const startTime = Date.now()
    let compressedData: ArrayBuffer

    switch (this.config.compression.vectorCompression) {
      case CompressionType.QUANTIZATION:
        compressedData = await this.quantizeVector(vector, segmentId)
        break
        
      case CompressionType.GZIP:
        compressedData = await this.gzipCompress(new Float32Array(vector).buffer)
        break
        
      case CompressionType.BROTLI:
        compressedData = await this.brotliCompress(new Float32Array(vector).buffer)
        break
        
      case CompressionType.HYBRID:
        // First quantize, then compress
        const quantized = await this.quantizeVector(vector, segmentId)
        compressedData = await this.gzipCompress(quantized)
        break
        
      default:
        compressedData = new Float32Array(vector).buffer
        break
    }

    // Update compression statistics
    const originalSize = vector.length * 4 // 4 bytes per float32
    this.compressionStats.originalSize += originalSize
    this.compressionStats.compressedSize += compressedData.byteLength
    this.compressionStats.decompressionTime += Date.now() - startTime

    this.updateCompressionRatio()

    return compressedData
  }

  /**
   * Decompress vector data
   */
  public async decompressVector(
    compressedData: ArrayBuffer, 
    segmentId: string,
    originalDimension: number
  ): Promise<Vector> {
    switch (this.config.compression.vectorCompression) {
      case CompressionType.QUANTIZATION:
        return this.dequantizeVector(compressedData, segmentId, originalDimension)
        
      case CompressionType.GZIP:
        const gzipDecompressed = await this.gzipDecompress(compressedData)
        return Array.from(new Float32Array(gzipDecompressed))
        
      case CompressionType.BROTLI:
        const brotliDecompressed = await this.brotliDecompress(compressedData)
        return Array.from(new Float32Array(brotliDecompressed))
        
      case CompressionType.HYBRID:
        const gzipStage = await this.gzipDecompress(compressedData)
        return this.dequantizeVector(gzipStage, segmentId, originalDimension)
        
      default:
        return Array.from(new Float32Array(compressedData))
    }
  }

  /**
   * Scalar quantization of vectors to 8-bit integers
   */
  private async quantizeVector(vector: Vector, segmentId: string): Promise<ArrayBuffer> {
    let codebook = this.quantizationCodebooks.get(segmentId)
    
    if (!codebook) {
      // Create codebook (min/max values for scaling)
      const min = Math.min(...vector)
      const max = Math.max(...vector)
      codebook = new Float32Array([min, max])
      this.quantizationCodebooks.set(segmentId, codebook)
    }

    const [min, max] = codebook
    const scale = (max - min) / 255 // 8-bit quantization
    
    const quantized = new Uint8Array(vector.length)
    for (let i = 0; i < vector.length; i++) {
      quantized[i] = Math.round((vector[i] - min) / scale)
    }

    // Store codebook with quantized data
    const result = new ArrayBuffer(quantized.byteLength + codebook.byteLength)
    const resultView = new Uint8Array(result)
    
    // First 8 bytes: codebook (min, max as float32)
    resultView.set(new Uint8Array(codebook.buffer), 0)
    // Remaining bytes: quantized vector
    resultView.set(quantized, codebook.byteLength)

    return result
  }

  /**
   * Dequantize 8-bit vectors back to float32
   */
  private dequantizeVector(
    quantizedData: ArrayBuffer, 
    segmentId: string, 
    dimension: number
  ): Vector {
    const dataView = new Uint8Array(quantizedData)
    
    // Extract codebook (first 8 bytes)
    const codebookBytes = dataView.slice(0, 8)
    const codebook = new Float32Array(codebookBytes.buffer)
    const [min, max] = codebook
    
    // Extract quantized vector
    const quantized = dataView.slice(8)
    const scale = (max - min) / 255
    
    const result: Vector = []
    for (let i = 0; i < dimension; i++) {
      result[i] = min + quantized[i] * scale
    }

    return result
  }

  /**
   * GZIP compression using browser/Node.js APIs
   */
  private async gzipCompress(data: ArrayBuffer): Promise<ArrayBuffer> {
    if (typeof CompressionStream !== 'undefined') {
      // Browser environment
      const stream = new CompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()
      
      writer.write(new Uint8Array(data))
      writer.close()
      
      const chunks: Uint8Array[] = []
      let result = await reader.read()
      
      while (!result.done) {
        chunks.push(result.value)
        result = await reader.read()
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0
      
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }
      
      return combined.buffer
    } else {
      // Node.js environment - would use zlib
      console.warn('GZIP compression not available, returning original data')
      return data
    }
  }

  /**
   * GZIP decompression
   */
  private async gzipDecompress(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
    if (typeof DecompressionStream !== 'undefined') {
      // Browser environment
      const stream = new DecompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()
      
      writer.write(new Uint8Array(compressedData))
      writer.close()
      
      const chunks: Uint8Array[] = []
      let result = await reader.read()
      
      while (!result.done) {
        chunks.push(result.value)
        result = await reader.read()
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0
      
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }
      
      return combined.buffer
    } else {
      console.warn('GZIP decompression not available, returning original data')
      return compressedData
    }
  }

  /**
   * Brotli compression (placeholder - similar to GZIP)
   */
  private async brotliCompress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Would implement Brotli compression here
    console.warn('Brotli compression not implemented, falling back to GZIP')
    return this.gzipCompress(data)
  }

  /**
   * Brotli decompression (placeholder)
   */
  private async brotliDecompress(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
    console.warn('Brotli decompression not implemented, falling back to GZIP')
    return this.gzipDecompress(compressedData)
  }

  /**
   * Create prebuilt index segments for faster loading
   */
  public async createPrebuiltSegments(
    nodes: HNSWNoun[],
    outputPath: string
  ): Promise<IndexSegment[]> {
    const segments: IndexSegment[] = []
    const segmentSize = this.config.segmentSize

    console.log(`Creating ${Math.ceil(nodes.length / segmentSize)} prebuilt segments`)

    for (let i = 0; i < nodes.length; i += segmentSize) {
      const segmentNodes = nodes.slice(i, i + segmentSize)
      const segmentId = `segment_${Math.floor(i / segmentSize)}`
      
      const segment: IndexSegment = {
        id: segmentId,
        nodeCount: segmentNodes.length,
        vectorDimension: segmentNodes[0]?.vector.length || 0,
        compression: this.config.compression.vectorCompression,
        localPath: `${outputPath}/${segmentId}.dat`,
        loadedInMemory: false,
        lastAccessed: 0
      }

      // Compress and serialize segment data
      const compressedData = await this.compressSegment(segmentNodes)
      
      // In a real implementation, you would write this to disk/S3
      console.log(`Created segment ${segmentId} with ${compressedData.byteLength} bytes`)
      
      segments.push(segment)
      this.segments.set(segmentId, segment)
    }

    return segments
  }

  /**
   * Compress an entire segment of nodes
   */
  private async compressSegment(nodes: HNSWNoun[]): Promise<ArrayBuffer> {
    const serialized = JSON.stringify(nodes.map(node => ({
      id: node.id,
      vector: node.vector,
      connections: this.serializeConnections(node.connections)
    })))

    const encoder = new TextEncoder()
    const data = encoder.encode(serialized)

    // Apply metadata compression
    switch (this.config.compression.metadataCompression) {
      case CompressionType.GZIP:
        return this.gzipCompress(data.buffer)
      case CompressionType.BROTLI:
        return this.brotliCompress(data.buffer)
      default:
        return data.buffer
    }
  }

  /**
   * Load a segment from storage with caching
   */
  public async loadSegment(segmentId: string): Promise<HNSWNoun[]> {
    const segment = this.segments.get(segmentId)
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`)
    }

    segment.lastAccessed = Date.now()

    // Check if segment is already loaded in memory
    if (segment.loadedInMemory && this.memoryMappedBuffers.has(segmentId)) {
      return this.deserializeSegment(this.memoryMappedBuffers.get(segmentId)!)
    }

    // Load from storage (S3, disk, etc.)
    const compressedData = await this.loadSegmentFromStorage(segment)
    
    // Cache in memory if configured
    if (this.config.cacheIndexInMemory) {
      this.memoryMappedBuffers.set(segmentId, compressedData)
      segment.loadedInMemory = true
    }

    return this.deserializeSegment(compressedData)
  }

  /**
   * Load segment data from storage
   */
  private async loadSegmentFromStorage(segment: IndexSegment): Promise<ArrayBuffer> {
    // This would integrate with your S3 storage adapter
    // For now, return a placeholder
    console.log(`Loading segment ${segment.id} from storage`)
    return new ArrayBuffer(0)
  }

  /**
   * Deserialize and decompress segment data
   */
  private async deserializeSegment(compressedData: ArrayBuffer): Promise<HNSWNoun[]> {
    // Decompress metadata
    let decompressed: ArrayBuffer
    
    switch (this.config.compression.metadataCompression) {
      case CompressionType.GZIP:
        decompressed = await this.gzipDecompress(compressedData)
        break
      case CompressionType.BROTLI:
        decompressed = await this.brotliDecompress(compressedData)
        break
      default:
        decompressed = compressedData
        break
    }

    // Parse JSON
    const decoder = new TextDecoder()
    const jsonStr = decoder.decode(decompressed)
    const parsed = JSON.parse(jsonStr)

    // Reconstruct HNSWNoun objects
    return parsed.map((item: any) => ({
      id: item.id,
      vector: item.vector,
      connections: this.deserializeConnections(item.connections)
    }))
  }

  /**
   * Serialize connections Map for storage
   */
  private serializeConnections(connections: Map<number, Set<string>>): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    for (const [level, nodeIds] of connections.entries()) {
      result[level.toString()] = Array.from(nodeIds)
    }
    return result
  }

  /**
   * Deserialize connections from storage format
   */
  private deserializeConnections(serialized: Record<string, string[]>): Map<number, Set<string>> {
    const result = new Map<number, Set<string>>()
    for (const [levelStr, nodeIds] of Object.entries(serialized)) {
      result.set(parseInt(levelStr), new Set(nodeIds))
    }
    return result
  }

  /**
   * Prefetch segments based on access patterns
   */
  public async prefetchSegments(currentSegmentId: string): Promise<void> {
    const segment = this.segments.get(currentSegmentId)
    if (!segment) return

    // Simple prefetching strategy - load adjacent segments
    const segmentNumber = parseInt(currentSegmentId.split('_')[1])
    const toPrefetch: string[] = []

    for (let i = 1; i <= this.config.prefetchSegments; i++) {
      const nextId = `segment_${segmentNumber + i}`
      const prevId = `segment_${segmentNumber - i}`
      
      if (this.segments.has(nextId) && !this.memoryMappedBuffers.has(nextId)) {
        toPrefetch.push(nextId)
      }
      if (this.segments.has(prevId) && !this.memoryMappedBuffers.has(prevId)) {
        toPrefetch.push(prevId)
      }
    }

    // Prefetch in background
    for (const segmentId of toPrefetch) {
      this.loadSegment(segmentId).catch(error => {
        console.warn(`Failed to prefetch segment ${segmentId}:`, error)
      })
    }
  }

  /**
   * Update compression statistics
   */
  private updateCompressionRatio(): void {
    if (this.compressionStats.originalSize > 0) {
      this.compressionStats.compressionRatio = 
        this.compressionStats.compressedSize / this.compressionStats.originalSize
    }
  }

  /**
   * Get compression statistics
   */
  public getCompressionStats(): typeof this.compressionStats & {
    segmentCount: number
    memoryUsage: number
  } {
    const memoryUsage = Array.from(this.memoryMappedBuffers.values())
      .reduce((sum, buffer) => sum + buffer.byteLength, 0)

    return {
      ...this.compressionStats,
      segmentCount: this.segments.size,
      memoryUsage
    }
  }

  /**
   * Cleanup memory-mapped buffers
   */
  public cleanup(): void {
    this.memoryMappedBuffers.clear()
    this.quantizationCodebooks.clear()
    
    // Mark all segments as not loaded
    for (const segment of this.segments.values()) {
      segment.loadedInMemory = false
    }
  }
}