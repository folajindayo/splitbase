import { sendCustodyWebhook } from "./custodyWebhook";
import { supabase } from "./supabase";

export interface CustodyNotification {
  id?: string;
  type:
    | "low_balance"
    | "large_deposit"
    | "large_release"
    | "suspicious_activity"
    | "system_alert"
    | "health_warning"
    | "backup_required";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  escrow_id?: string;
  custody_address?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  created_at?: string;
}

/**
 * Create a custody notification
 */
export async function createCustodyNotification(
  notification: Omit<CustodyNotification, "id" | "read" | "created_at">
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("custody_notifications")
      .insert({
        ...notification,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Send webhook if critical
    if (notification.severity === "critical") {
      await sendWebhookForNotification(data);
    }

    return data.id;
  } catch (err) {
    console.error("Error in createCustodyNotification:", err);
    throw err;
  }
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(
  limit: number = 50
): Promise<CustodyNotification[]> {
  try {
    const { data, error } = await supabase
      .from("custody_notifications")
      .select("*")
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getUnreadNotifications:", err);
    return [];
  }
}

/**
 * Get all notifications
 */
export async function getAllNotifications(
  limit: number = 100
): Promise<CustodyNotification[]> {
  try {
    const { data, error } = await supabase
      .from("custody_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getAllNotifications:", err);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("custody_notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
    }
  } catch (err) {
    console.error("Error in markNotificationAsRead:", err);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const { error } = await supabase
      .from("custody_notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
    }
  } catch (err) {
    console.error("Error in markAllNotificationsAsRead:", err);
  }
}

/**
 * Delete old notifications
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("custody_notifications")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error deleting old notifications:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Error in deleteOldNotifications:", err);
    return 0;
  }
}

/**
 * Check for low balance wallets and create notifications
 */
export async function checkAndNotifyLowBalances(
  threshold: number = 0.001
): Promise<number> {
  try {
    const { JsonRpcProvider } = await import("ethers");
    const provider = new JsonRpcProvider("https://sepolia.base.org");

    const { data: escrows } = await supabase
      .from("escrows")
      .select("id, custody_wallet_address, total_amount, title")
      .eq("status", "funded")
      .not("custody_wallet_address", "is", null);

    if (!escrows) return 0;

    let notificationCount = 0;

    for (const escrow of escrows) {
      if (escrow.custody_wallet_address) {
        try {
          const balance = await provider.getBalance(escrow.custody_wallet_address);
          const balanceEth = Number(balance) / 1e18;

          if (balanceEth < threshold || balanceEth < escrow.total_amount * 0.5) {
            await createCustodyNotification({
              type: "low_balance",
              severity: "warning",
              title: "Low Balance Detected",
              message: `Custody wallet for "${escrow.title}" has low balance: ${balanceEth.toFixed(6)} ETH`,
              escrow_id: escrow.id,
              custody_address: escrow.custody_wallet_address,
              metadata: {
                balance: balanceEth,
                expected: escrow.total_amount,
              },
            });
            notificationCount++;
          }
        } catch (err) {
          console.error(`Error checking balance for ${escrow.custody_wallet_address}:`, err);
        }
      }
    }

    return notificationCount;
  } catch (err) {
    console.error("Error in checkAndNotifyLowBalances:", err);
    return 0;
  }
}

/**
 * Notify about large deposits
 */
export async function notifyLargeDeposit(
  escrowId: string,
  custodyAddress: string,
  amount: number,
  threshold: number = 1.0
): Promise<void> {
  if (amount >= threshold) {
    await createCustodyNotification({
      type: "large_deposit",
      severity: "info",
      title: "Large Deposit Detected",
      message: `Large deposit of ${amount} ETH detected in custody wallet`,
      escrow_id: escrowId,
      custody_address: custodyAddress,
      metadata: { amount },
    });
  }
}

/**
 * Notify about large releases
 */
export async function notifyLargeRelease(
  escrowId: string,
  custodyAddress: string,
  amount: number,
  threshold: number = 1.0
): Promise<void> {
  if (amount >= threshold) {
    await createCustodyNotification({
      type: "large_release",
      severity: "warning",
      title: "Large Release Initiated",
      message: `Large release of ${amount} ETH from custody wallet`,
      escrow_id: escrowId,
      custody_address: custodyAddress,
      metadata: { amount },
    });
  }
}

/**
 * Notify about health warnings
 */
export async function notifyHealthWarning(
  title: string,
  message: string,
  details?: Record<string, unknown>
): Promise<void> {
  await createCustodyNotification({
    type: "health_warning",
    severity: "critical",
    title,
    message,
    metadata: details,
  });
}

/**
 * Send webhook for critical notification
 */
async function sendWebhookForNotification(
  notification: CustodyNotification
): Promise<void> {
  try {
    await sendCustodyWebhook({
      event_type: "custody.balance_low",
      escrow_id: notification.escrow_id || "",
      custody_address: notification.custody_address || "",
      data: {
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error sending webhook for notification:", err);
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<{
  total: number;
  unread: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> {
  try {
    const { data: all } = await supabase
      .from("custody_notifications")
      .select("*");

    const { data: unread } = await supabase
      .from("custody_notifications")
      .select("*")
      .eq("read", false);

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    all?.forEach((n) => {
      bySeverity[n.severity] = (bySeverity[n.severity] || 0) + 1;
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: all?.length || 0,
      unread: unread?.length || 0,
      bySeverity,
      byType,
    };
  } catch (err) {
    console.error("Error in getNotificationStats:", err);
    return {
      total: 0,
      unread: 0,
      bySeverity: {},
      byType: {},
    };
  }
}

