import { escrowService } from "@/services/escrowService";

describe("EscrowService", () => {
  describe("getEscrow", () => {
    it("returns escrow data", async () => {
      const escrow = await escrowService.getEscrow("test-id");

      expect(escrow).toBeDefined();
      expect(escrow?.id).toBe("test-id");
      expect(escrow?.buyer).toBeDefined();
      expect(escrow?.seller).toBeDefined();
    });
  });

  describe("getEscrowsByUser", () => {
    it("returns list of escrows for user", async () => {
      const escrows = await escrowService.getEscrowsByUser("0x1234");

      expect(Array.isArray(escrows)).toBe(true);
      expect(escrows.length).toBeGreaterThan(0);
    });
  });

  describe("createEscrow", () => {
    it("creates new escrow", async () => {
      const escrow = await escrowService.createEscrow(
        "0xbuyer",
        "0xseller",
        "1.5 ETH"
      );

      expect(escrow.id).toBeDefined();
      expect(escrow.buyer).toBe("0xbuyer");
      expect(escrow.seller).toBe("0xseller");
      expect(escrow.amount).toBe("1.5 ETH");
      expect(escrow.status).toBe("pending");
    });
  });

  describe("releaseEscrow", () => {
    it("releases escrow funds", async () => {
      const result = await escrowService.releaseEscrow("test-id");

      expect(result).toBe(true);
    });
  });

  describe("refundEscrow", () => {
    it("refunds escrow funds", async () => {
      const result = await escrowService.refundEscrow("test-id");

      expect(result).toBe(true);
    });
  });
});

