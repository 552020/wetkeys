import { Button } from "@/components/ui/button";
import { RainbowButton } from "@rainbow-me/rainbow-button";

export default function Header({ isAuthenticated, onLogin, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center">
            <h1 className="text-9-xl font-bold text-gray-900">Wetkey</h1>
          </div>

          {/* Authentication Controls */}
          <div className="flex items-center space-x-4">
            {/* ICP Authentication Section */}
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
              <div className="text-xs text-gray-500 font-medium">ICP:</div>
              {!isAuthenticated ? (
                <Button onClick={onLogin} size="sm">
                  Login ICP
                </Button>
              ) : (
                <Button onClick={onLogout} size="sm" variant="outline">
                  Logout ICP
                </Button>
              )}
            </div>

            {/* Ethereum Authentication Section */}
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500 font-medium">ETH:</div>
              <RainbowButton.Custom>
                {({ ready, connect, account }) => (
                  <Button size="sm" onClick={connect} disabled={!ready} type="button" variant="default">
                    {account ? "Connected" : "Login ETH"}
                  </Button>
                )}
              </RainbowButton.Custom>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
