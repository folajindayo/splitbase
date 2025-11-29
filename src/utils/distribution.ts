/**
 * Distribution Utilities
 * Calculate and validate payment distributions
 */

export interface Recipient {
  address: string;
  name?: string;
  share: number;
  isPercentage: boolean;
}

export interface DistributionResult {
  recipient: Recipient;
  amount: number;
  percentage: number;
}

export interface DistributionSummary {
  totalAmount: number;
  totalRecipients: number;
  distributions: DistributionResult[];
  remainingAmount: number;
  isBalanced: boolean;
}

/**
 * Calculate distributions for a given amount
 */
export function calculateDistributions(
  totalAmount: number,
  recipients: Recipient[],
  precision: number = 6
): DistributionSummary {
  if (recipients.length === 0) {
    return {
      totalAmount,
      totalRecipients: 0,
      distributions: [],
      remainingAmount: totalAmount,
      isBalanced: false,
    };
  }

  const distributions: DistributionResult[] = [];
  let distributed = 0;
  let totalPercentage = 0;

  // Calculate fixed amounts first
  const fixedRecipients = recipients.filter(r => !r.isPercentage);
  const percentageRecipients = recipients.filter(r => r.isPercentage);

  // Calculate total percentage
  const totalSharePercentage = percentageRecipients.reduce((sum, r) => sum + r.share, 0);

  // Distribute fixed amounts
  for (const recipient of fixedRecipients) {
    const amount = roundToPrecision(recipient.share, precision);
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    
    distributions.push({
      recipient,
      amount,
      percentage,
    });
    
    distributed += amount;
    totalPercentage += percentage;
  }

  // Distribute percentage shares of remaining amount
  const remainingForPercentage = totalAmount - distributed;

  for (const recipient of percentageRecipients) {
    const normalizedShare = totalSharePercentage > 0 
      ? recipient.share / totalSharePercentage 
      : 0;
    
    const amount = roundToPrecision(remainingForPercentage * normalizedShare, precision);
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    
    distributions.push({
      recipient,
      amount,
      percentage,
    });
    
    distributed += amount;
    totalPercentage += percentage;
  }

  // Handle rounding remainder
  const remainder = roundToPrecision(totalAmount - distributed, precision);

  return {
    totalAmount,
    totalRecipients: recipients.length,
    distributions,
    remainingAmount: remainder,
    isBalanced: Math.abs(remainder) < Math.pow(10, -precision),
  };
}

/**
 * Validate distribution configuration
 */
