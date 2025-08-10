const fs = require('fs');

const filePath = '/home/dpsifr/Projects/brainy/tests/intelligent-verb-scoring.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix db.add calls that use text as first parameter
const fixes = [
  ["await db.add('developer1', 'John is a software developer who writes JavaScript')", "await db.add(testUtils.createTestVector(384), { id: 'developer1', data: 'John is a software developer who writes JavaScript' })"],
  ["await db.add('developer2', 'Jane is a programmer who codes in TypeScript')", "await db.add(testUtils.createTestVector(384), { id: 'developer2', data: 'Jane is a programmer who codes in TypeScript' })"],
  ["await db.add('restaurant1', 'Italian restaurant serving pasta')", "await db.add(testUtils.createTestVector(384), { id: 'restaurant1', data: 'Italian restaurant serving pasta' })"],
  ["await db.add('car1', 'Red sports car with V8 engine')", "await db.add(testUtils.createTestVector(384), { id: 'car1', data: 'Red sports car with V8 engine' })"],
  ["await db.add('user1', 'Software engineer')", "await db.add(testUtils.createTestVector(384), { id: 'user1', data: 'Software engineer' })"],
  ["await db.add('project1', 'Web development project')", "await db.add(testUtils.createTestVector(384), { id: 'project1', data: 'Web development project' })"],
  ["await db.add('entity3', 'Test entity 3')", "await db.add(testUtils.createTestVector(384), { id: 'entity3', data: 'Test entity 3' })"],
  ["await db.add('entity4', 'Test entity 4')", "await db.add(testUtils.createTestVector(384), { id: 'entity4', data: 'Test entity 4' })"],
  ["await db.add('entity1', 'Software developer with expertise in JavaScript')", "await db.add(testUtils.createTestVector(384), { id: 'entity1', data: 'Software developer with expertise in JavaScript' })"],
  ["await db.add('entity2', 'React application for web development')", "await db.add(testUtils.createTestVector(384), { id: 'entity2', data: 'React application for web development' })"],
  ["await db.add('person1', 'Software engineer')", "await db.add(testUtils.createTestVector(384), { id: 'person1', data: 'Software engineer' })"],
  ["await db.add('project1', 'Web application')", "await db.add(testUtils.createTestVector(384), { id: 'project1', data: 'Web application' })"],
  ["await db.add('company1', 'Technology startup')", "await db.add(testUtils.createTestVector(384), { id: 'company1', data: 'Technology startup' })"]
];

fixes.forEach(([from, to]) => {
  content = content.replace(from, to);
});

fs.writeFileSync(filePath, content);
console.log('Fixed db.add calls in intelligent-verb-scoring.test.ts');