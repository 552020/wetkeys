import { vtk_backend } from "../../../declarations/vtk_backend";

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
export async function downloadFile(file: FileMetadata) {
  if (file.storage_provider === "icp" || !file.storage_provider) {
    // Download from ICP backend
    // Assume chunk_id = 0 for now (single chunk)
    const response = await vtk_backend.download_file(file.file_id, BigInt(0));
    if ("found_file" in response && response.found_file) {
      const fileData = response.found_file;
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
export async function deleteFile(file: FileMetadata) {
  if (file.storage_provider === "icp" || !file.storage_provider) {
    await vtk_backend.delete_file(file.file_id);
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
