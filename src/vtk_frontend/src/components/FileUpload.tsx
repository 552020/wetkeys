import { useRef, useState } from "react";
// import { backend } from "@/declarations/backend"; // Adjust path if needed
import { canisterId, createActor, vtk_backend } from "../../../declarations/vtk_backend";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
import { Buffer } from "buffer";
import { downloadFile, deleteFile } from "../services/fileService";

// CREATE THE CLIENTS
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
const walrusClient = new WalrusClient({
  network: "testnet",
  suiClient,
  wasmUrl: walrusWasmUrl,
});

const CHUNK_SIZE = 2 * 1024 * 1024;

// Default Walrus publisher endpoint for API upload
const DEFAULT_PUBLISHER_API = "https://publisher.walrus-testnet.walrus.space/v1/blobs";
export default function FileUpload({ actor }: { actor: any }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileIdCounter, setFileIdCounter] = useState(1); // Simple counter for file_id
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // USER CHOICE STATE
  const [uploadTarget, setUploadTarget] = useState<"icp" | "walrus">("icp");
  // New: Upload method state
  const [method, setMethod] = useState<"SDK" | "API">("SDK");

  // TODO: PRODUCTION - Add wallet connection state
  // const [wallet, setWallet] = useState<any>(null);
  // const [walletAddress, setWalletAddress] = useState<string>("");
  // const [suiBalance, setSuiBalance] = useState<string>("");
  // const [walBalance, setWalBalance] = useState<string>("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.size > 100 * 1024 * 1024) {
      setError("File too large. Max 100MB allowed.");
      setSuccess(false);
      setProgress(null);
      return;
    }

    setError(null);
    setSuccess(false);
    setProgress(0);
    setIsUploading(true);

    // Generate a file_id (in production, get this from backend or a UUID)
    const file_id = BigInt(fileIdCounter);
    setFileIdCounter((id) => id + 1);

    try {
      if (uploadTarget === "icp") {
        // ICP UPLOAD LOGIC
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const num_chunks = BigInt(totalChunks);

        let backendFileId = null;
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const buffer = await chunk.arrayBuffer();

          if (i === 0) {
            // First chunk with metadata
            const uploadArgs = {
              name: file.name, // ✅ Backend expects 'name'
              content: new Uint8Array(buffer), // ✅ Backend expects 'content'
              file_type: file.type || "application/octet-stream",
              num_chunks,
            };
            console.log("upload_file_atomic args:", uploadArgs);
            const uploadResult = await actor.upload_file_atomic(uploadArgs);

            // Handle the Result type from backend (Ok(file_id) or Err(error))
            let backendFileId: bigint;
            const result = uploadResult as any;
            if (result && typeof result === "object" && "Ok" in result) {
              backendFileId = result.Ok as bigint;
            } else if (result && typeof result === "object" && "Err" in result) {
              throw new Error(`Upload failed: ${result.Err}`);
            } else {
              // Handle legacy response format (direct file_id)
              backendFileId = result as bigint;
            }
          } else {
            if (backendFileId == null) {
              setError("No file ID from backend for chunk upload.");
              setIsUploading(false);
              return;
            }
            const continueResult = await vtk_backend.upload_file_continue({
              file_id: backendFileId,
              file_type: file.type || "application/octet-stream",
              num_chunks: BigInt(totalChunks),
              file_content: new Uint8Array(buffer),
            });

            // Handle the Result type from backend (Ok(()) or Err(error))
            const result = continueResult as any;
            if (result && typeof result === "object" && "Err" in result) {
              throw new Error(`Continue upload failed: ${result.Err}`);
            }
          }

          setProgress(Math.round(((i + 1) / totalChunks) * 100));
        }
      } else if (uploadTarget === "walrus") {
        // TODO: PRODUCTION - Add wallet connection check
        // if (!wallet) {
        //   setError("Please connect your Sui wallet first");
        //   return;
        // }

        // TODO: PRODUCTION - Add token balance check
        // if (parseFloat(suiBalance) < 0.01) {
        //   setError("Insufficient SUI balance for gas fees");
        //   return;
        // }
        // if (parseFloat(walBalance) < requiredWalAmount) {
        //   setError("Insufficient WAL balance for storage");
        //   return;
        // }

        // WALRUS UPLOAD LOGIC
        setProgress(10); // Show progress for Walrus upload

        if (method === "SDK") {
          // SDK upload logic (existing)
          const blob = new Uint8Array(await file.arrayBuffer());
          const secretKey = import.meta.env.VITE_SUI_SECRET_KEY;
          const bytes = Uint8Array.from(Buffer.from(secretKey, "base64"));
          if (bytes.length !== 32) throw new Error("Secret key must be 32 bytes");
          const keypair = Ed25519Keypair.fromSecretKey(bytes);
          const { blobId } = await walrusClient.writeBlob({
            blob,
            deletable: false,
            epochs: 3,
            signer: keypair,
          });
          console.log("Uploaded to Walrus with blobId:", blobId);
          // Register in backend
          const now = BigInt(Date.now());
          await vtk_backend.register_file({
            file_name: file.name,
            storage_provider: "walrus",
            blob_id: [blobId],
            requested_at: now,
            uploaded_at: [now],
          });
          setProgress(100);
        } else if (method === "API") {
          // API upload logic (basic, hardcoded endpoint)
          setProgress(20);
          const apiUrl = DEFAULT_PUBLISHER_API;
          const formData = new FormData();
          formData.append("file", file, file.name);
          // For Walrus, the API expects the raw file as the body, not multipart/form-data
          // So we use fetch with PUT and the file as the body
          const response = await fetch(apiUrl, {
            method: "PUT",
            body: file,
            // headers: { ... } // Add headers if needed
          });
          if (!response.ok) {
            throw new Error(`API upload failed: ${response.status} ${response.statusText}`);
          }
          const result = await response.json();
          console.log("API upload result:", result);
          // Try to extract blobId from result
          const blobId = result?.newlyCreated?.blobObject?.blobId || result?.alreadyCertified?.blobId;
          if (!blobId) throw new Error("No blobId returned from Walrus API");
          // Register in backend
          const now = BigInt(Date.now());
          await vtk_backend.register_file({
            file_name: file.name,
            storage_provider: "walrus",
            blob_id: [blobId],
            requested_at: now,
            uploaded_at: [now],
          });
          setProgress(100);
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error("Upload failed", err);
      setError((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 my-6">
      {/* TODO: PRODUCTION - Add wallet connection UI */}
      {/* <div className="mb-4">
        {!wallet ? (
          <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
            Connect Sui Wallet
          </button>
        ) : (
          <div className="text-sm">
            <span>Connected: {walletAddress}</span>
            <span>SUI: {suiBalance}</span>
            <span>WAL: {walBalance}</span>
          </div>
        )}
      </div> */}

      {/* UPLOAD TARGET SELECTION */}
      <div className="flex items-center space-x-4">
        <label htmlFor="uploadTarget" className="text-sm font-medium text-gray-700">
          Upload Target:
        </label>
        <select
          id="uploadTarget"
          value={uploadTarget}
          onChange={(e) => setUploadTarget(e.target.value as "icp" | "walrus")}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="icp">Upload to ICP</option>
          <option value="walrus">Upload to Walrus</option>
        </select>
        {/* New: Upload method selection */}
        {uploadTarget === "walrus" && (
          <>
            <label htmlFor="uploadMethod" className="text-sm font-medium text-gray-700">
              Method:
            </label>
            <select
              id="uploadMethod"
              value={method}
              onChange={(e) => setMethod(e.target.value as "SDK" | "API")}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="SDK">SDK</option>
              <option value="API">API</option>
            </select>
          </>
        )}
      </div>

      <input
        type="file"
        accept="*/*"
        ref={fileInputRef}
        className="block"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {selectedFile && (
        <div className="text-sm text-gray-700">
          <div>
            <strong>File:</strong> {selectedFile.name}
          </div>
          <div>
            <strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div>
            <strong>Target:</strong> {uploadTarget === "icp" ? "Internet Computer" : "Walrus (Sui)"}
          </div>
          {uploadTarget === "walrus" && (
            <div>
              <strong>Method:</strong> {method}
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">
              Uploading to {uploadTarget === "icp" ? "ICP" : "Walrus"} ({uploadTarget === "walrus" ? method : ""})...
            </span>
            <span className="text-xs font-medium text-blue-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${progress ?? 0}%` }}
            ></div>
          </div>
        </div>
      )}
      {error && <p className="text-red-500">❌ {error}</p>}
      {success && (
        <p className="text-green-600">
          ✅ Upload successful to {uploadTarget === "icp" ? "ICP" : `Walrus (${method})`}!
        </p>
      )}
    </div>
  );
}
