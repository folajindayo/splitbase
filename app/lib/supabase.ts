import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Split {
  id: string;
  contract_address: string;
  owner_address: string;
  factory_address: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  tags?: string[];
  owner_email?: string;
  owner_email_notifications?: boolean;
  created_at: string;
}

export interface Recipient {
  id?: string;
  split_id?: string;
  wallet_address: string;
  percentage: number;
  email?: string;
  email_notifications?: boolean;
}

