import { supabase } from "./supabase";

// Escrow Types
export interface Escrow {
  id: string;
  title: string;
  description?: string;
  buyer_address: string;
  seller_address: string;
  total_amount: number;
  currency: string;
  escrow_type: 'simple' | 'time_locked' | 'milestone';
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'cancelled' | 'expired';
  release_date?: string;
  auto_release: boolean;
  deposit_address?: string;
  transaction_hash?: string;
  funded_at?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EscrowMilestone {
  id: string;
  escrow_id: string;
  title: string;
  description?: string;
  amount: number;
  order_index: number;
  status: 'pending' | 'completed' | 'released';
  completed_at?: string;
  released_at?: string;
  created_at?: string;
}

export interface EscrowActivity {
  id: string;
  escrow_id: string;
  action_type: string;
  actor_address: string;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface EscrowWithMilestones extends Escrow {
  milestones: EscrowMilestone[];
  activities: EscrowActivity[];
}

export interface CreateEscrowInput {
  title: string;
  description?: string;
  buyer_address: string;
  seller_address: string;
  total_amount: number;
  currency?: string;
  escrow_type: 'simple' | 'time_locked' | 'milestone';
  release_date?: string;
  auto_release?: boolean;
  deposit_address?: string;
  milestones?: Array<{
    title: string;
    description?: string;
    amount: number;
    order_index: number;
  }>;
}

// Create a new escrow
export async function createEscrow(data: CreateEscrowInput): Promise<string> {
  const { milestones, ...escrowData } = data;

  // Insert escrow
  const { data: escrow, error: escrowError } = await supabase
    .from("escrows")
    .insert({
      ...escrowData,
      buyer_address: escrowData.buyer_address.toLowerCase(),
      seller_address: escrowData.seller_address.toLowerCase(),
      currency: escrowData.currency || 'ETH',
      auto_release: escrowData.auto_release || false,
    })
    .select()
    .single();

  if (escrowError) {
    throw new Error(`Failed to create escrow: ${escrowError.message}`);
  }

  // Insert milestones if provided
  if (milestones && milestones.length > 0) {
    const milestoneRecords = milestones.map((m) => ({
      ...m,
      escrow_id: escrow.id,
    }));

    const { error: milestonesError } = await supabase
      .from("escrow_milestones")
      .insert(milestoneRecords);

    if (milestonesError) {
      throw new Error(`Failed to create milestones: ${milestonesError.message}`);
    }
  }

  // Log activity
  await logActivity(escrow.id, "escrow_created", escrowData.buyer_address, "Escrow created");

  return escrow.id;
}

// Get user's escrows (as buyer, seller, or both)
export async function getUserEscrows(
  address: string,
  role: 'buyer' | 'seller' | 'all' = 'all'
): Promise<EscrowWithMilestones[]> {
  const lowerAddress = address.toLowerCase();
  
  let query = supabase.from("escrows").select("*");

  if (role === 'buyer') {
    query = query.eq("buyer_address", lowerAddress);
  } else if (role === 'seller') {
    query = query.eq("seller_address", lowerAddress);
  } else {
    query = query.or(`buyer_address.eq.${lowerAddress},seller_address.eq.${lowerAddress}`);
  }

  const { data: escrows, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch escrows: ${error.message}`);
  }

  if (!escrows || escrows.length === 0) {
    return [];
  }

  // Fetch milestones and activities for all escrows
  const escrowIds = escrows.map((e) => e.id);

  const { data: milestones } = await supabase
    .from("escrow_milestones")
    .select("*")
    .in("escrow_id", escrowIds)
    .order("order_index", { ascending: true });

  const { data: activities } = await supabase
    .from("escrow_activities")
    .select("*")
    .in("escrow_id", escrowIds)
    .order("created_at", { ascending: false });

  // Combine data
  return escrows.map((escrow) => ({
    ...escrow,
    milestones: (milestones || []).filter((m) => m.escrow_id === escrow.id),
    activities: (activities || []).filter((a) => a.escrow_id === escrow.id),
  }));
}

// Get a single escrow by ID
export async function getEscrowById(id: string): Promise<EscrowWithMilestones | null> {
  const { data: escrow, error } = await supabase
    .from("escrows")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch escrow: ${error.message}`);
  }

  // Fetch milestones
  const { data: milestones } = await supabase
    .from("escrow_milestones")
    .select("*")
    .eq("escrow_id", id)
    .order("order_index", { ascending: true });

  // Fetch activities
  const { data: activities } = await supabase
    .from("escrow_activities")
    .select("*")
    .eq("escrow_id", id)
    .order("created_at", { ascending: false });

