/**
 * Escrow Calculator Utilities
 * Calculate fees, estimates, and financial metrics
 */

export interface EscrowCalculation {
  amount: number;
  platformFee: number;
  gasFee: number;
  totalDeposit: number;
  sellerReceives: number;
  buyerPays: number;
}

export interface MilestoneBreakdown {
  milestoneNumber: number;
  title: string;
  percentage: number;
  amount: number;
  cumulativeAmount: number;
}

// Platform fee percentage (0 for now, configurable for future)
const PLATFORM_FEE_PERCENTAGE = 0; // 0%

// Estimated gas fee in ETH
const ESTIMATED_GAS_FEE = 0.0005; // ~$1.50 at $3000/ETH

/**
 * Calculate escrow costs and fees
 */
export function calculateEscrowCosts(amount: number): EscrowCalculation {
  const platformFee = amount * (PLATFORM_FEE_PERCENTAGE / 100);
  const gasFee = ESTIMATED_GAS_FEE;
  const totalDeposit = amount + platformFee + gasFee;
  const sellerReceives = amount - platformFee;
  const buyerPays = totalDeposit;

  return {
    amount,
    platformFee,
    gasFee,
    totalDeposit,
    sellerReceives,
    buyerPays,
  };
}

/**
 * Calculate milestone breakdown
 */
export function calculateMilestones(
  totalAmount: number,
  milestones: { title: string; percentage: number }[]
): MilestoneBreakdown[] {
  let cumulative = 0;

  return milestones.map((milestone, index) => {
    const amount = (totalAmount * milestone.percentage) / 100;
    cumulative += amount;

    return {
      milestoneNumber: index + 1,
      title: milestone.title,
      percentage: milestone.percentage,
      amount: parseFloat(amount.toFixed(6)),
      cumulativeAmount: parseFloat(cumulative.toFixed(6)),
    };
  });
}

/**
 * Validate milestone percentages sum to 100
 */
export function validateMilestonePercentages(
  milestones: { percentage: number }[]
): { valid: boolean; total: number; error?: string } {
  const total = milestones.reduce((sum, m) => sum + m.percentage, 0);

  if (total !== 100) {
    return {
      valid: false,
      total,
      error: `Milestones must sum to 100%. Current total: ${total}%`,
    };
  }

  return { valid: true, total };
}

/**
 * Calculate time-locked release estimate
 */
export function calculateTimeLockEstimate(releaseDate: Date): {
  daysRemaining: number;
  hoursRemaining: number;
  autoReleaseDate: string;
  isPast: boolean;
} {
  const now = new Date();
  const timeDiff = releaseDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
  const isPast = timeDiff < 0;

  return {
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining: Math.max(0, hoursRemaining),
    autoReleaseDate: releaseDate.toISOString(),
    isPast,
  };
}

/**
 * Calculate recommended escrow amount based on project details
 */
export function recommendEscrowAmount(params: {
  projectType: "web_dev" | "design" | "content" | "consulting" | "other";
  duration: "short" | "medium" | "long"; // <1 week, 1-4 weeks, >4 weeks
  complexity: "simple" | "moderate" | "complex";
}): { min: number; recommended: number; max: number } {
  const baseRates = {
    web_dev: { min: 0.3, recommended: 1.0, max: 5.0 },
    design: { min: 0.2, recommended: 0.5, max: 2.0 },
    content: { min: 0.1, recommended: 0.3, max: 1.0 },
    consulting: { min: 0.5, recommended: 1.5, max: 10.0 },
    other: { min: 0.1, recommended: 0.5, max: 3.0 },
  };

  const durationMultipliers = {
    short: 1.0,
    medium: 1.5,
    long: 2.5,
  };

  const complexityMultipliers = {
    simple: 0.8,
    moderate: 1.0,
    complex: 1.5,
  };

  const base = baseRates[params.projectType];
  const durationMult = durationMultipliers[params.duration];
  const complexityMult = complexityMultipliers[params.complexity];

  return {
    min: parseFloat((base.min * durationMult * complexityMult).toFixed(2)),
    recommended: parseFloat(
      (base.recommended * durationMult * complexityMult).toFixed(2)
    ),
    max: parseFloat((base.max * durationMult * complexityMult).toFixed(2)),
  };
}

/**
 * Calculate escrow completion percentage
 */
export function calculateCompletionPercentage(
  totalMilestones: number,
  completedMilestones: number
): number {
  if (totalMilestones === 0) return 0;
  return Math.round((completedMilestones / totalMilestones) * 100);
}

/**
 * Calculate estimated time to completion
 */
export function estimateTimeToCompletion(
  createdAt: Date,
  completedMilestones: number,
  totalMilestones: number
): { estimatedDays: number; confidence: "low" | "medium" | "high" } {
  const now = new Date();
  const daysSinceCreation = Math.ceil(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (completedMilestones === 0) {
    return { estimatedDays: 0, confidence: "low" };
  }

  const daysPerMilestone = daysSinceCreation / completedMilestones;
  const remainingMilestones = totalMilestones - completedMilestones;
  const estimatedDays = Math.ceil(daysPerMilestone * remainingMilestones);

  let confidence: "low" | "medium" | "high" = "low";
  if (completedMilestones >= 3) confidence = "high";
  else if (completedMilestones >= 2) confidence = "medium";

  return { estimatedDays, confidence };
}

/**
 * Format ETH amount for display
 */
export function formatETH(amount: number): string {
  return `${amount.toFixed(6)} ETH`;
}

/**
 * Format USD estimate (assuming ETH price)
 */
export function formatUSD(amount: number, ethPrice: number = 3000): string {
  const usd = amount * ethPrice;
  return `$${usd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate ROI for escrow (for analytics)
 */
export function calculateEscrowROI(params: {
  initialInvestment: number;
  finalValue: number;
  duration: number; // days
}): {
  roi: number; // percentage
  roiAnnualized: number;
  profitLoss: number;
} {
  const profitLoss = params.finalValue - params.initialInvestment;
  const roi = (profitLoss / params.initialInvestment) * 100;
  const roiAnnualized = (roi / params.duration) * 365;

  return {
    roi: parseFloat(roi.toFixed(2)),
    roiAnnualized: parseFloat(roiAnnualized.toFixed(2)),
    profitLoss: parseFloat(profitLoss.toFixed(6)),
  };
}

/**
 * Calculate platform statistics
 */
export function calculatePlatformMetrics(escrows: {
  total: number;
  totalValue: number;
  completed: number;
  disputed: number;
  cancelled: number;
}): {
  successRate: number;
  disputeRate: number;
  cancellationRate: number;
  averageValue: number;
} {
  const total = escrows.total || 1; // Avoid division by zero

  return {
    successRate: parseFloat(((escrows.completed / total) * 100).toFixed(2)),
    disputeRate: parseFloat(((escrows.disputed / total) * 100).toFixed(2)),
    cancellationRate: parseFloat(((escrows.cancelled / total) * 100).toFixed(2)),
    averageValue: parseFloat((escrows.totalValue / total).toFixed(6)),
  };
}

/**
 * Validate escrow amount
 */
export function validateEscrowAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (amount < 0.001) {
    return { valid: false, error: "Minimum amount is 0.001 ETH" };
  }

  if (amount > 100) {
    return {
      valid: false,
      error: "Maximum amount is 100 ETH. Contact support for larger amounts.",
    };
  }

  return { valid: true };
}

