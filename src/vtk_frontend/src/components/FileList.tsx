import { useState, useEffect } from "react";
import { downloadFile, deleteFile } from "../services/fileService";
import { vtk_backend } from "../../../declarations/vtk_backend";

// FileList component: lists files from the backend
export default function FileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      setError(null);
      try {
        const result = await vtk_backend.list_files();
        setFiles(result);
      } catch (err) {
        setError((err as Error).message || "Failed to fetch files");
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  const handleDownload = async (file: any) => {
    const fileId = file.file_id.toString();
    setActionLoading((prev) => ({ ...prev, [`download-${fileId}`]: true }));
    try {
      await downloadFile(file);
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Download failed: ${(err as Error).message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`download-${fileId}`]: false }));
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    const fileId = file.file_id.toString();
    setActionLoading((prev) => ({ ...prev, [`delete-${fileId}`]: true }));
    try {
      await deleteFile(file);
      // Refresh the file list after successful deletion
      const result = await vtk_backend.list_files();
      setFiles(result);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Delete failed: ${(err as Error).message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete-${fileId}`]: false }));
    }
  };

  const getStorageProviderLabel = (file: any) => {
    if (file.storage_provider === "walrus") return "Walrus (Sui)";
    return "ICP";
  };

  const getStatusLabel = (file: any) => {
    if ("uploaded" in file.file_status) return "✅ Uploaded";
    if ("partially_uploaded" in file.file_status) return "⏳ Partially Uploaded";
    if ("pending" in file.file_status) return `🕓 Pending`;
    return "❓ Unknown";
  };

  if (loading) return <div>Loading files...</div>;
  if (error) return <div className="text-red-500">❌ {error}</div>;
  if (files.length === 0) return <div>No files found.</div>;

  return (
    <div className="my-6">
      <h2 className="font-bold mb-2">📁 Uploaded Files</h2>
      <ul className="space-y-3">
        {files.map((file, idx) => (
          <li key={file.file_id ?? idx} className="border p-4 rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{file.file_name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="mr-4">ID: {file.file_id.toString()}</span>
                  <span className="mr-4">Storage: {getStorageProviderLabel(file)}</span>
                  <span>Status: {getStatusLabel(file)}</span>
                </div>
                {file.blob_id && <div className="text-xs text-gray-400 mt-1">Blob ID: {file.blob_id}</div>}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleDownload(file)}
                  disabled={actionLoading[`download-${file.file_id}`]}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[`download-${file.file_id}`] ? "⏳" : "⬇️"} Download
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={actionLoading[`delete-${file.file_id}`]}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[`delete-${file.file_id}`] ? "⏳" : "🗑️"} Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
