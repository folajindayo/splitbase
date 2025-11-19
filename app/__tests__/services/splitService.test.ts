import { splitService, SplitRecipient } from "@/services/splitService";

describe("SplitService", () => {
  describe("getSplit", () => {
    it("returns split data", async () => {
      const split = await splitService.getSplit("test-id");

      expect(split).toBeDefined();
      expect(split?.id).toBe("test-id");
      expect(split?.owner).toBeDefined();
      expect(split?.recipients).toBeDefined();
    });
  });

  describe("getSplitsByOwner", () => {
    it("returns list of splits for owner", async () => {
      const splits = await splitService.getSplitsByOwner("0x1234");

      expect(Array.isArray(splits)).toBe(true);
      expect(splits.length).toBeGreaterThan(0);
    });
  });

  describe("createSplit", () => {
    it("creates new split with valid percentages", async () => {
      const recipients: SplitRecipient[] = [
        { address: "0xaaaa", percentage: 50 },
        { address: "0xbbbb", percentage: 50 },
      ];

      const split = await splitService.createSplit("0xowner", recipients);

      expect(split.id).toBeDefined();
      expect(split.owner).toBe("0xowner");
      expect(split.recipients).toEqual(recipients);
      expect(split.isActive).toBe(true);
    });

    it("throws error if percentages dont sum to 100", async () => {
      const recipients: SplitRecipient[] = [
        { address: "0xaaaa", percentage: 50 },
        { address: "0xbbbb", percentage: 30 },
      ];

      await expect(
        splitService.createSplit("0xowner", recipients)
      ).rejects.toThrow("Recipient percentages must sum to 100");
    });
  });

  describe("distributeFunds", () => {
    it("distributes funds to recipients", async () => {
      const result = await splitService.distributeFunds("test-id", "10 ETH");

      expect(result).toBe(true);
    });
  });

  describe("deactivateSplit", () => {
    it("deactivates split", async () => {
      const result = await splitService.deactivateSplit("test-id");

      expect(result).toBe(true);
    });
  });
});