export function validateDistribution(recipients: Recipient[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (recipients.length === 0) {
    errors.push('At least one recipient is required');
    return { valid: false, errors };
  }

  // Check for duplicate addresses
  const addresses = recipients.map(r => r.address.toLowerCase());
  const uniqueAddresses = new Set(addresses);
  if (uniqueAddresses.size !== addresses.length) {
    errors.push('Duplicate recipient addresses found');
  }

  // Check for invalid addresses
  for (const recipient of recipients) {
    if (!isValidAddress(recipient.address)) {
      errors.push(`Invalid address: ${recipient.address}`);
    }
  }

  // Check for negative shares
  for (const recipient of recipients) {
    if (recipient.share < 0) {
      errors.push(`Negative share for ${recipient.name || recipient.address}`);
    }
  }

  // Check total percentage
  const percentageRecipients = recipients.filter(r => r.isPercentage);
  const totalPercentage = percentageRecipients.reduce((sum, r) => sum + r.share, 0);
  
  if (totalPercentage > 100) {
    errors.push(`Total percentage (${totalPercentage}%) exceeds 100%`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize shares to percentages
 */
export function normalizeToPercentages(recipients: Recipient[]): Recipient[] {
  const totalShare = recipients.reduce((sum, r) => sum + r.share, 0);
  
  if (totalShare === 0) {
    return recipients.map(r => ({ ...r, share: 0, isPercentage: true }));
  }

  return recipients.map(r => ({
    ...r,
    share: (r.share / totalShare) * 100,
    isPercentage: true,
  }));
}

/**
 * Rebalance shares to sum to 100%
 */
export function rebalanceShares(recipients: Recipient[]): Recipient[] {
  const percentageRecipients = recipients.filter(r => r.isPercentage);
  const fixedRecipients = recipients.filter(r => !r.isPercentage);

  if (percentageRecipients.length === 0) {
    return recipients;
  }

  const currentTotal = percentageRecipients.reduce((sum, r) => sum + r.share, 0);
  
  if (currentTotal === 0) {
    // Distribute equally
    const equalShare = 100 / percentageRecipients.length;
    return [
      ...fixedRecipients,
      ...percentageRecipients.map(r => ({ ...r, share: equalShare })),
    ];
  }

  const scaleFactor = 100 / currentTotal;
  
  return [
    ...fixedRecipients,
    ...percentageRecipients.map(r => ({
      ...r,
      share: roundToPrecision(r.share * scaleFactor, 4),
    })),
  ];
}

/**
 * Calculate equal distribution
 */
export function equalDistribution(
  addresses: string[],
  totalAmount: number
): DistributionSummary {
  const share = 100 / addresses.length;
  const recipients: Recipient[] = addresses.map(address => ({
    address,
    share,
    isPercentage: true,
  }));

  return calculateDistributions(totalAmount, recipients);
}

/**
 * Adjust share for a recipient
 */
export function adjustRecipientShare(
  recipients: Recipient[],
  recipientIndex: number,
  newShare: number,
  rebalanceOthers: boolean = true
): Recipient[] {
  if (recipientIndex < 0 || recipientIndex >= recipients.length) {
    return recipients;
  }

  const updated = [...recipients];
  const oldShare = updated[recipientIndex].share;
  updated[recipientIndex] = { ...updated[recipientIndex], share: newShare };

  if (!rebalanceOthers || !updated[recipientIndex].isPercentage) {
    return updated;
  }

  // Rebalance other percentage recipients
  const shareDiff = newShare - oldShare;
  const otherPercentageRecipients = updated.filter(
    (r, i) => i !== recipientIndex && r.isPercentage
  );
  const otherTotalShare = otherPercentageRecipients.reduce((sum, r) => sum + r.share, 0);

  if (otherTotalShare > 0) {
    const adjustment = shareDiff / otherPercentageRecipients.length;
    
    return updated.map((r, i) => {
      if (i === recipientIndex || !r.isPercentage) {
        return r;
      }
      const adjustedShare = Math.max(0, r.share - adjustment);
      return { ...r, share: roundToPrecision(adjustedShare, 4) };
    });
  }

  return updated;
}

/**
 * Merge recipients with same address
 */
export function mergeRecipients(recipients: Recipient[]): Recipient[] {
  const merged = new Map<string, Recipient>();

  for (const recipient of recipients) {
    const key = recipient.address.toLowerCase();
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        share: existing.share + recipient.share,
        name: existing.name || recipient.name,
      });
    } else {
      merged.set(key, { ...recipient });
    }
  }

  return Array.from(merged.values());
}

/**
 * Sort recipients by share
 */
export function sortByShare(recipients: Recipient[], ascending: boolean = false): Recipient[] {
  return [...recipients].sort((a, b) => 
    ascending ? a.share - b.share : b.share - a.share
  );
}

/**
 * Round to specified precision
 */
function roundToPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Basic address validation
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate minimum viable distribution
 */
export function calculateMinimumAmount(
  recipients: Recipient[],
  minPerRecipient: number
): number {
  const percentageRecipients = recipients.filter(r => r.isPercentage);
  const fixedRecipients = recipients.filter(r => !r.isPercentage);

  const fixedTotal = fixedRecipients.reduce((sum, r) => sum + r.share, 0);
  
  if (percentageRecipients.length === 0) {
    return fixedTotal;
  }

  const minSharePercentage = Math.min(...percentageRecipients.map(r => r.share));
  const minPercentageTotal = (minPerRecipient / minSharePercentage) * 100;

  return Math.max(fixedTotal + minPercentageTotal, fixedTotal + minPerRecipient * percentageRecipients.length);
}

