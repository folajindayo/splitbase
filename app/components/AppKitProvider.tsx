"use client";

import { ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { base, baseSepolia } from "@reown/appkit/networks";

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

// Configure metadata
const metadata = {
  name: "SplitBase",
  description: "Onchain split payment dashboard powered by Base",
  url: "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create the AppKit instance - only runs once at module level
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [baseSepolia, base],
  defaultNetwork: baseSepolia,
  projectId: projectId as string,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0052FF", // Base blue
  },
  allowUnsupportedChain: false,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
});

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

