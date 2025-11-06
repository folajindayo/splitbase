import { JsonRpcProvider } from "ethers";
import { supabase } from "./supabase";
import { decryptPrivateKey } from "./escrowCustody";

export interface HealthCheckResult {
  status: "healthy" | "warning" | "critical";
  checks: {
    database: boolean;
    encryption: boolean;
    rpcConnection: boolean;
    custodyWallets: boolean;
  };
  details: {
    totalWallets: number;
    walletsWithBalance: number;
    totalValueInCustody: string;
    issues: string[];
    timestamp: string;
  };
}

/**
 * Perform comprehensive health check of custody system
 */
export async function performCustodyHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: "healthy",
    checks: {
      database: false,
      encryption: false,
      rpcConnection: false,
      custodyWallets: false,
    },
    details: {
      totalWallets: 0,
      walletsWithBalance: 0,
      totalValueInCustody: "0",
      issues: [],
      timestamp: new Date().toISOString(),
    },
  };

  // Check database connectivity
  try {
    const { error } = await supabase.from("escrows").select("count").limit(1);
    result.checks.database = !error;
    if (error) {
      result.details.issues.push(`Database error: ${error.message}`);
      result.status = "critical";
    }
  } catch (err) {
    result.details.issues.push("Database connection failed");
    result.status = "critical";
  }

  // Check encryption/decryption functionality
  try {
    const testKey = "0x" + "a".repeat(64); // Test private key
    const { encryptPrivateKey } = await import("./escrowCustody");
    const encrypted = encryptPrivateKey(testKey);
    const decrypted = decryptPrivateKey(encrypted);
    result.checks.encryption = decrypted === testKey;
    if (!result.checks.encryption) {
      result.details.issues.push("Encryption/decryption mismatch");
      result.status = "critical";
    }
  } catch (err) {
    result.details.issues.push("Encryption system error");
    result.status = "critical";
  }

  // Check RPC connection
  try {
    const provider = new JsonRpcProvider("https://sepolia.base.org");
    await provider.getBlockNumber();
    result.checks.rpcConnection = true;
  } catch (err) {
    result.details.issues.push("RPC connection failed");
    result.status = "warning";
  }

  // Check custody wallets
  try {
    const { data: escrows, error } = await supabase
      .from("escrows")
      .select("id, custody_wallet_address, status, total_amount")
      .not("custody_wallet_address", "is", null);

    if (!error && escrows) {
      result.details.totalWallets = escrows.length;
      result.checks.custodyWallets = true;

      // Check balances if RPC is available
      if (result.checks.rpcConnection) {
        try {
          const provider = new JsonRpcProvider("https://sepolia.base.org");
          let totalBalance = BigInt(0);
          let walletsWithBalance = 0;

          for (const escrow of escrows) {
            if (escrow.custody_wallet_address && escrow.status === "funded") {
              try {
                const balance = await provider.getBalance(escrow.custody_wallet_address);
                if (balance > BigInt(0)) {
                  walletsWithBalance++;
                  totalBalance += balance;
                }
              } catch (err) {
                // Ignore individual wallet errors
              }
            }
          }

          result.details.walletsWithBalance = walletsWithBalance;
          result.details.totalValueInCustody = (Number(totalBalance) / 1e18).toFixed(6);
        } catch (err) {
          result.details.issues.push("Failed to check wallet balances");
        }
      }

      // Check for wallets without encrypted keys
      const walletsWithoutKeys = escrows.filter(e => 
        e.custody_wallet_address && !e.encrypted_private_key
      );
      if (walletsWithoutKeys.length > 0) {
        result.details.issues.push(`${walletsWithoutKeys.length} wallets missing encrypted keys`);
        result.status = "critical";
      }
    } else {
      result.details.issues.push("Failed to query custody wallets");
      result.status = "warning";
    }
  } catch (err) {
    result.details.issues.push("Custody wallet check failed");
    result.status = "warning";
  }

  return result;
}

/**
 * Check if encryption key is properly configured
 */
