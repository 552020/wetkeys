import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "VTK App",
  chains: [baseSepolia],
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Replace with your WalletConnect Project ID
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        <App />
      </RainbowKitProvider>
    </WagmiProvider>
  </React.StrictMode>
);
