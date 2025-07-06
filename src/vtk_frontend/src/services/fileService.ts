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
export async function downloadFile(file: FileMetadata, actor?: any) {
  if (file.storage_provider === "icp" || !file.storage_provider) {
    // Download from ICP backend
    if (!actor) throw new Error("Actor is required for ICP file operations");
    // Assume chunk_id = 0 for now (single chunk)
    const response = await actor.download_file(file.file_id, BigInt(0));

    // Handle the Result type from backend (Ok(result) or Err(error))
    const result = response as any;
    if (result && typeof result === "object" && "Ok" in result) {
      const okResult = result.Ok;
      if ("found_file" in okResult && okResult.found_file) {
        const fileData = okResult.found_file;
        if (fileData.contents && fileData.contents.length > 0) {
          let uint8Content: Uint8Array;
          if (fileData.contents instanceof Uint8Array) {
            uint8Content = fileData.contents;
          } else {
            uint8Content = new Uint8Array(fileData.contents);
          }
          const blob = new Blob([uint8Content], { type: fileData.file_type || "application/octet-stream" });
          triggerDownload(blob, file.file_name);
        } else {
          throw new Error("ICP file content is empty");
        }
      } else {
        throw new Error("ICP file download failed");
      }
    } else if (result && typeof result === "object" && "Err" in result) {
      throw new Error(`Download failed: ${result.Err}`);
    } else {
      // Handle legacy response format
      if ("found_file" in result && result.found_file) {
        const fileData = result.found_file;
        if (fileData.contents && fileData.contents.length > 0) {
          let uint8Content: Uint8Array;
          if (fileData.contents instanceof Uint8Array) {
            uint8Content = fileData.contents;
          } else {
            uint8Content = new Uint8Array(fileData.contents);
          }
          const blob = new Blob([uint8Content], { type: fileData.file_type || "application/octet-stream" });
          triggerDownload(blob, file.file_name);
        } else {
          throw new Error("ICP file content is empty");
        }
      } else {
        throw new Error("ICP file download failed");
      }
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
