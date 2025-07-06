import { useRef, useState } from "react";
import { Principal } from "@dfinity/principal";
import { EnhancedFileService } from "../services/enhancedFileService";
import { Button } from "./ui/button";

interface EnhancedFileUploadProps {
  actor: any;
  userPrincipal?: Principal;
}

export default function EnhancedFileUpload({ actor, userPrincipal }: EnhancedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileService, setFileService] = useState<EnhancedFileService | null>(null);

  // Initialize file service when component mounts
  useState(() => {
    if (actor) {
      const service = new EnhancedFileService(actor);
      setFileService(service);
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setProgress(0);
    setIsUploading(true);

    try {
      if (!fileService) {
        throw new Error("File service not initialized");
      }

      if (!userPrincipal) {
        throw new Error("User principal not available. Please login first.");
      }

      // Set user principal for VetKey operations
      fileService.setUserPrincipal(userPrincipal);

      // Upload file with VetKey encryption
      console.log("Starting VetKey encrypted upload...");
      setProgress(10);

      const fileId = await fileService.uploadFileWithEncryption(file);

      setProgress(100);
      setSuccess(true);
      console.log("File uploaded successfully with VetKey encryption:", fileId);
    } catch (err) {
      console.error("VetKey upload failed", err);
      setError((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload File with VetKey Encryption</h2>

      {/* File Selection */}
      <div className="mb-4">
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="*/*" />
        <Button onClick={handleUploadClick} disabled={isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Select File to Upload"}
        </Button>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {progress !== null && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-sm">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">✅ File uploaded successfully with VetKey encryption!</p>
          <Button onClick={resetForm} variant="outline" size="sm" className="mt-2">
            Upload Another File
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🔐 VetKey Encryption</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Files are encrypted using your principal as the identity</li>
          <li>• Only you can decrypt your files</li>
          <li>• Encryption happens client-side for maximum security</li>
          <li>• Backend never sees unencrypted file content</li>
        </ul>
      </div>
    </div>
  );
}
