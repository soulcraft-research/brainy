// Type declarations for @soulcraft/brainy
declare module '@soulcraft/brainy' {
  // Core types
  export class BrainyData {
    constructor(config?: any)

    init(): Promise<void>

    add(text: string, metadata?: any): Promise<string>

    get(id: string): Promise<any>

    delete(id: string): Promise<void>

    search(query: string, limit?: number, options?: any): Promise<any[]>

    searchText(query: string, limit?: number, options?: any): Promise<any[]>
    
    embed(data: string | string[]): Promise<number[]>
    
    calculateSimilarity(
      a: number[] | string | string[],
      b: number[] | string | string[],
      options?: { forceEmbed?: boolean, distanceFunction?: any }
    ): Promise<number>

    addVerb(
      sourceId: string,
      targetId: string,
      text?: string,
      options?: any
    ): Promise<string>

    getVerbsBySource(sourceId: string): Promise<any[]>

    getVerbsByTarget(targetId: string): Promise<any[]>

    status(): Promise<any>

    clear(): Promise<void>

    backup(): Promise<any>

    restore(data: any, options?: any): Promise<any>

    importSparseData(data: any, options?: any): Promise<any>

    generateRandomGraph(options?: any): Promise<any>
  }

  export class FileSystemStorage {
    constructor(dataDir: string)
  }

  // Pipelines
  export const sequentialPipeline: any
  export const augmentationPipeline: any

  // Enums
  export enum NounType {
    Person = 'Person',
    Place = 'Place',
    Thing = 'Thing',
    Event = 'Event',
    Concept = 'Concept',
    Content = 'Content'
  }

  export enum VerbType {
    RelatedTo = 'RelatedTo',
    PartOf = 'PartOf',
    HasA = 'HasA',
    UsedFor = 'UsedFor',
    CapableOf = 'CapableOf',
    AtLocation = 'AtLocation',
    Causes = 'Causes',
    HasProperty = 'HasProperty',
    Owns = 'Owns',
    CreatedBy = 'CreatedBy'
  }

  export enum ExecutionMode {
    SEQUENTIAL = 'sequential',
    PARALLEL = 'parallel',
    THREADED = 'threaded'
  }

  export enum AugmentationType {
    SENSE = 'sense',
    MEMORY = 'memory',
    COGNITION = 'cognition',
    CONDUIT = 'conduit',
    ACTIVATION = 'activation',
    PERCEPTION = 'perception',
    DIALOG = 'dialog',
    WEBSOCKET = 'websocket'
  }
}
