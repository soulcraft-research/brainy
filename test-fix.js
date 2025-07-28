// Simple test script to verify the FileSystemStorage fix
const { createStorage } = require('./dist/unified.js');

async function testFileSystemStorage() {
  try {
    console.log('Creating storage with forceFileSystemStorage: true');
    const storage = await createStorage({ forceFileSystemStorage: true });
    console.log('Storage created successfully');
    
    console.log('Initializing storage');
    await storage.init();
    console.log('Storage initialized successfully');
    
    console.log('Test passed: No TypeError about undefined path.join');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testFileSystemStorage();
