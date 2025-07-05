import { useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import { vtk_backend } from "declarations/vtk_backend";
import { Button } from "@/components/ui/button";
import { useAccount, usePrepareContractWrite, useContractWrite } from "wagmi";
import { parseUnits } from "viem";
import USDCReceiverABI from "./abi/USDCReceiver.json";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const USDC_RECEIVER_ADDRESS = "0xc6e28A99A04407BA45EdfA7E75dcE5E558eA845F"; // Deployed address

function App() {
  const [greeting, setGreeting] = useState("");
  const [fileId, setFileId] = useState("");
  const [amount, setAmount] = useState("");

  // Wallet connection status
  const { address, isConnected } = useAccount();

  // Prepare contract write
  const { config } = usePrepareContractWrite({
    address: USDC_RECEIVER_ADDRESS,
    abi: USDCReceiverABI,
    functionName: "payForFile",
    args: [fileId, amount ? parseUnits(amount, 6) : 0],
    enabled: Boolean(fileId && amount && isConnected),
  });
  const { write, isLoading, isSuccess } = useContractWrite(config);

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    vtk_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <img src="/logo2.svg" alt="DFINITY logo" className="mx-auto mb-4" />
      <form action="#" onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" className="border rounded px-2 py-1" />
        <button type="submit" className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">
          Click Me!
        </button>
      </form>
      <section id="greeting" className="text-lg font-medium">
        {greeting}
      </section>
      <FileUpload />
      <FileList />
      <div className="bg-blue-500 text-white text-xl p-4 rounded">✅ Tailwind is working!</div>
      <Button>Click me</Button>

      {/* RainbowKit Connect Button */}
      <div className="mt-8">
        <ConnectButton />
      </div>

      {/* Pay for File UI */}
      <div className="mt-8 border rounded p-4 flex flex-col gap-3 bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Pay for File (USDCReceiver)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="File ID"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="number"
            placeholder="Amount (USDC)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded px-2 py-1 w-32"
          />
          <Button disabled={!write || isLoading} onClick={() => write?.()}>
            {isLoading ? "Paying..." : "Pay for File"}
          </Button>
        </div>
        {isSuccess && <div className="text-green-600 font-medium">✅ Payment sent!</div>}
      </div>
    </main>
  );
}

export default App;
