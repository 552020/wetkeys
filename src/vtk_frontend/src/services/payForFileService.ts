// import { writeContract } from "wagmi/actions";
import { writeContract } from "@wagmi/core";
import { parseUnits } from "viem";
import { getAccount } from "wagmi/actions"; // optional if you need current wallet
// import USDCReceiverABI from "../abi/USDCReceiver.json";
import { USDCReceiverABI } from "../../src/abi/USDCReceiver";
import { config } from "../../config";
// import { wagmiConfig } from "../wagmiConfig";

export async function payForFile(fileId: string, amount: string) {
  const account = getAccount(config); // ensure user is connected
  const address = import.meta.env.VITE_USDC_RECEIVER_ADDRESS as `0x${string}`;

  return await writeContract(config, {
    address,
    abi: USDCReceiverABI,
    functionName: "payForFile",
    args: [fileId, parseUnits(amount, 6)],
    account: account.address,
  });
}

// payForFileWithHandlers: Handles payment with onSuccess, onFailure, and onTimeout handlers.
//
// onSuccess: Proceed to upload the file. Optionally, trigger logic to retrieve funds from Base to ICP.
// onFailure: Interrupt the flow and show an error message.
// onTimeout: Interrupt the flow and show a timeout message.
//
// NOTE: On success, you may want to implement logic to withdraw/bridge funds from Base to ICP for contract top-up.

export async function payForFileWithHandlers(
  fileId: string,
  amount: string,
  {
    onSuccess,
    onFailure,
    onTimeout,
    timeoutMs = 60000,
  }: {
    onSuccess?: (result: any) => void;
    onFailure?: (error: any) => void;
    onTimeout?: () => void;
    timeoutMs?: number;
  }
) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let didTimeout = false;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      didTimeout = true;
      if (onTimeout) onTimeout();
      reject(new Error("Payment timed out"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([payForFile(fileId, amount), timeoutPromise]);
    if (!didTimeout) {
      if (onSuccess) onSuccess(result);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
    return result;
  } catch (error) {
    if (!didTimeout && onFailure) onFailure(error);
    throw error;
  }
}