  return {
    ...escrow,
    milestones: milestones || [],
    activities: activities || [],
  };
}

// Update escrow status
export async function updateEscrowStatus(
  id: string,
  status: Escrow['status'],
  actorAddress?: string,
  message?: string
): Promise<void> {
  const { error } = await supabase
    .from("escrows")
    .update({ 
      status, 
      updated_at: new Date().toISOString(),
      ...(status === 'funded' && { funded_at: new Date().toISOString() }),
      ...(status === 'released' && { released_at: new Date().toISOString() }),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update escrow status: ${error.message}`);
  }

  // Log activity
  if (actorAddress) {
    await logActivity(
      id,
      `status_changed_${status}`,
      actorAddress,
      message || `Status changed to ${status}`
    );
  }
}

// Mark escrow as funded
export async function markEscrowAsFunded(
  escrowId: string,
  transactionHash: string,
  actorAddress: string
): Promise<void> {
  const { error } = await supabase
    .from("escrows")
    .update({ 
      status: 'funded',
      transaction_hash: transactionHash,
      funded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrowId);

  if (error) {
    throw new Error(`Failed to mark escrow as funded: ${error.message}`);
  }

  await logActivity(escrowId, "escrow_funded", actorAddress, "Escrow funded with transaction");
}

// Release escrow funds (for simple and time-locked escrows)
export async function releaseEscrow(escrowId: string, releasedBy: string): Promise<void> {
  const { error } = await supabase
    .from("escrows")
    .update({ 
      status: 'released',
      released_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrowId);

  if (error) {
    throw new Error(`Failed to release escrow: ${error.message}`);
  }

  await logActivity(escrowId, "escrow_released", releasedBy, "Escrow funds released");
}

// Complete a milestone (seller marks as done)
export async function completeMilestone(
  milestoneId: string,
  actorAddress: string
): Promise<void> {
  const { data: milestone, error: fetchError } = await supabase
    .from("escrow_milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch milestone: ${fetchError.message}`);
  }

  const { error } = await supabase
    .from("escrow_milestones")
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    throw new Error(`Failed to complete milestone: ${error.message}`);
  }

  await logActivity(
    milestone.escrow_id,
    "milestone_completed",
    actorAddress,
    `Milestone "${milestone.title}" marked as completed`
  );
}

// Release a milestone (buyer approves payment)
export async function releaseMilestone(
  milestoneId: string,
  releasedBy: string
): Promise<void> {
  const { data: milestone, error: fetchError } = await supabase
    .from("escrow_milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch milestone: ${fetchError.message}`);
  }

  const { error } = await supabase
    .from("escrow_milestones")
    .update({ 
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    throw new Error(`Failed to release milestone: ${error.message}`);
  }

  await logActivity(
    milestone.escrow_id,
    "milestone_released",
    releasedBy,
    `Milestone "${milestone.title}" payment released`
  );

  // Check if all milestones are released
  const { data: allMilestones } = await supabase
    .from("escrow_milestones")
    .select("status")
    .eq("escrow_id", milestone.escrow_id);

  if (allMilestones && allMilestones.every((m) => m.status === 'released')) {
    await updateEscrowStatus(milestone.escrow_id, 'released', releasedBy, "All milestones completed and released");
  }
}

// Cancel an escrow
export async function cancelEscrow(escrowId: string, actorAddress: string): Promise<void> {
  await updateEscrowStatus(escrowId, 'cancelled', actorAddress, "Escrow cancelled");
}

// Open dispute on an escrow
export async function openDispute(
  escrowId: string,
  actorAddress: string,
  reason: string
): Promise<void> {
  await updateEscrowStatus(escrowId, 'disputed', actorAddress, `Dispute opened: ${reason}`);
}

// Log activity
export async function logActivity(
  escrowId: string,
  actionType: string,
  actorAddress: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    action_type: actionType,
    actor_address: actorAddress.toLowerCase(),
    message,
    metadata: metadata || null,
  });

  if (error) {
    console.error(`Failed to log activity: ${error.message}`);
  }
}

// Get escrow statistics
export async function getEscrowStats(address: string): Promise<{
  totalEscrows: number;
  asBuyer: number;
  asSeller: number;
  totalAmount: number;
  activeEscrows: number;
  completedEscrows: number;
}> {
  const lowerAddress = address.toLowerCase();

  const { data: escrows } = await supabase
    .from("escrows")
    .select("*")
    .or(`buyer_address.eq.${lowerAddress},seller_address.eq.${lowerAddress}`);

  if (!escrows) {
    return {
      totalEscrows: 0,
      asBuyer: 0,
      asSeller: 0,
      totalAmount: 0,
      activeEscrows: 0,
      completedEscrows: 0,
    };
  }

  return {
    totalEscrows: escrows.length,
    asBuyer: escrows.filter((e) => e.buyer_address === lowerAddress).length,
    asSeller: escrows.filter((e) => e.seller_address === lowerAddress).length,
    totalAmount: escrows.reduce((sum, e) => sum + parseFloat(e.total_amount.toString()), 0),
    activeEscrows: escrows.filter((e) => ['pending', 'funded'].includes(e.status)).length,
    completedEscrows: escrows.filter((e) => e.status === 'released').length,
  };
}

