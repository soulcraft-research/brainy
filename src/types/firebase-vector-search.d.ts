// TEMPORARILY COMMENTED OUT: Firebase vector search type declarations
/*
declare module '@firebase/firestore-vector-search' {
  interface VectorSearchOptions {
    collection: any;
    vectorField: string;
    queryVector: number[];
    limit: number;
    distanceMeasure?: string;
  }

  interface VectorSearchResult {
    id: string;
    data: any;
    distance?: number;
  }

  export function findNearest(options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
*/
