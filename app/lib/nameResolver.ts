import { BrowserProvider } from "ethers";

// Cache for resolved names to avoid repeated lookups
const resolvedNamesCache = new Map<string, string>();
const reverseResolveCache = new Map<string, string>();

/**
 * Resolve ENS or Basename to an Ethereum address
 * Supports both .eth (ENS) and .base.eth (Basename) domains
 */
export async function resolveNameToAddress(
  name: string,
  provider?: BrowserProvider
): Promise<string | null> {
  if (!name || !name.trim()) return null;

  const trimmedName = name.trim().toLowerCase();

  // Check if it's already an address
  if (trimmedName.startsWith("0x") && trimmedName.length === 42) {
    return trimmedName;
  }

  // Check cache first
  if (resolvedNamesCache.has(trimmedName)) {
    return resolvedNamesCache.get(trimmedName) || null;
  }

  // Only resolve if it looks like a domain (.eth or .base.eth)
  if (!trimmedName.endsWith(".eth")) {
    return null;
  }

  try {
    // Use provided provider or try to get from window.ethereum
    let ethersProvider = provider;
    
    if (!ethersProvider && typeof window !== "undefined" && window.ethereum) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethersProvider = new BrowserProvider(window.ethereum as any);
    }

    if (!ethersProvider) {
      console.warn("No provider available for name resolution");
      return null;
    }

    // Resolve the name
    const address = await ethersProvider.resolveName(trimmedName);

    if (address) {
      // Cache the result
      resolvedNamesCache.set(trimmedName, address);
      return address;
    }

    return null;
  } catch (error) {
    console.error(`Failed to resolve name ${trimmedName}:`, error);
    return null;
  }
}

/**
 * Reverse resolve an Ethereum address to ENS/Basename
 */
export async function resolveAddressToName(
  address: string,
  provider?: BrowserProvider
): Promise<string | null> {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return null;
  }

  const lowerAddress = address.toLowerCase();

  // Check cache first
  if (reverseResolveCache.has(lowerAddress)) {
    return reverseResolveCache.get(lowerAddress) || null;
  }

  try {
    // Use provided provider or try to get from window.ethereum
    let ethersProvider = provider;
    
    if (!ethersProvider && typeof window !== "undefined" && window.ethereum) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethersProvider = new BrowserProvider(window.ethereum as any);
    }

    if (!ethersProvider) {
      console.warn("No provider available for reverse name resolution");
      return null;
    }

    // Look up the name
    const name = await ethersProvider.lookupAddress(lowerAddress);

    if (name) {
      // Verify the forward resolution matches
      const verifyAddress = await ethersProvider.resolveName(name);
      if (verifyAddress?.toLowerCase() === lowerAddress) {
        // Cache the result
        reverseResolveCache.set(lowerAddress, name);
        return name;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to reverse resolve address ${address}:`, error);
    return null;
  }
}

/**
 * Check if a string is a valid ENS/Basename
 */
export function isValidDomainName(name: string): boolean {
  if (!name || !name.trim()) return false;
  const trimmedName = name.trim().toLowerCase();
  
  // Basic validation for .eth or .base.eth domains
  if (trimmedName.endsWith(".eth")) {
    // Check format: should have at least one character before .eth
    const parts = trimmedName.split(".");
    if (parts.length >= 2 && parts[0].length > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format display name with fallback to truncated address
 */
export function formatDisplayName(
  address: string,
  ensName?: string | null,
  truncateLength: number = 6
): string {
  if (ensName) {
    return ensName;
  }
  
  if (address && address.length === 42) {
    return `${address.slice(0, truncateLength)}...${address.slice(-4)}`;
  }
  
  return address;
}

/**
 * Clear the name resolution cache (useful after network changes)
 */
export function clearNameCache(): void {
  resolvedNamesCache.clear();
  reverseResolveCache.clear();
}
