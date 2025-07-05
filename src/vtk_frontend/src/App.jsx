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
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" />
        <button type="submit">Click Me!</button>
      </form>
      <section id="greeting">{greeting}</section>
      <FileUpload />
      <FileList />
      <div className="bg-blue-500 text-white text-xl p-4 rounded">✅ Tailwind is working!</div>
      <Button>Click me</Button>

      {/* RainbowKit Connect Button */}
      <div style={{ marginTop: 32 }}>
        <ConnectButton />
      </div>

      {/* Pay for File UI */}
      <div style={{ marginTop: 32 }}>
        <h3>Pay for File (USDCReceiver)</h3>
        <input
          type="text"
          placeholder="File ID"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <Button disabled={!write || isLoading} onClick={() => write?.()}>
          {isLoading ? "Paying..." : "Pay for File"}
        </Button>
        {isSuccess && <div>✅ Payment sent!</div>}
      </div>
    </main>
  );
}

export default App;
