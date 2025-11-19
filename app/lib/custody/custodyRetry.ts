import { supabase } from "./supabase";
import { logCustodyAudit } from "./custodyAudit";

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryableTransaction {
  id?: string;
  escrow_id: string;
  transaction_type: "release" | "refund" | "milestone";
  recipient_address: string;
  amount: string;
  chain_id: number;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  // Add jitter (randomness) to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Execute function with exponential backoff retry
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt
      if (attempt === config.maxAttempts - 1) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Store failed transaction for later retry
 */
export async function storeFailedTransaction(
  transaction: Omit<RetryableTransaction, "id" | "created_at" | "updated_at">
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("retryable_transactions")
      .insert({
        ...transaction,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing failed transaction:", error);
      throw new Error(`Failed to store transaction: ${error.message}`);
    }

    return data.id;
  } catch (err) {
    console.error("Error in storeFailedTransaction:", err);
    throw err;
  }
}

/**
 * Get pending retryable transactions
 */
export async function getPendingRetryableTransactions(
  limit: number = 10
): Promise<RetryableTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("retryable_transactions")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", supabase.rpc("max_attempts"))
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching retryable transactions:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getPendingRetryableTransactions:", err);
    return [];
  }
}

/**
 * Update retryable transaction status
 */
export async function updateRetryableTransaction(
  id: string,
  updates: Partial<RetryableTransaction>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("retryable_transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating retryable transaction:", error);
    }
  } catch (err) {
    console.error("Error in updateRetryableTransaction:", err);
  }
}

/**
 * Mark transaction as completed
 */
export async function markTransactionCompleted(
  id: string,
  txHash: string
): Promise<void> {
  await updateRetryableTransaction(id, {
    status: "completed",
    last_error: undefined,
  });

  // Log to audit
  const { data } = await supabase
    .from("retryable_transactions")
    .select("escrow_id")
    .eq("id", id)
    .single();

  if (data) {
    await logCustodyAudit({
      escrow_id: data.escrow_id,
      action_type: "funds_released",
      actor_address: "system",
      custody_address: "",
      metadata: {
        retry_transaction_id: id,
        tx_hash: txHash,
        retry_successful: true,
      },
    });
  }
}

/**
 * Mark transaction as failed
 */
export async function markTransactionFailed(
  id: string,
  error: string
): Promise<void> {
  const { data } = await supabase
    .from("retryable_transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (data) {
    await updateRetryableTransaction(id, {
      status: data.attempts >= data.max_attempts ? "failed" : "pending",
      last_error: error,
      attempts: data.attempts + 1,
    });

    // Log failure
    await logCustodyAudit({
      escrow_id: data.escrow_id,
      action_type: "funds_released",
      actor_address: "system",
      custody_address: "",
      metadata: {
        retry_transaction_id: id,
        retry_failed: true,
        error,
        attempt: data.attempts + 1,
        max_attempts: data.max_attempts,
      },
    });
  }
}

/**
 * Process pending retryable transactions
 * This should be called by a scheduled job/cron
 */
export async function processRetryableTransactions(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const transactions = await getPendingRetryableTransactions(10);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const tx of transactions) {
    if (!tx.id) continue;

    processed++;

    try {
      // Mark as processing
      await updateRetryableTransaction(tx.id, { status: "processing" });

      // Import the release function dynamically to avoid circular deps
      const { sendTransaction, decryptPrivateKey } = await import(
        "./escrowCustody"
      );

      // Get escrow details
      const { data: escrow } = await supabase
        .from("escrows")
        .select("encrypted_private_key, custody_wallet_address")
        .eq("id", tx.escrow_id)
        .single();

      if (!escrow?.encrypted_private_key) {
        throw new Error("Escrow not found or missing private key");
      }

      // Decrypt private key
      const privateKey = decryptPrivateKey(escrow.encrypted_private_key);

      // Send transaction with retry
      const txHash = await retryWithBackoff(
        () =>
          sendTransaction(
            privateKey,
            tx.recipient_address,
            tx.amount,
            tx.chain_id
          ),
        {
          maxAttempts: 3,
          initialDelay: 2000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        }
      );

      // Mark as completed
      await markTransactionCompleted(tx.id, txHash);
      succeeded++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await markTransactionFailed(tx.id, errorMessage);
      failed++;
    }
  }

  return { processed, succeeded, failed };
}

/**
 * Get retry statistics
 */
export async function getRetryStatistics(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    const { data } = await supabase
      .from("retryable_transactions")
      .select("status");

    if (!data) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data.length,
    };

    data.forEach((tx) => {
      stats[tx.status as keyof typeof stats]++;
    });

    return stats;
  } catch (err) {
    console.error("Error in getRetryStatistics:", err);
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  }
}

/**
 * Clean up old completed/failed transactions
 */
export async function cleanupOldRetryableTransactions(
  daysOld: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("retryable_transactions")
      .delete()
      .in("status", ["completed", "failed"])
      .lt("updated_at", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error cleaning up old transactions:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Error in cleanupOldRetryableTransactions:", err);
    return 0;
  }
}

