// Custodial wallet management
// SplitBase holds funds in escrow as the trust layer

import { ethers } from "ethers";

// Get the custodial wallet address from environment
export function getCustodialWalletAddress(): string {
  const address = process.env.NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS;
  if (!address) {
    throw new Error("Custodial wallet address not configured");
  }
  return address;
}

// Generate a unique payment reference for an escrow
export function generatePaymentReference(escrowId: string): string {
  // Create a deterministic reference based on escrow ID
  // This will be used to identify which escrow a payment is for
  const hash = ethers.keccak256(ethers.toUtf8Bytes(escrowId));
  // Take first 8 characters for a shorter reference
  return hash.slice(0, 10).toUpperCase();
}

// Validate payment reference format
export function isValidPaymentReference(reference: string): boolean {
  return /^0X[0-9A-F]{8}$/.test(reference);
}

// Format amount for display
export function formatAmount(amount: number, currency: string = "ETH"): string {
  if (currency === "ETH") {
    return `${amount.toFixed(6)} ETH`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

// Get wallet provider for checking transactions
export async function getWalletProvider(): Promise<ethers.JsonRpcProvider> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Check if a transaction exists and is confirmed
export async function verifyTransaction(
  txHash: string,
  expectedAmount: number,
  toAddress: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const provider = await getWalletProvider();
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return { valid: false, error: "Transaction not found" };
    }

    // Check if transaction is to our custodial wallet
    if (tx.to?.toLowerCase() !== toAddress.toLowerCase()) {
      return { valid: false, error: "Transaction not sent to escrow wallet" };
    }

    // Wait for confirmation
    const receipt = await tx.wait();
    if (!receipt) {
      return { valid: false, error: "Transaction not confirmed" };
    }

    if (receipt.status !== 1) {
      return { valid: false, error: "Transaction failed" };
    }

    // Check amount (convert from wei to ether)
    const amountInEth = parseFloat(ethers.formatEther(tx.value));
    const expectedAmountNum = parseFloat(expectedAmount.toString());
    
    // Allow small discrepancy for gas
    if (Math.abs(amountInEth - expectedAmountNum) > 0.0001) {
      return { 
        valid: false, 
        error: `Amount mismatch. Expected ${expectedAmountNum} ETH, got ${amountInEth} ETH` 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Failed to verify transaction" 
    };
  }
}

// Get transaction details
export async function getTransactionDetails(txHash: string): Promise<{
  from: string;
  to: string;
  amount: string;
  confirmed: boolean;
  blockNumber?: number;
} | null> {
  try {
    const provider = await getWalletProvider();
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) return null;

    const receipt = await tx.wait();
    
    return {
      from: tx.from,
      to: tx.to || "",
      amount: ethers.formatEther(tx.value),
      confirmed: receipt ? receipt.status === 1 : false,
      blockNumber: receipt?.blockNumber,
    };
  } catch (error) {
    console.error("Error getting transaction details:", error);
    return null;
  }
}

