import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { RainbowButtonProvider } from "@rainbow-me/rainbow-button";
import { WagmiProvider } from "wagmi";
import { config } from "../config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { baseSepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// const config = getDefaultConfig({
//   appName: "VTK App",
//   chains: [baseSepolia],
//   projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Replace with your WalletConnect Project ID
// });

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowButtonProvider>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </RainbowButtonProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
