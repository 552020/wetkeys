import { useRef, useState, useEffect } from "react";
// import { backend } from "@/declarations/backend"; // Adjust path if needed
import { vtk_backend } from "../../../declarations/vtk_backend";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
import { Buffer } from "buffer";
import { createVetKeysManager, VetKeysManager } from "../lib/vetkeys";

// CREATE THE CLIENTS
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
const walrusClient = new WalrusClient({
  network: "testnet",
  suiClient,
  wasmUrl: walrusWasmUrl,
});

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export default function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileIdCounter, setFileIdCounter] = useState(1); // Simple counter for file_id
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vetKeysManager, setVetKeysManager] = useState<VetKeysManager | null>(null);

  // USER CHOICE STATE
  const [uploadTarget, setUploadTarget] = useState<"icp" | "walrus" | "vetkeys">("vetkeys");

  // TODO: PRODUCTION - Add wallet connection state
  // const [wallet, setWallet] = useState<any>(null);
  // const [walletAddress, setWalletAddress] = useState<string>("");
  // const [suiBalance, setSuiBalance] = useState<string>("");
  // const [walBalance, setWalBalance] = useState<string>("");

  // Initialize vetKeys manager
  useEffect(() => {
    // In a real app, you would get the agent from your Internet Identity setup
    // For now, we'll create a mock agent
    const mockAgent = {
      call: async (canisterId: string, method: string, args: any[]) => {
        // This is a simplified mock - in reality, you'd use the actual agent
        if (method === 'upload_file_atomic') {
          return Math.floor(Math.random() * 1000); // Mock file ID
        }
        return null;
      }
    };
    
    setVetKeysManager(createVetKeysManager(mockAgent));
  }, []);

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
      if (uploadTarget === "vetkeys") {
        // VETKEYS UPLOAD LOGIC
        if (!vetKeysManager) {
          throw new Error("VetKeys manager not initialized");
        }

        const fileContent = new Uint8Array(await file.arrayBuffer());
        const fileType = file.type || "application/octet-stream";
        
        console.log("Uploading file with vetKeys encryption:", {
          name: file.name,
          size: fileContent.length,
          type: fileType
        });

        const fileId = await vetKeysManager.uploadFile(
          file.name,
          fileContent,
          fileType,
          [] // No sharing for now
        );

        console.log("File uploaded with vetKeys, ID:", fileId);
        setProgress(100);
        setSuccess(true);
      } else if (uploadTarget === "icp") {
        // ICP UPLOAD LOGIC
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const num_chunks = BigInt(totalChunks);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const buffer = await chunk.arrayBuffer();
          const file_content = [...new Uint8Array(buffer)];

          if (i === 0) {
            // First chunk with metadata
            const uploadArgs = {
              name: file.name, // ✅ Backend expects 'name'
              content: new Uint8Array(buffer), // ✅ Backend expects 'content'
              file_type: file.type || "application/octet-stream",
              num_chunks,
            };
            console.log("upload_file_atomic args:", uploadArgs);
            await vtk_backend.upload_file_atomic(uploadArgs);
          } else {
            // Remaining chunks
            const file_id = BigInt(fileIdCounter);
            await vtk_backend.upload_file_continue({
              file_id,
              file_content: new Uint8Array(buffer),
              file_type: file.type || "application/octet-stream",
              num_chunks,
            });
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
        setProgress(50); // Show progress for Walrus upload

        const blob = new Uint8Array(await file.arrayBuffer());
        // TODO: PRODUCTION - Replace with real wallet integration
        // - Connect to user's actual Sui wallet (Sui Wallet, Suiet, etc.)
        // - Get signer from connected wallet
        // - Check SUI and WAL token balances before upload

        // DEVELOPMENT: Use persistent keypair from environment
        // In production, replace this with real wallet integration
        const secretKey = import.meta.env.VITE_SUI_SECRET_KEY;
        const bytes = Uint8Array.from(Buffer.from(secretKey, "base64"));
        if (bytes.length !== 32) throw new Error("Secret key must be 32 bytes");
        const keypair = Ed25519Keypair.fromSecretKey(bytes);
        // const secretKey = import.meta.env.VITE_SUI_SECRET_KEY;
        if (!secretKey) {
          throw new Error("VITE_SUI_SECRET_KEY environment variable not set");
        }

        console.log("Secret key (base64):", secretKey);
        console.log("Secret key length (base64):", secretKey.length);

        // Convert base64 string to Uint8Array properly
        const binaryString = atob(secretKey);
        console.log("Binary string length:", binaryString.length);

        // const bytes = new Uint8Array(binaryString.length);
        // for (let i = 0; i < binaryString.length; i++) {
        //   bytes[i] = binaryString.charCodeAt(i);
        // }
        // const bytes = Uint8Array.from(Buffer.from(secretKey, "base64"));

        console.log("Bytes array length:", bytes.length);
        console.log("First 10 bytes:", bytes.slice(0, 10));
        console.log("Last 10 bytes:", bytes.slice(-10));

        // const keypair = Ed25519Keypair.fromSecretKey(bytes);
        const { blobId } = await walrusClient.writeBlob({
          blob,
          deletable: false,
          epochs: 3,
          signer: keypair,
        });

        console.log("Uploaded to Walrus with blobId:", blobId);
        setProgress(100);
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
          onChange={(e) => setUploadTarget(e.target.value as "icp" | "walrus" | "vetkeys")}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="vetkeys">Upload with VetKeys (Encrypted)</option>
          <option value="icp">Upload to ICP</option>
          <option value="walrus">Upload to Walrus</option>
        </select>
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
            <strong>Target:</strong> {uploadTarget === "icp" ? "Internet Computer" : uploadTarget === "walrus" ? "Walrus (Sui)" : "VetKeys"}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">
              Uploading to {uploadTarget === "icp" ? "ICP" : uploadTarget === "walrus" ? "Walrus" : "VetKeys"}...
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
        <p className="text-green-600">✅ Upload successful to {uploadTarget === "icp" ? "ICP" : uploadTarget === "walrus" ? "Walrus" : "VetKeys"}!</p>
      )}
    </div>
  );
}

// FileList component: lists files from the backend
export function FileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div>Loading files...</div>;
  if (error) return <div className="text-red-500">❌ {error}</div>;
  if (files.length === 0) return <div>No files found.</div>;

  return (
    <div className="my-6">
      <h2 className="font-bold mb-2">Uploaded Files (ICP)</h2>
      <ul className="space-y-2">
        {files.map((file, idx) => (
          <li key={file.file_id ?? idx} className="border p-2 rounded">
            <div>
              <strong>Name:</strong> {file.file_name}
            </div>
            <div>
              <strong>Status:</strong> {JSON.stringify(file.file_status)}
            </div>
            {file.size && (
              <div>
                <strong>Size:</strong> {file.size} bytes
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
