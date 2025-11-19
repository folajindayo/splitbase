import {
  calculateEscrowCosts,
  calculateMilestones,
  validateMilestonePercentages,
  calculateTimeLockEstimate,
} from "../../lib/escrow/escrowCalculator";

describe("escrowCalculator", () => {
  describe("calculateEscrowCosts", () => {
    it("should calculate escrow costs correctly", () => {
      const result = calculateEscrowCosts(1000);
      
      expect(result.amount).toBe(1000);
      expect(result.platformFee).toBe(0);
      expect(result.gasFee).toBe(0.0005);
      expect(result.totalDeposit).toBe(1000.0005);
      expect(result.sellerReceives).toBe(1000);
      expect(result.buyerPays).toBe(1000.0005);
    });

    it("should handle different amounts", () => {
      const result = calculateEscrowCosts(5000);
      
      expect(result.amount).toBe(5000);
      expect(result.totalDeposit).toBeGreaterThan(5000);
    });
  });

  describe("calculateMilestones", () => {
    it("should calculate milestone breakdown", () => {
      const milestones = [
        { title: "Phase 1", percentage: 40 },
        { title: "Phase 2", percentage: 60 },
      ];

      const result = calculateMilestones(1000, milestones);

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(400);
      expect(result[0].cumulativeAmount).toBe(400);
      expect(result[1].amount).toBe(600);
      expect(result[1].cumulativeAmount).toBe(1000);
    });

    it("should number milestones correctly", () => {
      const milestones = [
        { title: "Phase 1", percentage: 50 },
        { title: "Phase 2", percentage: 50 },
      ];

      const result = calculateMilestones(1000, milestones);

      expect(result[0].milestoneNumber).toBe(1);
      expect(result[1].milestoneNumber).toBe(2);
    });
  });

  describe("validateMilestonePercentages", () => {
    it("should validate correct percentages", () => {
      const milestones = [
        { percentage: 40 },
        { percentage: 60 },
      ];

      const result = validateMilestonePercentages(milestones);

      expect(result.valid).toBe(true);
      expect(result.total).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it("should reject incorrect percentages", () => {
      const milestones = [
        { percentage: 40 },
        { percentage: 50 },
      ];

      const result = validateMilestonePercentages(milestones);

      expect(result.valid).toBe(false);
      expect(result.total).toBe(90);
      expect(result.error).toContain("must sum to 100%");
    });

    it("should handle over 100%", () => {
      const milestones = [
        { percentage: 60 },
        { percentage: 60 },
      ];

      const result = validateMilestonePercentages(milestones);

      expect(result.valid).toBe(false);
      expect(result.total).toBe(120);
    });
  });

  describe("calculateTimeLockEstimate", () => {
    it("should calculate time remaining for future date", () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const result = calculateTimeLockEstimate(futureDate);

      expect(result.daysRemaining).toBeGreaterThanOrEqual(6);
      expect(result.daysRemaining).toBeLessThanOrEqual(7);
      expect(result.isPast).toBe(false);
    });

    it("should detect past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      
      const result = calculateTimeLockEstimate(pastDate);

      expect(result.isPast).toBe(true);
    });
  });
});

