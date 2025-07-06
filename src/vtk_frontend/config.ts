import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { rainbowConnector } from "@rainbow-me/rainbow-button";

export const config = createConfig({
  connectors: [
    rainbowConnector({
      appName: "Wetkey",
      projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // <-- get this from https://cloud.walletconnect.com
    }),
  ],
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
