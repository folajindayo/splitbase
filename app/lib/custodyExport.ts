import { CustodyAuditLog, formatActionType } from "./custodyAudit";

/**
 * Export custody audit logs to CSV
 */
export function exportCustodyAuditLogsToCSV(
  logs: CustodyAuditLog[],
  filename: string = "custody_audit_logs.csv"
): void {
  if (logs.length === 0) {
    alert("No audit logs to export");
    return;
  }

  // Define CSV headers
  const headers = [
    "Timestamp",
    "Escrow ID",
    "Action Type",
    "Actor Address",
    "Custody Address",
    "Amount",
    "Transaction Hash",
    "IP Address",
    "User Agent",
  ];

  // Convert logs to CSV rows
  const rows = logs.map((log) => [
    log.created_at || "",
    log.escrow_id,
    formatActionType(log.action_type),
    log.actor_address || "",
    log.custody_address,
    log.amount || "",
    log.transaction_hash || "",
    log.ip_address || "",
    log.user_agent || "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export custody statistics to JSON
 */
export function exportCustodyStatsToJSON(
  stats: any,
  filename: string = "custody_stats.json"
): void {
  if (!stats) {
    alert("No statistics to export");
    return;
  }

  const jsonContent = JSON.stringify(stats, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export custody wallet details to CSV
 */
export function exportCustodyWalletsToCSV(
  wallets: Array<{
    escrow_id: string;
    escrow_title: string;
    custody_address: string;
    status: string;
    total_amount: string;
    currency: string;
    balance: string;
    created_at: string;
  }>,
  filename: string = "custody_wallets.csv"
): void {
  if (wallets.length === 0) {
    alert("No custody wallets to export");
    return;
  }

  // Define CSV headers
  const headers = [
    "Escrow ID",
    "Escrow Title",
    "Custody Address",
    "Status",
    "Total Amount",
    "Currency",
    "Current Balance",
    "Created At",
  ];

  // Convert wallets to CSV rows
  const rows = wallets.map((wallet) => [
    wallet.escrow_id,
    wallet.escrow_title,
    wallet.custody_address,
    wallet.status,
    wallet.total_amount,
    wallet.currency,
    wallet.balance,
    wallet.created_at,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format timestamp for export
 */
export function formatTimestampForExport(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toISOString();
  } catch {
    return timestamp;
  }
}

/**
 * Generate audit report text
 */
export function generateAuditReportText(
  logs: CustodyAuditLog[],
  stats?: any
): string {
  let report = "CUSTODY AUDIT REPORT\n";
  report += "=".repeat(80) + "\n\n";
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Audit Entries: ${logs.length}\n\n`;

  if (stats) {
    report += "STATISTICS\n";
    report += "-".repeat(80) + "\n";
    report += `Total Operations: ${stats.totalOperations}\n`;
    report += `Wallet Creations: ${stats.walletCreations}\n`;
    report += `Balance Checks: ${stats.balanceChecks}\n`;
    report += `Funds Released: ${stats.fundsReleased}\n`;
    report += `Funds Refunded: ${stats.fundsRefunded}\n`;
    report += `Milestones Released: ${stats.milestonesReleased}\n`;
    report += `Auto-Funded: ${stats.autoFunded}\n`;
    report += `Total Amount Released: ${stats.totalAmountReleased.toFixed(6)} ETH\n`;
    report += `Total Amount Refunded: ${stats.totalAmountRefunded.toFixed(6)} ETH\n\n`;
  }

  report += "AUDIT LOG ENTRIES\n";
  report += "-".repeat(80) + "\n\n";

  logs.forEach((log, index) => {
    report += `${index + 1}. ${formatActionType(log.action_type)}\n`;
    report += `   Time: ${log.created_at}\n`;
    report += `   Escrow: ${log.escrow_id}\n`;
    report += `   Custody Address: ${log.custody_address}\n`;
    if (log.actor_address) {
      report += `   Actor: ${log.actor_address}\n`;
    }
    if (log.amount) {
      report += `   Amount: ${log.amount} ETH\n`;
    }
    if (log.transaction_hash) {
      report += `   TX Hash: ${log.transaction_hash}\n`;
    }
    report += "\n";
  });

  report += "=".repeat(80) + "\n";
  report += "END OF REPORT\n";

  return report;
}

/**
 * Export audit report as text file
 */
export function exportAuditReportText(
  logs: CustodyAuditLog[],
  stats?: any,
  filename: string = "custody_audit_report.txt"
): void {
  const report = generateAuditReportText(logs, stats);
  const blob = new Blob([report], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

