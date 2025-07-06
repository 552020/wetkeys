import { VetkdCryptoService, ActorType } from './vetkdCrypto';

export const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export interface UploadProgress {
  currentChunk: number;
  totalChunks: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  enableEncryption?: boolean; // New option to enable/disable encryption
}

// Extended ActorType interface to include upload methods
export interface ExtendedActorType extends ActorType {
  upload_file_atomic: (request: {
    name: string;
    content: Uint8Array;
    file_type: string;
    num_chunks: bigint;
  }) => Promise<bigint>;
  
  upload_file_continue: (request: {
    file_id: bigint;
    file_content: Uint8Array;
    file_type: string;
    num_chunks: bigint;
  }) => Promise<void>;
}

export class UploadService {
  private vetkdCryptoService: VetkdCryptoService;

  constructor(private actor: ExtendedActorType) {
    this.vetkdCryptoService = new VetkdCryptoService(actor);
  }

  async uploadFile(
    file: File, 
    userPrincipalBytes: Uint8Array,
    options: UploadOptions = {}
  ): Promise<bigint> {
    try {
      // Validate file size
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File too large. Max 100MB allowed.");
      }

      // Convert file to ArrayBuffer
      const fileBytes = await file.arrayBuffer();

      let uploadData: Uint8Array;
      let fileType: string;

      if (options.enableEncryption !== false) {
        // Try to encrypt the data using vetkeys
        try {
          uploadData = await this.vetkdCryptoService.encrypt(
            fileBytes,
            userPrincipalBytes,
          );
          fileType = "application/octet-stream"; // Encrypted data is always binary
          console.log("File encrypted successfully with vetkeys");
        } catch (encryptionError) {
          console.warn("Encryption failed, falling back to unencrypted upload:", encryptionError);
          // Fall back to unencrypted upload
          uploadData = new Uint8Array(fileBytes);
          fileType = file.type || "application/octet-stream";
        }
      } else {
        // Upload without encryption
        uploadData = new Uint8Array(fileBytes);
        fileType = file.type || "application/octet-stream";
      }

      // Calculate chunks for upload data
      const numChunks = Math.ceil(uploadData.length / CHUNK_SIZE);
      const firstChunk = uploadData.subarray(0, Math.min(CHUNK_SIZE, uploadData.length));

      // Upload first chunk atomically
      const fileId = await this.actor.upload_file_atomic({
        name: file.name,
        content: firstChunk,
        file_type: fileType,
        num_chunks: BigInt(numChunks),
      });

      // Update progress
      if (options.onProgress) {
        options.onProgress({
          currentChunk: 1,
          totalChunks: numChunks,
          percentage: Math.round((1 / numChunks) * 100)
        });
      }

      // Upload remaining chunks if needed
      if (numChunks > 1) {
        await this.uploadRemainingChunks(uploadData, fileId, options);
      }

      return fileId;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error(String(error));
      if (options.onError) {
        options.onError(uploadError);
      }
      throw uploadError;
    }
  }

  private async uploadRemainingChunks(
    content: Uint8Array, 
    fileId: bigint,
    options: UploadOptions
  ): Promise<void> {
    const numChunks = Math.ceil(content.length / CHUNK_SIZE);
    
    for (let i = 1; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, content.length);
      const chunk = content.subarray(start, end);
      
      await this.actor.upload_file_continue({
        file_id: fileId,
        file_content: chunk,
        file_type: "application/octet-stream", // Encrypted data is always binary
        num_chunks: BigInt(numChunks),
      });

      // Update progress
      if (options.onProgress) {
        options.onProgress({
          currentChunk: i + 1,
          totalChunks: numChunks,
          percentage: Math.round(((i + 1) / numChunks) * 100)
        });
      }
    }
  }

  // Helper method to get user principal bytes from Internet Identity
  static getUserPrincipalBytes(authClient: any): Uint8Array {
    if (!authClient || !authClient.getIdentity) {
      throw new Error("Invalid auth client");
    }
    
    const identity = authClient.getIdentity();
    if (!identity || !identity.getPrincipal) {
      throw new Error("Invalid identity");
    }
    
    const principal = identity.getPrincipal();
    if (!principal || !principal.toUint8Array) {
      throw new Error("Invalid principal");
    }
    
    return principal.toUint8Array();
  }
} 