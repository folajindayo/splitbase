// Escrow custody wallet management (no smart contracts)
import { Wallet, HDNodeWallet } from "ethers";
import crypto from "crypto";

// Encryption key - In production, use environment variable
const ENCRYPTION_KEY = process.env.ESCROW_ENCRYPTION_KEY || "change-this-to-secure-key-32-chars!!";

/**
 * Generate a new wallet for an escrow
 */
export function generateEscrowWallet(): { address: string; privateKey: string } {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Encrypt private key for secure storage
 */
export function encryptPrivateKey(privateKey: string): string {
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Return IV + encrypted data
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt private key");
  }
}

/**
 * Decrypt private key for transaction signing
 */
export function decryptPrivateKey(encryptedData: string): string {
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    
    const [ivHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt private key");
  }
}

/**
 * Get wallet instance from encrypted private key
 */
export function getWalletFromEncrypted(encryptedPrivateKey: string): Wallet {
  const privateKey = decryptPrivateKey(encryptedPrivateKey);
  return new Wallet(privateKey);
}

/**
 * Check if address has sufficient balance
 */
export async function checkWalletBalance(
  address: string,
  provider: any
): Promise<string> {
  try {
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error("Error checking balance:", error);
    throw new Error("Failed to check wallet balance");
  }
}

/**
 * Send funds from escrow wallet to recipient
 */
export async function sendFundsFromEscrow(
  encryptedPrivateKey: string,
  recipientAddress: string,
  amount: string,
  provider: any
): Promise<string> {
  try {
    const wallet = getWalletFromEncrypted(encryptedPrivateKey);
    const connectedWallet = wallet.connect(provider);
    
    const tx = await connectedWallet.sendTransaction({
      to: recipientAddress,
      value: amount,
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error sending funds:", error);
    throw new Error("Failed to send funds from escrow");
  }
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

