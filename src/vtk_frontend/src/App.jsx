import { useEffect, useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import EnhancedFileUpload from "./components/EnhancedFileUpload";
import EnhancedFileList from "./components/EnhancedFileList";
import VetKeyTest from "./components/VetKeyTest";
import UserProfile from "./components/UserProfile";
import UserList from "./components/UserList";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navigation from "./components/Navigation";
import PaymentForm from "./components/PaymentForm";
import { vtk_backend as defaultActor } from "declarations/vtk_backend";
import { createActor, canisterId } from "declarations/vtk_backend";
import { AuthClient } from "@dfinity/auth-client";
import { UserService } from "./services/userService";

const identityProvider =
  process.env.DFX_NETWORK === "ic" ? "https://identity.ic0.app" : "http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/";

function App() {
  const [greeting, setGreeting] = useState("");
  const [actor, setActor] = useState(defaultActor);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userService, setUserService] = useState(null);
  const [userPrincipal, setUserPrincipal] = useState(null);
  const [currentView, setCurrentView] = useState("files"); // "files", "profile", "users"
  const [useVetKey, setUseVetKey] = useState(true); // Toggle between regular and VetKey components

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header isAuthenticated={isAuthenticated} onLogin={login} onLogout={logout} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <div>
            {/* Navigation */}
            <Navigation currentView={currentView} setCurrentView={setCurrentView} />

            {/* Content based on current view */}
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
                    <button
                      onClick={() => setUseVetKey(!useVetKey)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                    >
                      {useVetKey ? "Use Regular Upload" : "Use VetKey Encryption"}
                    </button>
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

                {/* Payment Form */}
                <div className="mt-8">
                  <PaymentForm />
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Wetkey</h2>
            <p className="text-gray-600 mb-8">Please login to access your files and manage your profile.</p>
            <button
              onClick={login}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Login with Internet Identity
            </button>
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
      </main>

      {/* Footer */}
      <Footer onWhoami={whoami} principal={principal} />
    </div>
  );
}

export default App;
