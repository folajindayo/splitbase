"use client";

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
  url: "https://splitbase.app",
  icons: ["https://splitbase.app/icon.png"],
};

// Create the AppKit instance
export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [baseSepolia, base],
  defaultNetwork: baseSepolia,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0052FF", // Base blue
  },
});