export function checkEncryptionKeyConfig(): boolean {
  const key = process.env.ESCROW_ENCRYPTION_KEY;
  return !!(key && key.length >= 32);
}

/**
 * Generate health check report text
 */
export function generateHealthCheckReport(result: HealthCheckResult): string {
  let report = "CUSTODY SYSTEM HEALTH CHECK\n";
  report += "=".repeat(80) + "\n\n";
  report += `Status: ${result.status.toUpperCase()}\n`;
  report += `Timestamp: ${result.details.timestamp}\n\n`;

  report += "CHECKS\n";
  report += "-".repeat(80) + "\n";
  report += `Database Connection: ${result.checks.database ? "✓ PASS" : "✗ FAIL"}\n`;
  report += `Encryption System: ${result.checks.encryption ? "✓ PASS" : "✗ FAIL"}\n`;
  report += `RPC Connection: ${result.checks.rpcConnection ? "✓ PASS" : "✗ FAIL"}\n`;
  report += `Custody Wallets: ${result.checks.custodyWallets ? "✓ PASS" : "✗ FAIL"}\n\n`;

  report += "DETAILS\n";
  report += "-".repeat(80) + "\n";
  report += `Total Custody Wallets: ${result.details.totalWallets}\n`;
  report += `Wallets with Balance: ${result.details.walletsWithBalance}\n`;
  report += `Total Value in Custody: ${result.details.totalValueInCustody} ETH\n\n`;

  if (result.details.issues.length > 0) {
    report += "ISSUES\n";
    report += "-".repeat(80) + "\n";
    result.details.issues.forEach((issue, i) => {
      report += `${i + 1}. ${issue}\n`;
    });
  } else {
    report += "No issues detected.\n";
  }

  report += "\n" + "=".repeat(80) + "\n";

  return report;
}

/**
 * Check for low balances in custody wallets
 */
export async function checkLowBalanceWallets(threshold: number = 0.001): Promise<string[]> {
  const lowBalanceWallets: string[] = [];

  try {
    const { data: escrows } = await supabase
      .from("escrows")
      .select("custody_wallet_address, total_amount")
      .eq("status", "funded")
      .not("custody_wallet_address", "is", null);

    if (!escrows) return lowBalanceWallets;

    const provider = new JsonRpcProvider("https://sepolia.base.org");

    for (const escrow of escrows) {
      if (escrow.custody_wallet_address) {
        try {
          const balance = await provider.getBalance(escrow.custody_wallet_address);
          const balanceEth = Number(balance) / 1e18;

          // Check if balance is below threshold or significantly below expected
          if (balanceEth < threshold || balanceEth < escrow.total_amount * 0.5) {
            lowBalanceWallets.push(escrow.custody_wallet_address);
          }
        } catch (err) {
          // Ignore individual errors
        }
      }
    }
  } catch (err) {
    console.error("Error checking low balance wallets:", err);
  }

  return lowBalanceWallets;
}

/**
 * Validate all custody wallet configurations
 */
export async function validateAllCustodyWallets(): Promise<{
  valid: number;
  invalid: number;
  issues: Array<{ escrowId: string; issue: string }>;
}> {
  const result = {
    valid: 0,
    invalid: 0,
    issues: [] as Array<{ escrowId: string; issue: string }>,
  };

  try {
    const { data: escrows } = await supabase
      .from("escrows")
      .select("id, custody_wallet_address, encrypted_private_key")
      .not("custody_wallet_address", "is", null);

    if (!escrows) return result;

    for (const escrow of escrows) {
      let hasIssue = false;

      if (!escrow.custody_wallet_address) {
        result.issues.push({
          escrowId: escrow.id,
          issue: "Missing custody wallet address",
        });
        hasIssue = true;
      }

      if (!escrow.encrypted_private_key) {
        result.issues.push({
          escrowId: escrow.id,
          issue: "Missing encrypted private key",
        });
        hasIssue = true;
      }

      if (hasIssue) {
        result.invalid++;
      } else {
        result.valid++;
      }
    }
  } catch (err) {
    console.error("Error validating custody wallets:", err);
  }

  return result;
}

