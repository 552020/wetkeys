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
}

// Default Walrus aggregator and publisher endpoints
const DEFAULT_AGGREGATOR_API = "https://aggregator.walrus-testnet.walrus.space/v1/blobs";
const DEFAULT_PUBLISHER_API = "https://publisher.walrus-testnet.walrus.space/v1/blobs";

// Download a file (ICP or Walrus)
export async function downloadFile(file: FileMetadata, actor?: any, authClient?: any) {
  if (file.storage_provider === "icp" || !file.storage_provider) {
    // Download from ICP backend
    if (!actor) throw new Error("Actor is required for ICP file operations");
    // Assume chunk_id = 0 for now (single chunk)
    const response = await actor.download_file(file.file_id, BigInt(0));
    if ("found_file" in response && response.found_file) {
      const fileData = response.found_file;
      if (fileData.contents && fileData.contents.length > 0) {
        let uint8Content: Uint8Array;
        if (fileData.contents instanceof Uint8Array) {
          uint8Content = fileData.contents;
        } else {
          uint8Content = new Uint8Array(fileData.contents);
        }

        // Check if file is encrypted (application/octet-stream usually indicates encrypted data)
        let finalContent: Uint8Array;
        let fileType: string;

        if (fileData.file_type === "application/octet-stream" && authClient) {
          try {
            // Try to decrypt the content
            const { VetkdCryptoService } = await import('./vetkdCrypto');
            const vetkdService = new VetkdCryptoService(actor);
            
            // Get user principal bytes for decryption
            const userPrincipalBytes = getPrincipalBytes(authClient);
            
            // Decrypt the content
            finalContent = await vetkdService.decrypt(uint8Content, userPrincipalBytes);
            fileType = "application/octet-stream"; // Default for decrypted content
            console.log("File decrypted successfully");
          } catch (decryptError) {
            console.warn("Decryption failed, treating as unencrypted file:", decryptError);
            finalContent = uint8Content;
            fileType = fileData.file_type || "application/octet-stream";
          }
        } else {
          // File is not encrypted or no auth client available
          finalContent = uint8Content;
          fileType = fileData.file_type || "application/octet-stream";
        }

        const blob = new Blob([finalContent], { type: fileType });
        triggerDownload(blob, file.file_name);
      } else {
        throw new Error("ICP file content is empty");
      }
    } else {
      throw new Error("ICP file download failed");
    }
  } else if (file.storage_provider === "walrus") {
    // Download from Walrus aggregator
    if (!file.blob_id) throw new Error("No blob_id for Walrus file");
    const url = `${DEFAULT_AGGREGATOR_API}/${file.blob_id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Walrus file download failed");
    const blob = await res.blob();
    triggerDownload(blob, file.file_name);
  }
}

// Helper function to get principal bytes from auth client
function getPrincipalBytes(authClient: any): Uint8Array {
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

// Delete a file (ICP or Walrus)
export async function deleteFile(file: FileMetadata, actor?: any) {
  if (file.storage_provider === "icp" || !file.storage_provider) {
    if (!actor) throw new Error("Actor is required for ICP file operations");
    await actor.delete_file(file.file_id);
  } else if (file.storage_provider === "walrus") {
    if (!file.blob_id) throw new Error("No blob_id for Walrus file");
    const url = `${DEFAULT_PUBLISHER_API}/${file.blob_id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Walrus file delete failed");
  }
}

// Helper to trigger browser download
function triggerDownload(blob: Blob, fileName: string) {
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
