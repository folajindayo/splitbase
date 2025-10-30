// Chain IDs
export const CHAIN_IDS = {
  BASE_SEPOLIA: 84532,
  BASE_MAINNET: 8453,
} as const;

// Default chain
export const DEFAULT_CHAIN_ID = CHAIN_IDS.BASE_SEPOLIA;

// Network names
export const NETWORK_NAMES: Record<number, string> = {
  [CHAIN_IDS.BASE_SEPOLIA]: "Base Sepolia",
  [CHAIN_IDS.BASE_MAINNET]: "Base Mainnet",
};

// Block explorer URLs
export const BLOCK_EXPLORERS: Record<number, string> = {
  [CHAIN_IDS.BASE_SEPOLIA]: "https://sepolia.basescan.org",
  [CHAIN_IDS.BASE_MAINNET]: "https://basescan.org",
};

// App metadata
export const APP_METADATA = {
  name: "SplitBase",
  description: "Onchain split payment dashboard powered by Base",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  icon: "https://avatars.githubusercontent.com/u/37784886",
};

// Query limits
export const QUERY_BLOCK_LIMIT = -10000; // Last ~10k blocks

