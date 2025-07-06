import { VetkdCryptoService, ActorType } from "./vetkdCrypto";
import { Principal } from "@dfinity/principal";

// Types for file metadata (from backend)
export type FileStatus =
  | { uploaded: { uploaded_at: bigint } }
  | { partially_uploaded: null }
  | { pending: { alias: string; requested_at: bigint } };

export interface FileMetadata {
  file_id: bigint;
  file_name: string;
  file_status: FileStatus;
  storage_provider?: string; // "icp" or "walrus"
  blob_id?: string | null;
  is_encrypted?: boolean;
}

export class EnhancedFileService {
  private vetkdCrypto: VetkdCryptoService;
  private actor: ActorType;
  private userPrincipal: Principal | null = null;

  constructor(actor: ActorType) {
    this.actor = actor;
    this.vetkdCrypto = new VetkdCryptoService(actor);
  }

  /**
   * Set the user principal for VetKey operations
   */
  setUserPrincipal(principal: Principal) {
    this.userPrincipal = principal;
  }

  /**
   * Upload a file with VetKey encryption
   */
  async uploadFileWithEncryption(file: File): Promise<bigint> {
    if (!this.userPrincipal) {
      throw new Error("User principal not set. Please login first.");
    }

    try {
      // Read file data
      const fileBuffer = await file.arrayBuffer();

      // Encrypt the file data using VetKey
      console.log("Encrypting file with VetKey...");
      const encryptedData = await this.vetkdCrypto.encrypt(fileBuffer, this.userPrincipal.toUint8Array());

      // Convert encrypted data to format expected by backend
      const encryptedBytes = Array.from(encryptedData);

      // Upload encrypted file to backend
      const uploadRequest = {
        name: file.name,
        content: encryptedBytes,
        file_type: file.type || "application/octet-stream",
        num_chunks: BigInt(1), // Single chunk for now
      };

      console.log("Uploading encrypted file to backend...");
      const fileId = await this.actor.upload_file_atomic(uploadRequest);

      console.log("File uploaded successfully with VetKey encryption:", fileId);
      return fileId;
    } catch (error) {
      console.error("Error uploading file with VetKey encryption:", error);
      throw error;
    }
  }

  /**
   * Download and decrypt a file
   */
  async downloadFileWithDecryption(file: FileMetadata): Promise<void> {
    if (!this.userPrincipal) {
      throw new Error("User principal not set. Please login first.");
    }

    try {
      if (file.storage_provider === "icp" || !file.storage_provider) {
        // Download from ICP backend
        console.log("Downloading encrypted file from backend...");
        const response = await this.actor.download_file(file.file_id, BigInt(0));

        if (response && typeof response === "object" && "ok" in response) {
          const result = response.ok;
          if ("found_file" in result && result.found_file) {
            await this.processDownloadedFile(result.found_file, file);
          } else {
            throw new Error("File not found or download failed");
          }
        } else if (response && typeof response === "object" && "err" in response) {
          throw new Error(`Download failed: ${response.err}`);
        } else {
          // Handle legacy response format
          if ("found_file" in response && response.found_file) {
            await this.processDownloadedFile(response.found_file, file);
          } else {
            throw new Error("File not found or download failed");
          }
        }
      } else if (file.storage_provider === "walrus") {
        // For Walrus files, download directly (no encryption for now)
        if (!file.blob_id) throw new Error("No blob_id for Walrus file");
        const url = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${file.blob_id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Walrus file download failed");
        const blob = await res.blob();
        this.triggerDownload(blob, file.file_name);
      }
    } catch (error) {
      console.error("Error downloading file with VetKey decryption:", error);
      throw error;
    }
  }

  /**
   * Process downloaded file data and decrypt if needed
   */
  private async processDownloadedFile(fileData: any, fileMetadata: FileMetadata): Promise<void> {
    if (!fileData.contents || fileData.contents.length === 0) {
      throw new Error("File content is empty");
    }

    let uint8Content: Uint8Array;
    if (fileData.contents instanceof Uint8Array) {
      uint8Content = fileData.contents;
    } else {
      uint8Content = new Uint8Array(fileData.contents);
    }

    // Check if file is encrypted
    if (fileMetadata.is_encrypted) {
      console.log("Decrypting file with VetKey...");
      try {
        const decryptedData = await this.vetkdCrypto.decrypt(
          uint8Content,
          this.userPrincipal!.toUint8Array(),
          fileMetadata.file_id
        );

        const blob = new Blob([decryptedData], {
          type: fileData.file_type || "application/octet-stream",
        });
        this.triggerDownload(blob, fileMetadata.file_name);
      } catch (decryptError) {
        console.error("VetKey decryption failed:", decryptError);
        throw new Error("Failed to decrypt file. You may not have permission to access this file.");
      }
    } else {
      // File is not encrypted, download as-is
      const blob = new Blob([uint8Content], {
        type: fileData.file_type || "application/octet-stream",
      });
      this.triggerDownload(blob, fileMetadata.file_name);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(file: FileMetadata): Promise<void> {
    if (file.storage_provider === "icp" || !file.storage_provider) {
      await this.actor.delete_file(file.file_id);
    } else if (file.storage_provider === "walrus") {
      if (!file.blob_id) throw new Error("No blob_id for Walrus file");
      const url = `https://publisher.walrus-testnet.walrus.space/v1/blobs/${file.blob_id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Walrus file delete failed");
    }
  }

  /**
   * Get list of files
   */
  async listFiles(): Promise<FileMetadata[]> {
    return await this.actor.list_files();
  }

  /**
   * Helper to trigger browser download
   */
  private triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}
