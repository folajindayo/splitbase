import { dataExporter } from "@/lib/export";
import { EscrowData } from "@/services/escrowService";
import { SplitData } from "@/services/splitService";

describe("Data Exporter", () => {
  const mockEscrows: EscrowData[] = [
    {
      id: "escrow-1",
      buyer: "0xbuyer1",
      seller: "0xseller1",
      amount: "1.5 ETH",
      status: "funded",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "escrow-2",
      buyer: "0xbuyer2",
      seller: "0xseller2",
      amount: "2.0 ETH",
      status: "pending",
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
    },
  ];

  const mockSplits: SplitData[] = [
    {
      id: "split-1",
      owner: "0xowner1",
      recipients: [
        { address: "0xrec1", percentage: 50 },
        { address: "0xrec2", percentage: 50 },
      ],
      totalDistributed: "10 ETH",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
  ];

  describe("exportEscrows", () => {
    it("exports to JSON format", () => {
      const result = dataExporter.exportEscrows(mockEscrows, { format: "json" });

      expect(result).toContain("escrow-1");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("exports to CSV format", () => {
      const result = dataExporter.exportEscrows(mockEscrows, { format: "csv" });

      expect(result).toContain("ID,Buyer,Seller");
      expect(result).toContain("escrow-1");
      expect(result.split("\n").length).toBeGreaterThan(1);
    });

    it("prettifies JSON when requested", () => {
      const result = dataExporter.exportEscrows(mockEscrows, {
        format: "json",
        prettify: true,
      });

      expect(result).toContain("\n");
      expect(result).toContain("  ");
    });
  });

  describe("exportSplits", () => {
    it("exports to JSON format", () => {
      const result = dataExporter.exportSplits(mockSplits, { format: "json" });

      expect(result).toContain("split-1");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("exports to CSV format", () => {
      const result = dataExporter.exportSplits(mockSplits, { format: "csv" });

      expect(result).toContain("ID,Owner");
      expect(result).toContain("split-1");
    });
  });

  describe("generateFileName", () => {
    it("generates filename with timestamp", () => {
      const fileName = dataExporter.generateFileName("escrows", "json");

      expect(fileName).toMatch(/escrows_export_\d{4}-\d{2}-\d{2}/);
      expect(fileName).toEndWith(".json");
    });

    it("generates CSV filename", () => {
      const fileName = dataExporter.generateFileName("splits", "csv");

      expect(fileName).toEndWith(".csv");
    });
  });
});

