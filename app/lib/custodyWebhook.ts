import { supabase } from "./supabase";

export interface CustodyWebhookPayload {
  event_type:
    | "custody.wallet_created"
    | "custody.funds_received"
    | "custody.funds_released"
    | "custody.funds_refunded"
    | "custody.milestone_released"
    | "custody.balance_low"
    | "custody.dispute_opened";
  escrow_id: string;
  custody_address: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookSubscription {
  id?: string;
  url: string;
  event_types: string[];
  secret: string;
  active: boolean;
  created_at?: string;
}

/**
 * Send webhook notification
 */
export async function sendCustodyWebhook(
  payload: CustodyWebhookPayload
): Promise<void> {
  try {
    // Get active webhook subscriptions for this event type
    const { data: subscriptions, error } = await supabase
      .from("custody_webhooks")
      .select("*")
      .eq("active", true)
      .contains("event_types", [payload.event_type]);

    if (error) {
      console.error("Error fetching webhook subscriptions:", error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // Send to all matching webhooks
    for (const subscription of subscriptions) {
      try {
        await sendWebhookRequest(subscription.url, payload, subscription.secret);
        
        // Log successful webhook delivery
        await logWebhookDelivery(subscription.id, payload, "success");
      } catch (err) {
        console.error(`Failed to send webhook to ${subscription.url}:`, err);
        
        // Log failed webhook delivery
        await logWebhookDelivery(
          subscription.id,
          payload,
          "failed",
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    }
  } catch (err) {
    console.error("Error in sendCustodyWebhook:", err);
  }
}

/**
 * Send HTTP request to webhook URL
 */
async function sendWebhookRequest(
  url: string,
  payload: CustodyWebhookPayload,
  secret: string
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": secret,
      "X-Webhook-Signature": generateWebhookSignature(payload, secret),
      "User-Agent": "SplitBase-Custody-Webhook/1.0",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Generate webhook signature for verification
 */
function generateWebhookSignature(
  payload: CustodyWebhookPayload,
  secret: string
): string {
  // Simple HMAC-like signature
  // In production, use crypto.createHmac('sha256', secret)
  const data = JSON.stringify(payload);
  return Buffer.from(`${secret}:${data}`).toString("base64");
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery(
  webhookId: string,
  payload: CustodyWebhookPayload,
  status: "success" | "failed",
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from("custody_webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: payload.event_type,
      escrow_id: payload.escrow_id,
      status,
      error_message: errorMessage,
      payload,
    });
  } catch (err) {
    console.error("Error logging webhook delivery:", err);
  }
}

/**
 * Create webhook subscription
 */
export async function createWebhookSubscription(
  subscription: WebhookSubscription
): Promise<string> {
  const { data, error } = await supabase
    .from("custody_webhooks")
    .insert({
      url: subscription.url,
      event_types: subscription.event_types,
      secret: subscription.secret,
      active: subscription.active,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create webhook: ${error.message}`);
  }

  return data.id;
}

/**
 * Update webhook subscription
 */
export async function updateWebhookSubscription(
  id: string,
  updates: Partial<WebhookSubscription>
): Promise<void> {
  const { error } = await supabase
    .from("custody_webhooks")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update webhook: ${error.message}`);
  }
}

/**
 * Delete webhook subscription
 */
export async function deleteWebhookSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from("custody_webhooks")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete webhook: ${error.message}`);
  }
}

/**
 * Get webhook subscriptions
 */
export async function getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  const { data, error } = await supabase
    .from("custody_webhooks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch webhooks: ${error.message}`);
  }

  return data || [];
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

