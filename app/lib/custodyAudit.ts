import { supabase } from "./supabase";

export interface CustodyAuditLog {
  id?: string;
  escrow_id: string;
  action_type: 
    | "wallet_created"
    | "key_encrypted"
    | "key_decrypted"
    | "balance_checked"
    | "funds_released"
    | "funds_refunded"
    | "milestone_released"
    | "auto_funded";
  actor_address?: string;
  custody_address: string;
  amount?: string;
  transaction_hash?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

/**
 * Log custody wallet operations for audit trail
 */
export async function logCustodyAudit(log: CustodyAuditLog): Promise<void> {
  try {
    const { error } = await supabase
      .from("custody_audit_logs")
      .insert({
        escrow_id: log.escrow_id,
        action_type: log.action_type,
        actor_address: log.actor_address?.toLowerCase(),
        custody_address: log.custody_address.toLowerCase(),
        amount: log.amount,
        transaction_hash: log.transaction_hash,
        metadata: log.metadata || {},
        ip_address: log.ip_address,
        user_agent: log.user_agent,
      });

    if (error) {
      console.error("Error logging custody audit:", error);
      // Don't throw - we don't want audit logging to break the main flow
    }
  } catch (err) {
    console.error("Failed to log custody audit:", err);
  }
}

/**
 * Get custody audit logs for an escrow
 */
export async function getCustodyAuditLogs(
  escrowId: string
): Promise<CustodyAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from("custody_audit_logs")
      .select("*")
      .eq("escrow_id", escrowId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching custody audit logs:", err);
    return [];
  }
}

/**
 * Get custody audit logs by custody address
 */
export async function getCustodyAuditByAddress(
  custodyAddress: string
): Promise<CustodyAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from("custody_audit_logs")
      .select("*")
      .eq("custody_address", custodyAddress.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching custody audit logs:", err);
    return [];
  }
}

/**
 * Get all custody audit logs (admin only)
 */
export async function getAllCustodyAuditLogs(
  limit: number = 100
): Promise<CustodyAuditLog[]> {
  try {
    const { data, error } = await supabase
      .from("custody_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching all custody audit logs:", err);
    return [];
  }
}

/**
 * Get custody audit statistics
 */
export async function getCustodyAuditStats() {
  try {
    const { data: logs, error } = await supabase
      .from("custody_audit_logs")
      .select("action_type, amount");

    if (error) {
      throw new Error(`Failed to fetch audit stats: ${error.message}`);
    }

    const stats = {
      totalOperations: logs?.length || 0,
      walletCreations: 0,
      balanceChecks: 0,
      fundsReleased: 0,
      fundsRefunded: 0,
      milestonesReleased: 0,
      autoFunded: 0,
      totalAmountReleased: 0,
      totalAmountRefunded: 0,
    };

    logs?.forEach((log) => {
      switch (log.action_type) {
        case "wallet_created":
          stats.walletCreations++;
          break;
        case "balance_checked":
          stats.balanceChecks++;
          break;
        case "funds_released":
          stats.fundsReleased++;
          if (log.amount) {
            stats.totalAmountReleased += parseFloat(log.amount);
          }
          break;
        case "funds_refunded":
          stats.fundsRefunded++;
          if (log.amount) {
            stats.totalAmountRefunded += parseFloat(log.amount);
          }
          break;
        case "milestone_released":
          stats.milestonesReleased++;
          break;
        case "auto_funded":
          stats.autoFunded++;
          break;
      }
    });

    return stats;
  } catch (err) {
    console.error("Error fetching custody audit stats:", err);
    return null;
  }
}

/**
 * Format action type for display
 */
export function formatActionType(actionType: string): string {
  const formatted: Record<string, string> = {
    wallet_created: "Wallet Created",
    key_encrypted: "Key Encrypted",
    key_decrypted: "Key Decrypted",
    balance_checked: "Balance Checked",
    funds_released: "Funds Released",
    funds_refunded: "Funds Refunded",
    milestone_released: "Milestone Released",
    auto_funded: "Auto-Funded",
  };

  return formatted[actionType] || actionType;
}

