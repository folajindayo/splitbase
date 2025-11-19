import {
  ethereumAddressSchema,
  amountSchema,
  createEscrowSchema,
  createSplitSchema,
  depositSchema,
  paginationSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("ethereumAddressSchema", () => {
    it("validates valid Ethereum addresses", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      expect(() => ethereumAddressSchema.parse(validAddress)).not.toThrow();
    });

    it("rejects invalid addresses", () => {
      expect(() => ethereumAddressSchema.parse("invalid")).toThrow();
      expect(() => ethereumAddressSchema.parse("0x123")).toThrow();
    });
  });

  describe("amountSchema", () => {
    it("validates valid amounts", () => {
      expect(() => amountSchema.parse("100")).not.toThrow();
      expect(() => amountSchema.parse("100.50")).not.toThrow();
    });

    it("rejects invalid amounts", () => {
      expect(() => amountSchema.parse("0")).toThrow();
      expect(() => amountSchema.parse("-100")).toThrow();
      expect(() => amountSchema.parse("abc")).toThrow();
    });
  });

  describe("createEscrowSchema", () => {
    const validEscrow = {
      buyer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      seller: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
      amount: "100.50",
      description: "Test escrow",
      deadline: new Date().toISOString(),
    };

    it("validates valid escrow data", () => {
      expect(() => createEscrowSchema.parse(validEscrow)).not.toThrow();
    });

    it("rejects invalid escrow data", () => {
      const invalid = { ...validEscrow, buyer: "invalid" };
      expect(() => createEscrowSchema.parse(invalid)).toThrow();
    });
  });

  describe("createSplitSchema", () => {
    const validSplit = {
      recipients: [
        { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", percentage: 50 },
        { address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", percentage: 50 },
      ],
      name: "Test Split",
    };

    it("validates valid split data", () => {
      expect(() => createSplitSchema.parse(validSplit)).not.toThrow();
    });

    it("rejects splits with invalid percentage totals", () => {
      const invalid = {
        ...validSplit,
        recipients: [
          { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", percentage: 60 },
          { address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", percentage: 50 },
        ],
      };
      expect(() => createSplitSchema.parse(invalid)).toThrow();
    });

    it("requires at least 2 recipients", () => {
      const invalid = {
        ...validSplit,
        recipients: [
          { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", percentage: 100 },
        ],
      };
      expect(() => createSplitSchema.parse(invalid)).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("uses defaults", () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("validates custom values", () => {
      const result = paginationSchema.parse({ page: 2, limit: 50 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it("rejects invalid pagination", () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow();
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
    });
  });
});

