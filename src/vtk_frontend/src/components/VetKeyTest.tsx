import { useState } from "react";
import { Principal } from "@dfinity/principal";
import { VetkdCryptoService } from "../services/vetkdCrypto";
import { Button } from "./ui/button";

interface VetKeyTestProps {
  actor: any;
  userPrincipal?: Principal;
}

export default function VetKeyTest({ actor, userPrincipal }: VetKeyTestProps) {
  const [testResult, setTestResult] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);

  const runVetKeyTest = async () => {
    if (!userPrincipal) {
      setTestResult("❌ User principal not available. Please login first.");
      return;
    }

    setIsTesting(true);
    setTestResult("🔄 Running VetKey test...");

    try {
      const vetkdCrypto = new VetkdCryptoService(actor);

      // Test 1: Get public key
      setTestResult("🔄 Step 1: Getting public key...");
      const publicKeyResponse = await actor.vetkd_public_key();
      if (!publicKeyResponse || "Err" in publicKeyResponse) {
        throw new Error("Failed to get public key");
      }

      // Test 2: Encrypt test data
      setTestResult("🔄 Step 2: Encrypting test data...");
      const testMessage = "Hello VetKey! This is a test message.";
      const testData = new TextEncoder().encode(testMessage);
      const testBuffer = new ArrayBuffer(testData.length);
      const testView = new Uint8Array(testBuffer);
      testView.set(testData);
      const encryptedData = await vetkdCrypto.encrypt(testBuffer, userPrincipal.toUint8Array());

      // Test 3: Decrypt test data
      setTestResult("🔄 Step 3: Decrypting test data...");
      const decryptedData = await vetkdCrypto.decrypt(encryptedData, userPrincipal.toUint8Array());

      // Test 4: Verify decryption
      const decryptedText = new TextDecoder().decode(decryptedData);

      if (decryptedText === testMessage) {
        setTestResult("✅ VetKey test passed! Encryption and decryption working correctly.");
      } else {
        setTestResult("❌ VetKey test failed! Decrypted data doesn't match original.");
      }
    } catch (error) {
      console.error("VetKey test error:", error);
      setTestResult(`❌ VetKey test failed: ${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">🔐 VetKey Integration Test</h2>

      <div className="mb-4">
        <Button onClick={runVetKeyTest} disabled={isTesting || !userPrincipal} className="w-full">
          {isTesting ? "Testing..." : "Run VetKey Test"}
        </Button>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded ${
            testResult.startsWith("✅")
              ? "bg-green-50 border border-green-200"
              : testResult.startsWith("❌")
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <p
            className={`text-sm ${
              testResult.startsWith("✅")
                ? "text-green-800"
                : testResult.startsWith("❌")
                ? "text-red-800"
                : "text-blue-800"
            }`}
          >
            {testResult}
          </p>
        </div>
      )}

      {!userPrincipal && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">⚠️ Please login first to test VetKey functionality</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Test Description</h3>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Step 1: Get public key from backend</li>
          <li>• Step 2: Encrypt test message using your principal</li>
          <li>• Step 3: Decrypt the encrypted message</li>
          <li>• Step 4: Verify the decrypted message matches original</li>
        </ul>
      </div>
    </div>
  );
}
