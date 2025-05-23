// Type declarations for TensorFlow.js models

// This file is a placeholder for TensorFlow.js model types
// We're using type assertions in the code instead of module declarations

// Define some basic types that might be useful
export interface TensorflowModel {
  load(): Promise<any>;
  embed(data: string[]): any;
  dispose(): void;
}

// Export a dummy constant to make this a proper module
export const tensorflowModelsLoaded = true;
