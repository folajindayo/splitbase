import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { supabase } from "@/lib/supabase";
import { getCustodyAuditStats } from "@/lib/custodyAudit";

export async function GET(req: NextRequest) {
  try {
    // Get all escrows with custody wallets
    const { data: escrows, error } = await supabase
      .from("escrows")
      .select("id, status, custody_wallet_address, total_amount, currency, created_at")
      .not("custody_wallet_address", "is", null);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch escrows" },
        { status: 500 }
      );
    }

    if (!escrows || escrows.length === 0) {
      return NextResponse.json({
        totalEscrows: 0,
        totalValueInCustody: "0",
        byStatus: {},
        byCurrency: {},
        auditStats: null,
      });
    }

    // Calculate total value in custody
    const provider = new JsonRpcProvider("https://sepolia.base.org");
    let totalBalanceWei = BigInt(0);
    const statusCounts: Record<string, number> = {};
    const currencyCounts: Record<string, number> = {};
    const walletBalances: Record<string, string> = {};

    for (const escrow of escrows) {
      // Count by status
      statusCounts[escrow.status] = (statusCounts[escrow.status] || 0) + 1;

      // Count by currency
      currencyCounts[escrow.currency] = (currencyCounts[escrow.currency] || 0) + 1;

      // Get balance for funded escrows
      if (escrow.custody_wallet_address && escrow.status === "funded") {
        try {
          const balance = await provider.getBalance(escrow.custody_wallet_address);
          totalBalanceWei += balance;
          walletBalances[escrow.custody_wallet_address] = (Number(balance) / 1e18).toFixed(6);
        } catch (err) {
          console.error(`Error checking balance for ${escrow.custody_wallet_address}:`, err);
        }
      }
    }

    const totalValueInCustody = (Number(totalBalanceWei) / 1e18).toFixed(6);

    // Get audit statistics
    const auditStats = await getCustodyAuditStats();

    // Calculate additional metrics
    const fundedEscrows = statusCounts["funded"] || 0;
    const releasedEscrows = statusCounts["released"] || 0;
    const completionRate = escrows.length > 0 
      ? ((releasedEscrows / escrows.length) * 100).toFixed(2)
      : "0";

    // Calculate average escrow value
    const totalEscrowValue = escrows.reduce((sum, e) => sum + parseFloat(e.total_amount.toString()), 0);
    const averageEscrowValue = escrows.length > 0
      ? (totalEscrowValue / escrows.length).toFixed(4)
      : "0";

    // Group by creation date (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEscrows = escrows.filter(e => new Date(e.created_at) > thirtyDaysAgo);

    return NextResponse.json({
      totalEscrows: escrows.length,
      totalValueInCustody,
      currency: "ETH",
      byStatus: statusCounts,
      byCurrency: currencyCounts,
      metrics: {
        fundedEscrows,
        releasedEscrows,
        completionRate: `${completionRate}%`,
        averageEscrowValue,
        recentEscrows: recentEscrows.length,
      },
      walletBalances,
      auditStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching custody stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch custody statistics" },
      { status: 500 }
    );
  }
}

