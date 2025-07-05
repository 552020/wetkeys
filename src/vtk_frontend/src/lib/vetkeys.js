import { Principal } from '@dfinity/principal';

/**
 * VetKeys utility for handling encrypted file operations
 */
export class VetKeysManager {
  constructor(agent) {
    this.agent = agent;
  }

  /**
   * Upload a file with vetKeys encryption
   * @param {string} name - File name
   * @param {Uint8Array} content - File content
   * @param {string} fileType - File type
   * @param {Principal[]} sharedWith - Principals to share with
   * @returns {Promise<number>} File ID
   */
  async uploadFile(name, content, fileType, sharedWith = []) {
    try {
      const request = {
        name,
        content: Array.from(content),
        file_type: fileType,
        num_chunks: 1,
        caller: Principal.anonymous(), // Will be set by the backend
        shared_with: sharedWith.map(p => p.toText()),
      };

      const fileId = await this.agent.call('vtk_backend', 'upload_file_atomic', [request]);
      return fileId;
    } catch (error) {
      console.error('Error uploading file with vetKeys:', error);
      throw error;
    }
  }

  /**
   * Download a file with vetKeys decryption
   * @param {number} fileId - File ID
   * @param {number} chunkId - Chunk ID (default 0)
   * @returns {Promise<Object>} File data
   */
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

  /**
   * Share a file with additional principals
   * @param {number} fileId - File ID
   * @param {Principal[]} sharedWith - Principals to share with
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * List all files
   * @returns {Promise<Array>} List of file metadata
   */
  async listFiles() {
    try {
      const files = await this.agent.call('vtk_backend', 'list_files', []);
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Convert a string to Principal
   * @param {string} principalText - Principal as text
   * @returns {Principal} Principal object
   */
  static fromText(principalText) {
    return Principal.fromText(principalText);
  }

  /**
   * Get anonymous principal
   * @returns {Principal} Anonymous principal
   */
  static getAnonymous() {
    return Principal.anonymous();
  }
}

/**
 * Create a VetKeysManager instance
 * @param {Object} agent - Internet Computer agent
 * @returns {VetKeysManager} VetKeys manager instance
 */
export function createVetKeysManager(agent) {
  return new VetKeysManager(agent);
} 