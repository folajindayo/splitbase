import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");

    if (!owner) {
      return NextResponse.json(
        { error: "Owner address is required" },
        { status: 400 }
      );
    }

    const { data: splits, error } = await supabase
      .from("splits")
      .select("*")
      .eq("owner_address", owner.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ splits });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_address, owner_address, factory_address, recipients } = body;

    if (!contract_address || !owner_address || !factory_address || !recipients) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert split
    const { data: splitData, error: splitError } = await supabase
      .from("splits")
      .insert({
        contract_address: contract_address.toLowerCase(),
        owner_address: owner_address.toLowerCase(),
        factory_address: factory_address.toLowerCase(),
      })
      .select()
      .single();

    if (splitError) {
      throw splitError;
    }

    // Insert recipients
    const recipientRecords = recipients.map((r: any) => ({
      split_id: splitData.id,
      wallet_address: r.wallet_address.toLowerCase(),
      percentage: r.percentage,
    }));

    const { error: recipientsError } = await supabase
      .from("recipients")
      .insert(recipientRecords);

    if (recipientsError) {
      throw recipientsError;
    }

    return NextResponse.json({ success: true, split: splitData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

