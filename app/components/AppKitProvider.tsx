"use client";

import { ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { baseSepolia, base } from "@reown/appkit/networks";
import { APP_METADATA } from "@/lib/constants";

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

// Configure metadata
const metadata = {
  name: APP_METADATA.name,
  description: APP_METADATA.description,
  url: APP_METADATA.url,
  icons: [APP_METADATA.icon],
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
    socials: [],
    email: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0052FF", // Base blue
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
  ],
});

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

