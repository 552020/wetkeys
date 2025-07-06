import { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import EnhancedFileUpload from "./components/EnhancedFileUpload";
import EnhancedFileList from "./components/EnhancedFileList";
import VetKeyTest from "./components/VetKeyTest";
import UserProfile from "./components/UserProfile";
import UserList from "./components/UserList";
import { vtk_backend as defaultActor } from "declarations/vtk_backend";
import { createActor, canisterId } from "declarations/vtk_backend";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { Button } from "@/components/ui/button";
import { useAccount, usePrepareContractWrite, useContractWrite } from "wagmi";
import { parseUnits } from "viem";
import USDCReceiverABI from "./abi/USDCReceiver.json";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { UserService } from "./services/userService";

const USDC_RECEIVER_ADDRESS = "0xc6e28A99A04407BA45EdfA7E75dcE5E558eA845F"; // Deployed address
const identityProvider =
  process.env.DFX_NETWORK === "ic" ? "https://identity.ic0.app" : "http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/";

function App() {
  const [greeting, setGreeting] = useState("");
  const [fileId, setFileId] = useState("");
  const [amount, setAmount] = useState("");
  const [actor, setActor] = useState(defaultActor);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userService, setUserService] = useState(null);
  const [userPrincipal, setUserPrincipal] = useState(null);
  const [currentView, setCurrentView] = useState("files"); // "files", "profile", "users"
  const [useVetKey, setUseVetKey] = useState(true); // Toggle between regular and VetKey components

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

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      const identity = client.getIdentity();
      const newActor = createActor(canisterId, {
        agentOptions: { identity },
      });
      setAuthClient(client);
      setActor(newActor);
      setUserService(new UserService(newActor));
      setIsAuthenticated(await client.isAuthenticated());
    });
  }, []);

  const login = async () => {
    await authClient.login({
      identityProvider,
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const authedActor = createActor(canisterId, {
          agentOptions: { identity },
        });
        setActor(authedActor);
        setUserService(new UserService(authedActor));
        setIsAuthenticated(true);
        await whoami();
      },
    });
  };

  const logout = async () => {
    await authClient.logout();
    const anonActor = createActor(canisterId); // fallback to anonymous
    setActor(anonActor);
    setUserService(new UserService(anonActor));
    setIsAuthenticated(false);
    setPrincipal("");
    setCurrentView("files");
  };

  const whoami = async () => {
    const result = await actor.whoami();
    // console.log(Object.keys(actor)); //logs method names available on the actor object
    setPrincipal(result.toString());
    setUserPrincipal(result);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = event.target.elements.name.value;
    actor.greet(name).then(setGreeting);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="/logo2.svg" alt="DFINITY logo" className="h-12 w-auto" />
            <h1 className="ml-4 text-2xl font-bold text-gray-900">VTK File Manager</h1>
          </div>

          {/* Authentication Controls */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? <Button onClick={login}>Login</Button> : <Button onClick={logout}>Logout</Button>}
            <Button onClick={whoami} variant="outline">
              Whoami
            </Button>
          </div>
        </div>

        {/* Principal Display */}
        {principal && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-sm font-medium text-blue-800">Your Principal ID:</h2>
            <p className="text-blue-900 font-mono text-sm">{principal}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        {isAuthenticated && (
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              <button
                onClick={() => setCurrentView("files")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === "files"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setCurrentView("profile")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setCurrentView("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentView === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Users
              </button>
            </nav>
          </div>
        )}

        {/* Main Content */}
        {isAuthenticated ? (
          <div>
            {currentView === "files" && (
              <div>
                {/* VetKey Toggle */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">🔐 VetKey Encryption</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {useVetKey
                          ? "Files are encrypted using your principal as identity"
                          : "Files are stored without encryption"}
                      </p>
                    </div>
                    <Button onClick={() => setUseVetKey(!useVetKey)} variant="outline" size="sm">
                      {useVetKey ? "Use Regular Upload" : "Use VetKey Encryption"}
                    </Button>
                  </div>
                </div>

                {useVetKey ? (
                  <div>
                    {console.log("Actor for VetKeyTest:", actor, Object.keys(actor))}
                    <VetKeyTest actor={actor} userPrincipal={userPrincipal} />
                    <div className="mt-6">
                      <EnhancedFileUpload actor={actor} userPrincipal={userPrincipal} />
                    </div>
                    <div className="mt-6">
                      <EnhancedFileList actor={actor} userPrincipal={userPrincipal} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <FileUpload actor={actor} />
                    <FileList actor={actor} />
                  </div>
                )}

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
              </div>
            )}

            {currentView === "profile" && userService && (
              <UserProfile
                userService={userService}
                onProfileCreated={(profile) => {
                  console.log("Profile created:", profile);
                }}
              />
            )}

            {currentView === "users" && userService && <UserList userService={userService} />}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to VTK File Manager</h2>
            <p className="text-gray-600 mb-8">Please login to access your files and manage your profile.</p>
            <Button onClick={login} size="lg">
              Login with Internet Identity
            </Button>
          </div>
        )}

        {/* Legacy Greeting Form (hidden by default) */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Legacy Greeting Form</summary>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <form action="#" onSubmit={handleSubmit}>
              <label htmlFor="name">Enter your name: &nbsp;</label>
              <input id="name" alt="Name" type="text" />
              <button type="submit">Click Me!</button>
            </form>
            <section id="greeting">{greeting}</section>
          </div>
        </details>
      </div>
    </main>
  );
}

export default App;
