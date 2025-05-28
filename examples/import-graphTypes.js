// Example of importing only the graphTypes module
import { GraphNoun, GraphVerb, NounType, VerbType } from '@soulcraft/brainy/types/graphTypes';

// This demonstrates that we can import just the graphTypes
// without importing the rest of the library
console.log('Successfully imported graphTypes');

// Example usage of the imported types
const exampleNoun = {
  id: '123',
  createdBy: {
    augmentation: 'test',
    version: '1.0',
    model: 'test-model',
    modelVersion: '1.0'
  },
  noun: NounType.Person,
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
  updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
};

console.log('Example noun type:', exampleNoun.noun);
console.log('Available noun types:', Object.values(NounType));
console.log('Available verb types:', Object.values(VerbType));
