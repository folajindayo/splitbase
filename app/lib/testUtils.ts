/**
 * Test Utilities for SplitBase Custody System
 * Helper functions for testing custody operations
 * 
 * WARNING: These utilities are for TESTING ONLY
 * Never use in production with real funds
 */

import { supabase } from "./supabase";
import { generateEscrowWallet, encryptPrivateKey } from "./escrowCustody";

export interface TestEscrow {
  id: string;
  title: string;
  buyer_address: string;
  seller_address: string;
  total_amount: number;
  custody_wallet_address: string;
  encrypted_private_key: string;
}

/**
 * Generate test wallet addresses
 */
export function generateTestAddresses(count: number = 2): string[] {
  const addresses: string[] = [];
  for (let i = 0; i < count; i++) {
    const { address } = generateEscrowWallet();
    addresses.push(address);
  }
  return addresses;
}

/**
 * Create a test escrow
 * For testing purposes only
 */
export async function createTestEscrow(
  overrides?: Partial<{
    title: string;
    buyer_address: string;
    seller_address: string;
    total_amount: number;
    escrow_type: "simple" | "time_locked" | "milestone";
  }>
): Promise<TestEscrow | null> {
  try {
    const [buyerAddress, sellerAddress] = generateTestAddresses(2);
    const { address: custodyAddress, privateKey } = generateEscrowWallet();
    const encryptedKey = encryptPrivateKey(privateKey);

    const { data, error } = await supabase
      .from("escrows")
      .insert({
        title: overrides?.title || `Test Escrow ${Date.now()}`,
        description: "Test escrow for development",
        buyer_address: overrides?.buyer_address || buyerAddress,
        seller_address: overrides?.seller_address || sellerAddress,
        total_amount: overrides?.total_amount || 0.1,
        currency: "ETH",
        escrow_type: overrides?.escrow_type || "simple",
        status: "pending",
        auto_release: false,
        custody_wallet_address: custodyAddress,
        encrypted_private_key: encryptedKey,
        deposit_address: custodyAddress,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating test escrow:", error);
      return null;
    }

    return data as TestEscrow;
  } catch (error) {
    console.error("Error in createTestEscrow:", error);
    return null;
  }
}

/**
 * Mark test escrow as funded
 */
export async function markTestEscrowAsFunded(escrowId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("escrows")
      .update({
        status: "funded",
        funded_at: new Date().toISOString(),
      })
      .eq("id", escrowId);

    if (error) {
      console.error("Error marking escrow as funded:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markTestEscrowAsFunded:", error);
    return false;
  }
}

/**
 * Delete test escrow and all related data
 */
export async function deleteTestEscrow(escrowId: string): Promise<boolean> {
  try {
    // Delete milestones first (if any)
    await supabase.from("escrow_milestones").delete().eq("escrow_id", escrowId);

    // Delete activities
    await supabase.from("escrow_activities").delete().eq("escrow_id", escrowId);

    // Delete audit logs
    await supabase.from("custody_audit_logs").delete().eq("escrow_id", escrowId);

    // Delete escrow
    const { error } = await supabase.from("escrows").delete().eq("id", escrowId);

    if (error) {
      console.error("Error deleting test escrow:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteTestEscrow:", error);
    return false;
  }
}

/**
 * Delete all test escrows (titles starting with "Test Escrow")
 */
export async function cleanupAllTestEscrows(): Promise<number> {
  try {
    const { data: escrows } = await supabase
      .from("escrows")
      .select("id")
      .like("title", "Test Escrow%");

    if (!escrows) return 0;

    let deletedCount = 0;
    for (const escrow of escrows) {
      const success = await deleteTestEscrow(escrow.id);
      if (success) deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error("Error in cleanupAllTestEscrows:", error);
    return 0;
  }
}

/**
 * Create test milestone escrow with milestones
 */
export async function createTestMilestoneEscrow(
  milestoneCount: number = 3
): Promise<{ escrow: TestEscrow; milestones: any[] } | null> {
  try {
    const escrow = await createTestEscrow({
      title: `Test Milestone Escrow ${Date.now()}`,
      total_amount: milestoneCount * 0.1,
      escrow_type: "milestone",
    });

    if (!escrow) return null;

    const milestones = [];
    for (let i = 0; i < milestoneCount; i++) {
      const { data } = await supabase
        .from("escrow_milestones")
        .insert({
          escrow_id: escrow.id,
          title: `Test Milestone ${i + 1}`,
          description: `Test milestone description ${i + 1}`,
          amount: 0.1,
          order_index: i,
          status: "pending",
        })
        .select()
        .single();

      if (data) milestones.push(data);
    }

    return { escrow, milestones };
  } catch (error) {
    console.error("Error in createTestMilestoneEscrow:", error);
    return null;
  }
}

/**
 * Get test statistics
 */
export async function getTestStatistics(): Promise<{
  totalTestEscrows: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}> {
  try {
    const { data: escrows } = await supabase
      .from("escrows")
      .select("status, escrow_type")
      .like("title", "Test Escrow%");

    if (!escrows) {
      return { totalTestEscrows: 0, byStatus: {}, byType: {} };
    }

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    escrows.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      byType[e.escrow_type] = (byType[e.escrow_type] || 0) + 1;
    });

    return {
      totalTestEscrows: escrows.length,
      byStatus,
      byType,
    };
  } catch (error) {
    console.error("Error in getTestStatistics:", error);
    return { totalTestEscrows: 0, byStatus: {}, byType: {} };
  }
}

/**
 * Simulate escrow lifecycle for testing
 */
export async function simulateEscrowLifecycle(
  escrowType: "simple" | "milestone" = "simple"
): Promise<{
  success: boolean;
  escrowId?: string;
  steps: string[];
  error?: string;
}> {
  const steps: string[] = [];

  try {
    // Step 1: Create escrow
    steps.push("Creating escrow...");
    let escrow: TestEscrow | null;

    if (escrowType === "milestone") {
      const result = await createTestMilestoneEscrow(2);
      if (!result) throw new Error("Failed to create milestone escrow");
      escrow = result.escrow;
      steps.push(`Created milestone escrow with 2 milestones`);
    } else {
      escrow = await createTestEscrow({ escrow_type: "simple" });
      if (!escrow) throw new Error("Failed to create escrow");
      steps.push("Created simple escrow");
    }

    // Step 2: Mark as funded
    steps.push("Marking as funded...");
    const funded = await markTestEscrowAsFunded(escrow.id);
    if (!funded) throw new Error("Failed to mark as funded");
    steps.push("Escrow marked as funded");

    // Step 3: Simulate time passing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    steps.push("Simulated processing time");

    return {
      success: true,
      escrowId: escrow.id,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate custody system setup
 * Checks if all required components are configured
 */
export async function validateCustodySetup(): Promise<{
  valid: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Check encryption key
  checks.encryptionKey = !!process.env.ESCROW_ENCRYPTION_KEY;
  if (!checks.encryptionKey) {
    errors.push("ESCROW_ENCRYPTION_KEY not set");
  }

  // Check database connection
  try {
    const { error } = await supabase.from("escrows").select("count").limit(1);
    checks.database = !error;
    if (error) errors.push(`Database error: ${error.message}`);
  } catch {
    checks.database = false;
    errors.push("Cannot connect to database");
  }

  // Check RPC connection
  checks.rpcConnection = !!(process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org");

  // Check email configuration (optional)
  checks.email = !!process.env.RESEND_API_KEY;

  const valid = checks.encryptionKey && checks.database && checks.rpcConnection;

  return { valid, checks, errors };
}

// Export types for testing
export type { TestEscrow };

