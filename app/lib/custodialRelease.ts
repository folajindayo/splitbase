// Custodial fund release logic
// This module handles releasing funds from the custodial wallet to sellers

import { ethers } from "ethers";

/**
 * Release funds from custodial wallet to seller
 * NOTE: This should only be called from a secure backend API route
 * NEVER expose private keys on the client side
 */
export async function releaseFundsFromCustody(
  sellerAddress: string,
  amount: string,
  currency: string = "ETH"
): Promise<string> {
  try {
    // Get RPC provider
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Load custodial wallet (MUST be server-side only!)
    // In production, use secure key management (AWS KMS, HashiCorp Vault, etc.)
    const privateKey = process.env.CUSTODIAL_WALLET_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error("Custodial wallet private key not configured");
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    // Verify we're using the correct custodial address
    const custodialAddress = process.env.NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS;
    if (wallet.address.toLowerCase() !== custodialAddress?.toLowerCase()) {
      throw new Error("Custodial wallet address mismatch");
    }

    // Convert amount to wei
    const amountInWei = ethers.parseEther(amount);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    if (balance < amountInWei) {
      throw new Error(
        `Insufficient balance. Have ${ethers.formatEther(balance)} ETH, need ${amount} ETH`
      );
    }

    // Prepare transaction
    const tx = {
      to: sellerAddress,
      value: amountInWei,
      // Add extra gas for safety
      gasLimit: 21000,
    };

    // Send transaction
    const txResponse = await wallet.sendTransaction(tx);
    
    console.log(`Releasing ${amount} ${currency} to ${sellerAddress}`);
    console.log(`Transaction hash: ${txResponse.hash}`);

    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed");
    }

    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return txResponse.hash;
  } catch (error) {
    console.error("Error releasing funds from custody:", error);
    throw error;
  }
}

/**
 * Get custodial wallet balance
 */
export async function getCustodialBalance(): Promise<{
  balance: string;
  address: string;
}> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const custodialAddress = process.env.NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS;
    
    if (!custodialAddress) {
      throw new Error("Custodial wallet address not configured");
    }

    const balance = await provider.getBalance(custodialAddress);
    
    return {
      balance: ethers.formatEther(balance),
      address: custodialAddress,
    };
  } catch (error) {
    console.error("Error getting custodial balance:", error);
    throw error;
  }
}

/**
 * Estimate gas cost for releasing funds
 */
export async function estimateReleaseCost(
  sellerAddress: string,
  amount: string
): Promise<{
  gasEstimate: bigint;
  gasCostInEth: string;
  totalCostInEth: string;
}> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const custodialAddress = process.env.NEXT_PUBLIC_CUSTODIAL_WALLET_ADDRESS;
    
    if (!custodialAddress) {
      throw new Error("Custodial wallet address not configured");
    }

    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      from: custodialAddress,
      to: sellerAddress,
      value: ethers.parseEther(amount),
    });

    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    // Calculate costs
    const gasCost = gasEstimate * gasPrice;
    const amountInWei = ethers.parseEther(amount);
    const totalCost = amountInWei + gasCost;

    return {
      gasEstimate,
      gasCostInEth: ethers.formatEther(gasCost),
      totalCostInEth: ethers.formatEther(totalCost),
    };
  } catch (error) {
    console.error("Error estimating release cost:", error);
    throw error;
  }
}

/**
 * Validate seller address
 */
export function validateAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

