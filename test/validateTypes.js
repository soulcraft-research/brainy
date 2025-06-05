// Test script to verify type validation in BrainyData
import { BrainyData } from '../src/brainyData.js';
import { NounType, VerbType } from '../src/types/graphTypes.js';

async function testTypeValidation() {
  console.log('Testing type validation in BrainyData...');
  
  // Create a new BrainyData instance
  const brainy = new BrainyData();
  await brainy.init();
  
  console.log('Testing node with valid noun type...');
  const validNodeId = await brainy.add([0.1, 0.2, 0.3], {
    noun: NounType.Person,
    label: 'Test Person'
  });
  console.log(`Added node with valid noun type: ${validNodeId}`);
  
  console.log('Testing node with invalid noun type...');
  const invalidNodeId = await brainy.add([0.4, 0.5, 0.6], {
    noun: 'invalid_type',
    label: 'Test Invalid'
  });
  console.log(`Added node with invalid noun type (should be converted to default): ${invalidNodeId}`);
  
  // Get the metadata to verify it was corrected
  const invalidNodeMetadata = await brainy.get(invalidNodeId);
  console.log('Metadata for node with invalid type:', invalidNodeMetadata);
  
  console.log('Testing edge with valid verb type...');
  const validEdgeId = await brainy.addEdge(validNodeId, invalidNodeId, undefined, {
    type: VerbType.RelatedTo,
    metadata: { label: 'Test Relation' }
  });
  console.log(`Added edge with valid verb type: ${validEdgeId}`);
  
  console.log('Testing edge with invalid verb type...');
  const invalidEdgeId = await brainy.addEdge(validNodeId, invalidNodeId, undefined, {
    type: 'invalid_relation',
    metadata: { label: 'Test Invalid Relation' }
  });
  console.log(`Added edge with invalid verb type (should be converted to default): ${invalidEdgeId}`);
  
  // Get the edge to verify it was corrected
  const invalidEdge = await brainy.getEdge(invalidEdgeId);
  console.log('Edge with invalid type:', invalidEdge);
  
  console.log('Testing updateMetadata with invalid noun type...');
  await brainy.updateMetadata(validNodeId, {
    noun: 'another_invalid_type',
    label: 'Updated Test'
  });
  
  // Get the metadata to verify it was corrected
  const updatedMetadata = await brainy.get(validNodeId);
  console.log('Updated metadata (should have corrected noun type):', updatedMetadata);
  
  console.log('All tests completed.');
}

testTypeValidation().catch(error => {
  console.error('Test failed:', error);
});
