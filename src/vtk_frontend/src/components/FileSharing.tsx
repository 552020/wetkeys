import { useState } from "react";
import { FileSharingService } from "../services/fileSharingService";

interface FileSharingProps {
  fileSharingService: FileSharingService;
  fileId: bigint;
  fileName: string;
  sharedWith: Array<{
    principal_id: string;
    username: string;
    display_name?: string;
  }>;
  onShareUpdate?: () => void;
}

export default function FileSharing({ 
  fileSharingService, 
  fileId, 
  fileName, 
  sharedWith, 
  onShareUpdate 
}: FileSharingProps) {
  const [targetUsername, setTargetUsername] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isUnsharing, setIsUnsharing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleShare = async () => {
    if (!targetUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fileSharingService.shareFile(fileId, targetUsername.trim());
      
      if (fileSharingService.isFileSharingResponseOk(response)) {
        setSuccess(`File "${fileName}" shared successfully with ${targetUsername}`);
        setTargetUsername("");
        onShareUpdate?.();
      } else {
        setError(fileSharingService.getFileSharingErrorMessage(response));
      }
    } catch (err) {
      setError((err as Error).message || "Failed to share file");
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (username: string) => {
    setIsUnsharing(username);
    setError(null);
    setSuccess(null);

    try {
      const response = await fileSharingService.unshareFile(fileId, username);
      
      if (fileSharingService.isFileSharingResponseOk(response)) {
        setSuccess(`File "${fileName}" unshared from ${username}`);
        onShareUpdate?.();
      } else {
        setError(fileSharingService.getFileSharingErrorMessage(response));
      }
    } catch (err) {
      setError((err as Error).message || "Failed to unshare file");
    } finally {
      setIsUnsharing(null);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold text-gray-800 mb-3">📤 Share File</h3>
      
      {/* Share with new user */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter username to share with"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSharing}
        />
        <button
          onClick={handleShare}
          disabled={isSharing || !targetUsername.trim()}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? "⏳" : "Share"}
        </button>
      </div>

      {/* Currently shared with */}
      {sharedWith.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Currently shared with:</h4>
          <div className="space-y-2">
            {sharedWith.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <span className="font-medium text-gray-800">
                    {user.display_name || user.username}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">@{user.username}</span>
                </div>
                <button
                  onClick={() => handleUnshare(user.username)}
                  disabled={isUnsharing === user.username}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnsharing === user.username ? "⏳" : "Unshare"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
          ✅ {success}
        </div>
      )}

      {sharedWith.length === 0 && !error && !success && (
        <div className="text-sm text-gray-500 italic">
          This file is not shared with anyone yet.
        </div>
      )}
    </div>
  );
} 