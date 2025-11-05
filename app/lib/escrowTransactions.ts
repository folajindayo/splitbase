// Client-side escrow transactions using user's connected wallet
// No backend private keys needed!

import { BrowserProvider, parseEther, formatEther } from "ethers";

/**
 * Send escrow deposit directly to seller
 * The buyer sends funds from their wallet to the seller's address
 * We track this in the database but don't hold custody
 */
export async function sendEscrowDeposit(
  sellerAddress: string,
  amount: string,
  currency: string = "ETH"
): Promise<string> {
  try {
    // Get the user's connected wallet provider
    if (!window.ethereum) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Prepare transaction
    const tx = {
      to: sellerAddress,
      value: parseEther(amount),
    };

    console.log(`Sending ${amount} ${currency} to ${sellerAddress}...`);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    console.log(`Transaction sent: ${txResponse.hash}`);

    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed");
    }

    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return txResponse.hash;
  } catch (error) {
    console.error("Error sending escrow deposit:", error);
    throw error;
  }
}

/**
 * Release escrow funds to seller
 * Same as deposit - buyer sends directly to seller from their wallet
 */
export async function releaseEscrowFunds(
  sellerAddress: string,
  amount: string,
  currency: string = "ETH"
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Prepare transaction
    const tx = {
      to: sellerAddress,
      value: parseEther(amount),
    };

    console.log(`Releasing ${amount} ${currency} to ${sellerAddress}...`);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    console.log(`Release transaction sent: ${txResponse.hash}`);

    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt || receipt.status !== 1) {
      throw new Error("Release transaction failed");
    }

    console.log(`Release confirmed in block ${receipt.blockNumber}`);
    
    return txResponse.hash;
  } catch (error) {
    console.error("Error releasing escrow funds:", error);
    throw error;
  }
}

/**
 * Release milestone funds to seller
 */
export async function releaseMilestoneFunds(
  sellerAddress: string,
  amount: number,
  currency: string = "ETH"
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Prepare transaction
    const tx = {
      to: sellerAddress,
      value: parseEther(amount.toString()),
    };

    console.log(`Releasing milestone: ${amount} ${currency} to ${sellerAddress}...`);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    console.log(`Milestone release transaction sent: ${txResponse.hash}`);

    // Wait for confirmation
    const receipt = await txResponse.wait();
    
    if (!receipt || receipt.status !== 1) {
      throw new Error("Milestone release transaction failed");
    }

    console.log(`Milestone release confirmed in block ${receipt.blockNumber}`);
    
    return txResponse.hash;
  } catch (error) {
    console.error("Error releasing milestone funds:", error);
    throw error;
  }
}

/**
 * Verify a transaction on the blockchain
 */
export async function verifyTransaction(
  txHash: string,
  expectedTo: string,
  expectedAmount: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!window.ethereum) {
      throw new Error("No wallet connected");
    }

    const provider = new BrowserProvider(window.ethereum);
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return { valid: false, error: "Transaction not found" };
    }

    // Check recipient
    if (tx.to?.toLowerCase() !== expectedTo.toLowerCase()) {
      return { valid: false, error: "Transaction sent to wrong address" };
    }

    // Wait for confirmation
    const receipt = await tx.wait();
    if (!receipt) {
      return { valid: false, error: "Transaction not confirmed" };
    }

    if (receipt.status !== 1) {
      return { valid: false, error: "Transaction failed" };
    }

    // Check amount
    const amountInEth = parseFloat(formatEther(tx.value));
    const expectedAmountNum = parseFloat(expectedAmount);
    
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

/**
 * Get current gas price estimate
 */
export async function estimateGasCost(
  toAddress: string,
  amount: string
): Promise<{
  gasEstimate: bigint;
  gasCostInEth: string;
  totalCostInEth: string;
}> {
  try {
    if (!window.ethereum) {
      throw new Error("No wallet connected");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      from: await signer.getAddress(),
      to: toAddress,
      value: parseEther(amount),
    });

    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    // Calculate costs
    const gasCost = gasEstimate * gasPrice;
    const amountInWei = parseEther(amount);
    const totalCost = amountInWei + gasCost;

    return {
      gasEstimate,
      gasCostInEth: formatEther(gasCost),
      totalCostInEth: formatEther(totalCost),
    };
  } catch (error) {
    console.error("Error estimating gas cost:", error);
    throw error;
  }
}

