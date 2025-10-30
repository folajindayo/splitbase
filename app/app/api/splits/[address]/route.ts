import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Get split
    const { data: split, error: splitError } = await supabase
      .from("splits")
      .select("*")
      .eq("contract_address", address.toLowerCase())
      .single();

    if (splitError) {
      if (splitError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Split not found" },
          { status: 404 }
        );
      }
      throw splitError;
    }

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("recipients")
      .select("*")
      .eq("split_id", split.id);

    if (recipientsError) {
      throw recipientsError;
    }

    return NextResponse.json({
      split: {
        ...split,
        recipients,
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

