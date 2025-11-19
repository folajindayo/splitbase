/**
 * Escrow Recommendation Engine
 * Provide smart suggestions and insights for escrows
 */

import type { Escrow } from "./escrow";

export interface Recommendation {
  type: "warning" | "tip" | "suggestion" | "insight";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: {
    label: string;
    url?: string;
  };
}

/**
 * Analyze escrow and provide recommendations
 */
export function analyzeEscrow(escrow: Escrow): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Amount-based recommendations
  if (escrow.total_amount > 5) {
    recommendations.push({
      type: "tip",
      title: "Large Amount Detected",
      description: "Consider using milestone-based escrow for better risk management with larger amounts.",
      priority: "medium",
      action: {
        label: "Learn More",
        url: "/docs/milestone-escrow",
      },
    });
  }

  if (escrow.total_amount < 0.01) {
    recommendations.push({
      type: "warning",
      title: "Very Small Amount",
      description: "Gas fees may exceed the escrow amount. Consider increasing the amount or batching transactions.",
      priority: "high",
    });
  }

  // Type-based recommendations
  if (escrow.escrow_type === "simple" && escrow.total_amount > 1) {
    recommendations.push({
      type: "suggestion",
      title: "Consider Milestones",
      description: "For projects over 1 ETH, milestone-based payments can reduce risk for both parties.",
      priority: "medium",
    });
  }

  if (escrow.escrow_type === "time_locked" && !escrow.release_date) {
    recommendations.push({
      type: "warning",
      title: "Missing Release Date",
      description: "Time-locked escrows require a release date. Please set one to enable auto-release.",
      priority: "high",
    });
  }

  // Status-based recommendations
  if (escrow.status === "pending") {
    const createdDate = new Date(escrow.created_at);
    const daysPending = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysPending > 7) {
      recommendations.push({
        type: "warning",
        title: "Long Pending Time",
        description: `This escrow has been pending for ${daysPending} days. Consider following up with the buyer.`,
        priority: "high",
      });
    }

    if (daysPending > 3) {
      recommendations.push({
        type: "tip",
        title: "Send Reminder",
        description: "You can share the escrow link with the buyer to speed up funding.",
        priority: "medium",
        action: {
          label: "Copy Link",
        },
      });
    }
  }

  if (escrow.status === "funded") {
    const fundedDate = escrow.funded_at ? new Date(escrow.funded_at) : null;
    if (fundedDate) {
      const daysFunded = Math.floor(
        (Date.now() - fundedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysFunded > 30) {
        recommendations.push({
          type: "warning",
          title: "Funds Held for Long Time",
          description: `Funds have been in escrow for ${daysFunded} days. Consider releasing or opening a dispute.`,
          priority: "high",
        });
      }
    }
  }

  // Dispute recommendations
  if (escrow.status === "disputed") {
    recommendations.push({
      type: "insight",
      title: "Dispute Resolution",
      description: "Try to resolve the dispute directly with the other party before escalating.",
      priority: "high",
      action: {
        label: "Resolution Guide",
        url: "/docs/dispute-resolution",
      },
    });
  }

  // Auto-release recommendations
  if (escrow.escrow_type === "time_locked" && escrow.release_date) {
    const releaseDate = new Date(escrow.release_date);
    const daysUntilRelease = Math.floor(
      (releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilRelease <= 3 && daysUntilRelease > 0) {
      recommendations.push({
        type: "tip",
        title: "Auto-Release Soon",
        description: `Funds will be auto-released in ${daysUntilRelease} day${
          daysUntilRelease !== 1 ? "s" : ""
        }. Review the work before the deadline.`,
        priority: "medium",
      });
    }
  }

  // General tips
  if (escrow.status === "pending") {
    recommendations.push({
      type: "tip",
      title: "Escrow Best Practices",
      description: "Clearly communicate deliverables and timelines with the other party before funding.",
      priority: "low",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });
}

/**
 * Compare two escrows and provide insights
 */
export function compareEscrows(escrow1: Escrow, escrow2: Escrow): {
  similarities: string[];
  differences: string[];
  recommendation: string;
} {
  const similarities: string[] = [];
  const differences: string[] = [];

  // Compare type
  if (escrow1.escrow_type === escrow2.escrow_type) {
    similarities.push(`Both are ${escrow1.escrow_type} escrows`);
  } else {
    differences.push(
      `Different types: ${escrow1.escrow_type} vs ${escrow2.escrow_type}`
    );
  }

  // Compare amount
  const amountDiff = Math.abs(escrow1.total_amount - escrow2.total_amount);
  if (amountDiff < 0.1) {
    similarities.push("Similar amounts");
  } else {
    differences.push(
      `Different amounts: ${escrow1.total_amount} vs ${escrow2.total_amount} ETH`
    );
  }

  // Compare status
  if (escrow1.status === escrow2.status) {
    similarities.push(`Both have ${escrow1.status} status`);
  } else {
    differences.push(`Different status: ${escrow1.status} vs ${escrow2.status}`);
  }

  // Generate recommendation
  let recommendation = "These escrows have ";
  if (similarities.length > differences.length) {
    recommendation += "many similarities and could be managed similarly.";
  } else if (differences.length > similarities.length) {
    recommendation += "significant differences and require different handling.";
  } else {
    recommendation += "both similarities and differences to consider.";
  }

  return { similarities, differences, recommendation };
}

/**
 * Get optimal escrow type suggestion
 */
export function suggestEscrowType(params: {
  amount: number;
  projectDuration: number; // days
  trustLevel: "high" | "medium" | "low";
  complexity: "simple" | "moderate" | "complex";
}): {
  recommendedType: "simple" | "time_locked" | "milestone";
  reason: string;
  confidence: number; // 0-100
} {
  let score = {
    simple: 0,
    time_locked: 0,
    milestone: 0,
  };

  // Amount-based scoring
  if (params.amount < 0.5) {
    score.simple += 30;
    score.time_locked += 20;
    score.milestone += 10;
  } else if (params.amount < 2) {
    score.simple += 20;
    score.time_locked += 30;
    score.milestone += 20;
  } else {
    score.simple += 10;
    score.time_locked += 20;
    score.milestone += 40;
  }

  // Duration-based scoring
  if (params.projectDuration < 7) {
    score.simple += 30;
    score.time_locked += 20;
    score.milestone += 10;
  } else if (params.projectDuration < 30) {
    score.simple += 20;
    score.time_locked += 30;
    score.milestone += 20;
  } else {
    score.simple += 10;
    score.time_locked += 15;
    score.milestone += 40;
  }

  // Trust-based scoring
  if (params.trustLevel === "high") {
    score.simple += 30;
    score.time_locked += 20;
    score.milestone += 10;
  } else if (params.trustLevel === "medium") {
    score.simple += 20;
    score.time_locked += 30;
    score.milestone += 25;
  } else {
    score.simple += 10;
    score.time_locked += 20;
    score.milestone += 40;
  }

  // Complexity-based scoring
  if (params.complexity === "simple") {
    score.simple += 30;
    score.time_locked += 20;
    score.milestone += 10;
  } else if (params.complexity === "moderate") {
    score.simple += 15;
    score.time_locked += 25;
    score.milestone += 30;
  } else {
    score.simple += 5;
    score.time_locked += 15;
    score.milestone += 45;
  }

  // Find highest score
  const maxScore = Math.max(score.simple, score.time_locked, score.milestone);
  const recommendedType = (
    Object.entries(score).find(([, s]) => s === maxScore)?.[0] || "simple"
  ) as "simple" | "time_locked" | "milestone";

  // Generate reason
  let reason = "";
  if (recommendedType === "simple") {
    reason = "Simple escrow is best for straightforward, short-term projects with trusted parties.";
  } else if (recommendedType === "time_locked") {
    reason = "Time-locked escrow provides automatic release and works well for medium-term projects.";
  } else {
    reason = "Milestone-based escrow offers the best protection for complex or high-value projects.";
  }

  // Calculate confidence (normalized)
  const totalScore = score.simple + score.time_locked + score.milestone;
  const confidence = Math.round((maxScore / totalScore) * 100);

  return { recommendedType, reason, confidence };
}

/**
 * Calculate risk score for an escrow
 */
export function calculateRiskScore(escrow: Escrow): {
  score: number; // 0-100, higher is riskier
  level: "low" | "medium" | "high";
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Amount risk
  if (escrow.total_amount > 10) {
    score += 30;
    factors.push("Very large amount");
  } else if (escrow.total_amount > 5) {
    score += 20;
    factors.push("Large amount");
  }

  // Type risk
  if (escrow.escrow_type === "simple" && escrow.total_amount > 2) {
    score += 15;
    factors.push("Simple escrow with large amount");
  }

  // Status risk
  if (escrow.status === "disputed") {
    score += 40;
    factors.push("Active dispute");
  }

  // Time risk
  const createdDate = new Date(escrow.created_at);
  const daysSinceCreation = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (escrow.status === "pending" && daysSinceCreation > 14) {
    score += 25;
    factors.push("Long pending period");
  }

  if (escrow.status === "funded" && escrow.funded_at) {
    const fundedDate = new Date(escrow.funded_at);
    const daysFunded = Math.floor(
      (Date.now() - fundedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysFunded > 60) {
      score += 30;
      factors.push("Funds held for extended period");
    }
  }

  // Determine level
  let level: "low" | "medium" | "high";
  if (score < 30) {
    level = "low";
  } else if (score < 60) {
    level = "medium";
  } else {
    level = "high";
  }

  return { score: Math.min(score, 100), level, factors };
}

