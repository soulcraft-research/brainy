const fs = require('fs');

const filePath = '/home/dpsifr/Projects/brainy/tests/intelligent-verb-scoring.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix addVerb calls pattern: addVerb(src, dst, 'relation', undefined, {
const fixes = [
  ["addVerb('entity1', 'entity2', 'hasRelation', undefined, {", "addVerb('entity1', 'entity2', undefined, { type: 'hasRelation',"],
  ["addVerb('user1', 'project1', 'worksOn', undefined, { autoCreateMissingNouns: true })", "addVerb('user1', 'project1', undefined, { type: 'worksOn', autoCreateMissingNouns: true })"],
  ["addVerb('entity1', 'entity2', 'testRelation', undefined, { autoCreateMissingNouns: true })", "addVerb('entity1', 'entity2', undefined, { type: 'testRelation', autoCreateMissingNouns: true })"],
  ["addVerb('entity3', 'entity4', 'testRelation', undefined, { autoCreateMissingNouns: true })", "addVerb('entity3', 'entity4', undefined, { type: 'testRelation', autoCreateMissingNouns: true })"],
  ["addVerb('entity1', 'entity2', 'decayingRelation', undefined, { autoCreateMissingNouns: true })", "addVerb('entity1', 'entity2', undefined, { type: 'decayingRelation', autoCreateMissingNouns: true })"],
  ["addVerb('entity1', `entity${i+3}`, 'testRelation', undefined, { autoCreateMissingNouns: true })", "addVerb('entity1', `entity${i+3}`, undefined, { type: 'testRelation', autoCreateMissingNouns: true })"],
  ["addVerb('entity1', 'entity2', 'develops', undefined, { autoCreateMissingNouns: true })", "addVerb('entity1', 'entity2', undefined, { type: 'develops', autoCreateMissingNouns: true })"],
  ["addVerb('entity1', 'entity2', 'explicitRel', undefined, {", "addVerb('entity1', 'entity2', undefined, { type: 'explicitRel',"],
  ["addVerb('entity1', 'entity2', 'smartRel', undefined, { autoCreateMissingNouns: true })", "addVerb('entity1', 'entity2', undefined, { type: 'smartRel', autoCreateMissingNouns: true })"],
  ["addVerb('person1', 'project1', 'worksOn', undefined, { autoCreateMissingNouns: true })", "addVerb('person1', 'project1', undefined, { type: 'worksOn', autoCreateMissingNouns: true })"],
  ["addVerb('company1', 'person1', 'employs', undefined, { autoCreateMissingNouns: true })", "addVerb('company1', 'person1', undefined, { type: 'employs', autoCreateMissingNouns: true })"],
  ["addVerb('company1', 'project1', 'owns', undefined, { autoCreateMissingNouns: true })", "addVerb('company1', 'project1', undefined, { type: 'owns', autoCreateMissingNouns: true })"]
];

fixes.forEach(([from, to]) => {
  content = content.replace(from, to);
});

fs.writeFileSync(filePath, content);
console.log('Fixed addVerb calls in intelligent-verb-scoring.test.ts');