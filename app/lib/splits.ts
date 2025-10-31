import { supabase, Split, Recipient } from "./supabase";

export interface SplitWithRecipients extends Split {
  recipients: Recipient[];
}

// Save a new split to the database
export async function saveSplit(
  contractAddress: string,
  ownerAddress: string,
  factoryAddress: string,
  recipients: { wallet_address: string; percentage: number }[],
  name?: string,
  description?: string
): Promise<void> {
  // Insert split
  const { data: splitData, error: splitError } = await supabase
    .from("splits")
    .insert({
      contract_address: contractAddress.toLowerCase(),
      owner_address: ownerAddress.toLowerCase(),
      factory_address: factoryAddress.toLowerCase(),
      name: name || 'Untitled Split',
      description: description || null,
      is_favorite: false,
    })
    .select()
    .single();

  if (splitError) {
    throw new Error(`Failed to save split: ${splitError.message}`);
  }

  // Insert recipients
  const recipientRecords = recipients.map((r) => ({
    split_id: splitData.id,
    wallet_address: r.wallet_address.toLowerCase(),
    percentage: r.percentage,
  }));

  const { error: recipientsError } = await supabase
    .from("recipients")
    .insert(recipientRecords);

  if (recipientsError) {
    throw new Error(`Failed to save recipients: ${recipientsError.message}`);
  }
}

// Update split metadata
export async function updateSplit(
  contractAddress: string,
  updates: { name?: string; description?: string; tags?: string[] }
): Promise<void> {
  const { error } = await supabase
    .from("splits")
    .update(updates)
    .eq("contract_address", contractAddress.toLowerCase());

  if (error) {
    throw new Error(`Failed to update split: ${error.message}`);
  }
}

// Toggle favorite status
export async function toggleFavorite(
  contractAddress: string,
  isFavorite: boolean
): Promise<void> {
  const { error } = await supabase
    .from("splits")
    .update({ is_favorite: isFavorite })
    .eq("contract_address", contractAddress.toLowerCase());

  if (error) {
    throw new Error(`Failed to toggle favorite: ${error.message}`);
  }
}

// Get splits owned by an address
export async function getUserSplits(
  ownerAddress: string
): Promise<SplitWithRecipients[]> {
  const { data: splits, error: splitsError } = await supabase
    .from("splits")
    .select("*")
    .eq("owner_address", ownerAddress.toLowerCase())
    .order("created_at", { ascending: false });

  if (splitsError) {
    throw new Error(`Failed to fetch splits: ${splitsError.message}`);
  }

  if (!splits || splits.length === 0) {
    return [];
  }

  // Fetch recipients for all splits
  const splitIds = splits.map((s) => s.id);
  const { data: recipients, error: recipientsError } = await supabase
    .from("recipients")
    .select("*")
    .in("split_id", splitIds);

  if (recipientsError) {
    throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
  }

  // Combine splits with their recipients
  return splits.map((split) => ({
    ...split,
    recipients: recipients?.filter((r) => r.split_id === split.id) || [],
  }));
}

// Get split details by contract address
export async function getSplitByAddress(
  contractAddress: string
): Promise<SplitWithRecipients | null> {
  const { data: split, error: splitError } = await supabase
    .from("splits")
    .select("*")
    .eq("contract_address", contractAddress.toLowerCase())
    .single();

  if (splitError) {
    if (splitError.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch split: ${splitError.message}`);
  }

  // Fetch recipients
  const { data: recipients, error: recipientsError } = await supabase
    .from("recipients")
    .select("*")
    .eq("split_id", split.id);

  if (recipientsError) {
    throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
  }

  return {
    ...split,
    recipients: recipients || [],
  };
}

// Check if a split exists in the database
export async function splitExists(contractAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("splits")
    .select("id")
    .eq("contract_address", contractAddress.toLowerCase())
    .single();

  return !error && !!data;
}

