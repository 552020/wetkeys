import { useState, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import { EnhancedFileService, FileMetadata } from "../services/enhancedFileService";
import { Button } from "./ui/button";

interface EnhancedFileListProps {
  actor: any;
  userPrincipal?: Principal;
}

export default function EnhancedFileList({ actor, userPrincipal }: EnhancedFileListProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<bigint | null>(null);
  const [fileService, setFileService] = useState<EnhancedFileService | null>(null);

  // Initialize file service when component mounts
  useEffect(() => {
    if (actor) {
      const service = new EnhancedFileService(actor);
      setFileService(service);
    }
  }, [actor]);

  // Load files on mount and when actor changes
  useEffect(() => {
    if (fileService) {
      loadFiles();
    }
  }, [fileService]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await fileService!.listFiles();
      setFiles(fileList);
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    if (!fileService || !userPrincipal) {
      setError("File service or user principal not available");
      return;
    }

    try {
      setDownloadingFile(file.file_id);
      setError(null);

      // Set user principal for VetKey operations
      fileService.setUserPrincipal(userPrincipal);

      // Download and decrypt file
      await fileService.downloadFileWithDecryption(file);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError((err as Error).message || "Failed to download file");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!fileService) {
      setError("File service not available");
      return;
    }

    try {
      setError(null);
      await fileService.deleteFile(file);
      // Reload files after deletion
      await loadFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      setError((err as Error).message || "Failed to delete file");
    }
  };

  const getFileStatusText = (file: FileMetadata) => {
    if ("uploaded" in file.file_status) {
      return "Uploaded";
    } else if ("partially_uploaded" in file.file_status) {
      return "Partially Uploaded";
    } else if ("pending" in file.file_status) {
      return "Pending";
    }
    return "Unknown";
  };

  const getFileStatusColor = (file: FileMetadata) => {
    if ("uploaded" in file.file_status) {
      return "text-green-600";
    } else if ("partially_uploaded" in file.file_status) {
      return "text-yellow-600";
    } else if ("pending" in file.file_status) {
      return "text-blue-600";
    }
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your Files</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Files</h2>
        <Button onClick={loadFiles} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">❌ {error}</p>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No files uploaded yet.</p>
          <p className="text-sm text-gray-500 mt-1">Upload your first file to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.file_id.toString()}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.is_encrypted ? (
                      <span className="text-blue-600">🔐</span>
                    ) : (
                      <span className="text-gray-400">📄</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className={getFileStatusColor(file)}>{getFileStatusText(file)}</span>
                      <span>{file.storage_provider === "walrus" ? "Walrus" : "ICP"}</span>
                      {file.is_encrypted && <span className="text-blue-600 font-medium">VetKey Encrypted</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFile === file.file_id}
                  size="sm"
                  variant="outline"
                >
                  {downloadingFile === file.file_id ? "Downloading..." : "Download"}
                </Button>
                <Button
                  onClick={() => handleDelete(file)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🔐 VetKey Decryption</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Encrypted files (🔐) are automatically decrypted on download</li>
          <li>• Only you can decrypt files encrypted with your principal</li>
          <li>• Decryption happens client-side for maximum security</li>
          <li>• Regular files (📄) are downloaded as-is</li>
        </ul>
      </div>
    </div>
  );
}
