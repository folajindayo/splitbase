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

// Configure metadata following WalletConnect best practices
// See: https://docs.walletconnect.network/
const metadata = {
  name: APP_METADATA.name,
  description: APP_METADATA.description,
  url: APP_METADATA.url,
  icons: [APP_METADATA.icon],
};

// Create the AppKit instance with enhanced configuration
// Following WalletConnect documentation: https://docs.walletconnect.network/
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [baseSepolia, base],
  defaultNetwork: baseSepolia,
  projectId: projectId as string,
  metadata,
  features: {
    analytics: true, // Enable for better insights (recommended by WalletConnect)
    socials: [], // Keep empty for crypto-native experience
    email: false, // Disable email login (we handle auth via wallet)
    swaps: false, // Disable swaps for focused UX
    onramp: false, // Disable onramp for now
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0052FF", // Base blue
    "--w3m-border-radius-master": "8px",
    "--w3m-font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  // Featured wallets - prioritize Base-optimized wallets
  featuredWalletIds: [
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet (Base native)
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ],
  // Include additional popular wallets
  includeWalletIds: [
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a', // Uniswap Wallet
  ],
  // Enable all connector types for flexibility
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true, // Support EIP-6963 for better wallet discovery
  enableCoinbase: true,
  // Add better UX features
  allWallets: 'SHOW', // Show all available wallets
});

export default function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

