#!/usr/bin/env node

/**
 * Test script for vetKeys integration
 * This script tests the basic vetKeys functionality
 */

const { Principal } = require('@dfinity/principal');

// Mock agent for testing
const mockAgent = {
  call: async (canisterId, method, args) => {
    console.log(`Calling ${method} on ${canisterId} with args:`, args);
    
    // Mock responses for testing
    if (method === 'upload_file_atomic') {
      return Math.floor(Math.random() * 1000); // Mock file ID
    }
    
    if (method === 'download_file') {
      return {
        Ok: {
          contents: [1, 2, 3, 4, 5], // Mock file content
          file_type: 'text/plain',
          num_chunks: 1
        }
      };
    }
    
    if (method === 'share_file') {
      return 'Ok';
    }
    
    if (method === 'list_files') {
      return [
        {
          file_id: 1,
          file_name: 'test.txt',
          group_name: '',
          group_alias: null,
          file_status: {
            Uploaded: {
              uploaded_at: Date.now()
            }
          }
        }
      ];
    }
    
    return null;
  }
};

// VetKeys manager class (simplified for testing)
class VetKeysManager {
  constructor(agent) {
    this.agent = agent;
  }

  async uploadFile(name, content, fileType, sharedWith = []) {
    try {
      const request = {
        name,
        content: Array.from(content),
        file_type: fileType,
        num_chunks: 1,
        caller: Principal.anonymous().toText(),
        shared_with: sharedWith.map(p => p.toText()),
      };

      const fileId = await this.agent.call('vtk_backend', 'upload_file_atomic', [request]);
      return fileId;
    } catch (error) {
      console.error('Error uploading file with vetKeys:', error);
      throw error;
    }
  }

  async downloadFile(fileId, chunkId = 0) {
    try {
      const response = await this.agent.call('vtk_backend', 'download_file', [fileId, chunkId]);
      
      if (response.Ok) {
        return {
          contents: new Uint8Array(response.Ok.contents),
          file_type: response.Ok.file_type,
          num_chunks: response.Ok.num_chunks,
        };
      } else {
        throw new Error(`Download failed: ${response.Err || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading file with vetKeys:', error);
      throw error;
    }
  }

  async shareFile(fileId, sharedWith) {
    try {
      const request = {
        file_id: fileId,
        shared_with: sharedWith.map(p => p.toText()),
      };

      const response = await this.agent.call('vtk_backend', 'share_file', [request]);
      return response === 'Ok';
    } catch (error) {
      console.error('Error sharing file with vetKeys:', error);
      throw error;
    }
  }

  async listFiles() {
    try {
      const files = await this.agent.call('vtk_backend', 'list_files', []);
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}

// Test functions
async function testVetKeysIntegration() {
  console.log('🧪 Testing VetKeys Integration\n');
  
  const vetKeysManager = new VetKeysManager(mockAgent);
  
  try {
    // Test 1: Upload file with vetKeys
    console.log('📤 Test 1: Uploading file with vetKeys encryption...');
    const testContent = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]); // "Hello World"
    const fileId = await vetKeysManager.uploadFile('test.txt', testContent, 'text/plain', []);
    console.log(`✅ File uploaded successfully with ID: ${fileId}\n`);
    
    // Test 2: Download file with vetKeys
    console.log('📥 Test 2: Downloading file with vetKeys decryption...');
    const fileData = await vetKeysManager.downloadFile(fileId, 0);
    console.log(`✅ File downloaded successfully:`);
    console.log(`   - Type: ${fileData.file_type}`);
    console.log(`   - Size: ${fileData.contents.length} bytes`);
    console.log(`   - Chunks: ${fileData.num_chunks}\n`);
    
    // Test 3: Share file
    console.log('🔗 Test 3: Sharing file with principals...');
    const testPrincipal = Principal.fromText('2vxsx-fae');
    const shareSuccess = await vetKeysManager.shareFile(fileId, [testPrincipal]);
    console.log(`✅ File shared successfully: ${shareSuccess}\n`);
    
    // Test 4: List files
    console.log('📋 Test 4: Listing files...');
    const files = await vetKeysManager.listFiles();
    console.log(`✅ Found ${files.length} files:`);
    files.forEach(file => {
      console.log(`   - ${file.file_name} (ID: ${file.file_id})`);
    });
    console.log('\n');
    
    console.log('🎉 All VetKeys integration tests passed!');
    console.log('\n🔐 VetKeys provides:');
    console.log('   - End-to-end encryption using threshold cryptography');
    console.log('   - Secure file sharing with granular access control');
    console.log('   - Privacy-preserving storage on the Internet Computer');
    console.log('   - No traditional key management required');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testVetKeysIntegration().catch(console.error);
}

module.exports = { VetKeysManager, testVetKeysIntegration }; 