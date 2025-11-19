import { EscrowData } from "@/services/escrowService";
import { SplitData } from "@/services/splitService";

export interface ExportOptions {
  format: "json" | "csv";
  includeTimestamps?: boolean;
  prettify?: boolean;
}

export class DataExporter {
  exportEscrows(escrows: EscrowData[], options: ExportOptions = { format: "json" }): string {
    if (options.format === "csv") {
      return this.escrowsToCSV(escrows);
    }

    return options.prettify
      ? JSON.stringify(escrows, null, 2)
      : JSON.stringify(escrows);
  }

  exportSplits(splits: SplitData[], options: ExportOptions = { format: "json" }): string {
    if (options.format === "csv") {
      return this.splitsToCSV(splits);
    }

    return options.prettify
      ? JSON.stringify(splits, null, 2)
      : JSON.stringify(splits);
  }

  private escrowsToCSV(escrows: EscrowData[]): string {
    if (escrows.length === 0) return "";

    const headers = ["ID", "Buyer", "Seller", "Amount", "Status", "Created At", "Updated At"];
    const rows = escrows.map((e) => [
      e.id,
      e.buyer,
      e.seller,
      e.amount,
      e.status,
      e.createdAt,
      e.updatedAt,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  }

  private splitsToCSV(splits: SplitData[]): string {
    if (splits.length === 0) return "";

    const headers = ["ID", "Owner", "Recipients Count", "Total Distributed", "Active", "Created At"];
    const rows = splits.map((s) => [
      s.id,
      s.owner,
      s.recipients.length.toString(),
      s.totalDistributed,
      s.isActive.toString(),
      s.createdAt,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  }

  generateFileName(type: "escrows" | "splits", format: "json" | "csv"): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${type}_export_${timestamp}.${format}`;
  }
}

export const dataExporter = new DataExporter();
