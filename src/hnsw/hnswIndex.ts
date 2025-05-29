/**
 * HNSW (Hierarchical Navigable Small World) Index implementation
 * Based on the paper: "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"
 */

import { DistanceFunction, HNSWConfig, HNSWNode, Vector, VectorDocument } from '../coreTypes.js'
import { euclideanDistance } from '../utils/index.js'

// Default HNSW parameters
const DEFAULT_CONFIG: HNSWConfig = {
  M: 16, // Max number of connections per node
  efConstruction: 200, // Size of a dynamic candidate list during construction
  efSearch: 50, // Size of a dynamic candidate list during search
  ml: 16 // Max level
}

export class HNSWIndex {
  private nodes: Map<string, HNSWNode> = new Map()
  private entryPointId: string | null = null
  private maxLevel = 0
  private config: HNSWConfig
  private distanceFunction: DistanceFunction
  private dimension: number | null = null

  constructor(
    config: Partial<HNSWConfig> = {},
    distanceFunction: DistanceFunction = euclideanDistance
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.distanceFunction = distanceFunction
  }

  /**
   * Add a vector to the index
   */
  public addItem(item: VectorDocument): string {
    // Check if item is defined
    if (!item) {
      throw new Error('Item is undefined or null')
    }

    const { id, vector } = item

    // Check if vector is defined
    if (!vector) {
      throw new Error('Vector is undefined or null')
    }

    // Set dimension on first insert
    if (this.dimension === null) {
      this.dimension = vector.length
    } else if (vector.length !== this.dimension) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.dimension}, got ${vector.length}`
      )
    }

    // Generate random level for this node
    const nodeLevel = this.getRandomLevel()

    // Create new node
    const node: HNSWNode = {
      id,
      vector,
      connections: new Map()
    }

    // Initialize empty connection sets for each level
    for (let level = 0; level <= nodeLevel; level++) {
      node.connections.set(level, new Set<string>())
    }

    // If this is the first node, make it the entry point
    if (this.nodes.size === 0) {
      this.entryPointId = id
      this.maxLevel = nodeLevel
      this.nodes.set(id, node)
      return id
    }

    // Find entry point
    if (!this.entryPointId) {
      console.error('Entry point ID is null')
      // If there's no entry point, this is the first node, so we should have returned earlier
      // This is a safety check
      this.entryPointId = id
      this.maxLevel = nodeLevel
      this.nodes.set(id, node)
      return id
    }

    const entryPoint = this.nodes.get(this.entryPointId)
    if (!entryPoint) {
      console.error(`Entry point with ID ${this.entryPointId} not found`)
      // If the entry point doesn't exist, treat this as the first node
      this.entryPointId = id
      this.maxLevel = nodeLevel
      this.nodes.set(id, node)
      return id
    }

    let currObj = entryPoint
    let currDist = this.distanceFunction(vector, entryPoint.vector)

    // Traverse the graph from top to bottom to find the closest node
    for (let level = this.maxLevel; level > nodeLevel; level--) {
      let changed = true
      while (changed) {
        changed = false

        // Check all neighbors at current level
        const connections = currObj.connections.get(level) || new Set<string>()

        for (const neighborId of connections) {
          const neighbor = this.nodes.get(neighborId)
          if (!neighbor) {
            console.error(`Neighbor with ID ${neighborId} not found in addItem traversal`)
            continue
          }
          const distToNeighbor = this.distanceFunction(vector, neighbor.vector)

          if (distToNeighbor < currDist) {
            currDist = distToNeighbor
            currObj = neighbor
            changed = true
          }
        }
      }
    }

    // For each level from nodeLevel down to 0
    for (let level = Math.min(nodeLevel, this.maxLevel); level >= 0; level--) {
      // Find ef nearest elements using greedy search
      const nearestNodes = this.searchLayer(
        vector,
        currObj,
        this.config.efConstruction,
        level
      )

      // Select M nearest neighbors
      const neighbors = this.selectNeighbors(
        vector,
        nearestNodes,
        this.config.M
      )

      // Add bidirectional connections
      for (const [neighborId, _] of neighbors) {
        const neighbor = this.nodes.get(neighborId)
        if (!neighbor) {
          console.error(`Neighbor with ID ${neighborId} not found`)
          continue
        }

        node.connections.get(level)!.add(neighborId)

        // Add reverse connection
        if (!neighbor.connections.has(level)) {
          neighbor.connections.set(level, new Set<string>())
        }
        neighbor.connections.get(level)!.add(id)

        // Ensure neighbor doesn't have too many connections
        if (neighbor.connections.get(level)!.size > this.config.M) {
          this.pruneConnections(neighbor, level)
        }
      }

      // Update entry point for the next level
      if (nearestNodes.size > 0) {
        const [nearestId, nearestDist] = [...nearestNodes][0]
        if (nearestDist < currDist) {
          currDist = nearestDist
          const nearestNode = this.nodes.get(nearestId)
          if (!nearestNode) {
            console.error(`Nearest node with ID ${nearestId} not found in addItem`)
            // Keep the current object as is
          } else {
            currObj = nearestNode
          }
        }
      }
    }

    // Update max level and entry point if needed
    if (nodeLevel > this.maxLevel) {
      this.maxLevel = nodeLevel
      this.entryPointId = id
    }

    // Add node to the index
    this.nodes.set(id, node)
    return id
  }

  /**
   * Search for nearest neighbors
   */
  public search(queryVector: Vector, k: number = 10): Array<[string, number]> {
    if (this.nodes.size === 0) {
      return []
    }

    // Check if query vector is defined
    if (!queryVector) {
      throw new Error('Query vector is undefined or null')
    }

    if (this.dimension !== null && queryVector.length !== this.dimension) {
      throw new Error(
        `Query vector dimension mismatch: expected ${this.dimension}, got ${queryVector.length}`
      )
    }

    // Start from the entry point
    if (!this.entryPointId) {
      console.error('Entry point ID is null')
      return []
    }

    const entryPoint = this.nodes.get(this.entryPointId)
    if (!entryPoint) {
      console.error(`Entry point with ID ${this.entryPointId} not found`)
      return []
    }

    let currObj = entryPoint
    let currDist = this.distanceFunction(queryVector, currObj.vector)

    // Traverse the graph from top to bottom to find the closest node
    for (let level = this.maxLevel; level > 0; level--) {
      let changed = true
      while (changed) {
        changed = false

        // Check all neighbors at current level
        const connections = currObj.connections.get(level) || new Set<string>()

        for (const neighborId of connections) {
          const neighbor = this.nodes.get(neighborId)
          if (!neighbor) {
            console.error(`Neighbor with ID ${neighborId} not found in search`)
            continue
          }
          const distToNeighbor = this.distanceFunction(
            queryVector,
            neighbor.vector
          )

          if (distToNeighbor < currDist) {
            currDist = distToNeighbor
            currObj = neighbor
            changed = true
          }
        }
      }
    }

    // Search at level 0 with ef = k
    const nearestNodes = this.searchLayer(
      queryVector,
      currObj,
      Math.max(this.config.efSearch, k),
      0
    )

    // Convert to array and sort by distance
    return [...nearestNodes].slice(0, k)
  }

  /**
   * Remove an item from the index
   */
  public removeItem(id: string): boolean {
    if (!this.nodes.has(id)) {
      return false
    }

    const node = this.nodes.get(id)!

    // Remove connections to this node from all neighbors
    for (const [level, connections] of node.connections.entries()) {
      for (const neighborId of connections) {
        const neighbor = this.nodes.get(neighborId)
        if (!neighbor) {
          console.error(`Neighbor with ID ${neighborId} not found in removeItem`)
          continue
        }
        if (neighbor.connections.has(level)) {
          neighbor.connections.get(level)!.delete(id)

          // Prune connections after removing this node to ensure consistency
          this.pruneConnections(neighbor, level)
        }
      }
    }

    // Also check all other nodes for references to this node and remove them
    for (const [nodeId, otherNode] of this.nodes.entries()) {
      if (nodeId === id) continue // Skip the node being removed

      for (const [level, connections] of otherNode.connections.entries()) {
        if (connections.has(id)) {
          connections.delete(id)

          // Prune connections after removing this reference
          this.pruneConnections(otherNode, level)
        }
      }
    }

    // Remove the node
    this.nodes.delete(id)

    // If we removed the entry point, find a new one
    if (this.entryPointId === id) {
      if (this.nodes.size === 0) {
        this.entryPointId = null
        this.maxLevel = 0
      } else {
        // Find the node with the highest level
        let maxLevel = 0
        let newEntryPointId = null

        for (const [nodeId, node] of this.nodes.entries()) {
          if (node.connections.size === 0) continue // Skip nodes with no connections

          const nodeLevel = Math.max(...node.connections.keys())
          if (nodeLevel >= maxLevel) {
            maxLevel = nodeLevel
            newEntryPointId = nodeId
          }
        }

        this.entryPointId = newEntryPointId
        this.maxLevel = maxLevel
      }
    }

    return true
  }

  /**
   * Get all nodes in the index
   */
  public getNodes(): Map<string, HNSWNode> {
    return new Map(this.nodes)
  }

  /**
   * Clear the index
   */
  public clear(): void {
    this.nodes.clear()
    this.entryPointId = null
    this.maxLevel = 0
  }

  /**
   * Get the size of the index
   */
  public size(): number {
    return this.nodes.size
  }

  /**
   * Search within a specific layer
   * Returns a map of node IDs to distances, sorted by distance
   */
  private searchLayer(
    queryVector: Vector,
    entryPoint: HNSWNode,
    ef: number,
    level: number
  ): Map<string, number> {
    // Set of visited nodes
    const visited = new Set<string>([entryPoint.id])

    // Priority queue of candidates (closest first)
    const candidates = new Map<string, number>()
    candidates.set(
      entryPoint.id,
      this.distanceFunction(queryVector, entryPoint.vector)
    )

    // Priority queue of nearest neighbors found so far (closest first)
    const nearest = new Map<string, number>()
    nearest.set(
      entryPoint.id,
      this.distanceFunction(queryVector, entryPoint.vector)
    )

    // While there are candidates to explore
    while (candidates.size > 0) {
      // Get closest candidate
      const [closestId, closestDist] = [...candidates][0]
      candidates.delete(closestId)

      // If this candidate is farther than the farthest in our result set, we're done
      const farthestInNearest = [...nearest][nearest.size - 1]
      if (nearest.size >= ef && closestDist > farthestInNearest[1]) {
        break
      }

      // Explore neighbors of the closest candidate
      const node = this.nodes.get(closestId)
      if (!node) {
        console.error(`Node with ID ${closestId} not found in searchLayer`)
        continue
      }
      const connections = node.connections.get(level) || new Set<string>()

      for (const neighborId of connections) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)

          const neighbor = this.nodes.get(neighborId)
          if (!neighbor) {
            console.error(`Neighbor with ID ${neighborId} not found in searchLayer`)
            continue
          }
          const distToNeighbor = this.distanceFunction(
            queryVector,
            neighbor.vector
          )

          // If we haven't found ef nearest neighbors yet, or this neighbor is closer than the farthest one we've found
          if (nearest.size < ef || distToNeighbor < farthestInNearest[1]) {
            candidates.set(neighborId, distToNeighbor)
            nearest.set(neighborId, distToNeighbor)

            // If we have more than ef neighbors, remove the farthest one
            if (nearest.size > ef) {
              const sortedNearest = [...nearest].sort((a, b) => a[1] - b[1])
              nearest.clear()
              for (let i = 0; i < ef; i++) {
                nearest.set(sortedNearest[i][0], sortedNearest[i][1])
              }
            }
          }
        }
      }
    }

    // Sort nearest by distance
    return new Map([...nearest].sort((a, b) => a[1] - b[1]))
  }

  /**
   * Select M nearest neighbors from the candidate set
   */
  private selectNeighbors(
    queryVector: Vector,
    candidates: Map<string, number>,
    M: number
  ): Map<string, number> {
    if (candidates.size <= M) {
      return candidates
    }

    // Simple heuristic: just take the M closest
    const sortedCandidates = [...candidates].sort((a, b) => a[1] - b[1])
    const result = new Map<string, number>()

    for (let i = 0; i < Math.min(M, sortedCandidates.length); i++) {
      result.set(sortedCandidates[i][0], sortedCandidates[i][1])
    }

    return result
  }

  /**
   * Ensure a node doesn't have too many connections at a given level
   */
  private pruneConnections(node: HNSWNode, level: number): void {
    const connections = node.connections.get(level)!
    if (connections.size <= this.config.M) {
      return
    }

    // Calculate distances to all neighbors
    const distances = new Map<string, number>()
    const validNeighborIds = new Set<string>()

    for (const neighborId of connections) {
      const neighbor = this.nodes.get(neighborId)
      if (!neighbor) {
        console.error(`Neighbor with ID ${neighborId} not found in pruneConnections`)
        continue
      }

      // Only add valid neighbors to the distances map
      distances.set(
        neighborId,
        this.distanceFunction(node.vector, neighbor.vector)
      )
      validNeighborIds.add(neighborId)
    }

    // Only proceed if we have valid neighbors
    if (distances.size === 0) {
      // If no valid neighbors, clear connections at this level
      node.connections.set(level, new Set())
      return
    }

    // Select M closest neighbors from valid ones
    const selectedNeighbors = this.selectNeighbors(
      node.vector,
      distances,
      this.config.M
    )

    // Update connections with only valid neighbors
    node.connections.set(level, new Set(selectedNeighbors.keys()))
  }

  /**
   * Generate a random level for a new node
   * Uses the same distribution as in the original HNSW paper
   */
  private getRandomLevel(): number {
    const r = Math.random()
    return Math.floor(-Math.log(r) * (1.0 / Math.log(this.config.M)))
  }
}
