import { isAddress } from "ethers";
import { BLOCK_EXPLORERS, CHAIN_IDS } from "./constants";

// Truncate ethereum address for display
export function truncateAddress(address: string | undefined | null, chars = 4): string {
  if (!address) return "Invalid Address";
  return `${address.substring(0, chars + 2)}...${address.substring(
    address.length - chars
  )}`;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

// Format timestamp to readable date
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get BaseScan URL for address
export function getBaseScanUrl(
  address: string,
  chainId: number,
  type: "address" | "tx" = "address"
): string {
  const baseUrl = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[CHAIN_IDS.BASE_SEPOLIA];
  return `${baseUrl}/${type}/${address}`;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}

// Format percentage for display
export function formatPercentage(value: number | bigint): string {
  return `${value}%`;
}

// Validate that percentages sum to 100
export function validatePercentages(percentages: number[]): boolean {
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return sum === 100;
}

// Check for duplicate addresses
export function hasDuplicateAddresses(addresses: string[]): boolean {
  const lowercaseAddresses = addresses.map((a) => a.toLowerCase());
  return new Set(lowercaseAddresses).size !== lowercaseAddresses.length;
}

