import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import USDCReceiverABI from "../abi/USDCReceiver.json";

const USDC_RECEIVER_ADDRESS = "0xc6e28A99A04407BA45EdfA7E75dcE5E558eA845F"; // Deployed address

export default function PaymentForm() {
  const [fileId, setFileId] = useState("");
  const [amount, setAmount] = useState("");

  // Wallet connection status
  const { address, isConnected } = useAccount();

  // Contract write
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Pay for File (USDCReceiver)</h3>
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="File ID"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          className="border rounded px-3 py-2 flex-1 text-sm"
        />
        <input
          type="number"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-2 w-32 text-sm"
        />
        <Button
          disabled={!fileId || !amount || !isConnected || isPending}
          onClick={() =>
            writeContract({
              address: USDC_RECEIVER_ADDRESS,
              abi: USDCReceiverABI,
              functionName: "payForFile",
              args: [fileId, parseUnits(amount, 6)],
            })
          }
          size="sm"
        >
          {isPending ? "Paying..." : "Pay for File"}
        </Button>
      </div>
      {isSuccess && <div className="mt-3 text-green-600 font-medium text-sm">✅ Payment sent successfully!</div>}
    </div>
  );
}
