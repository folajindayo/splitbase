/**
 * Recipient Helper Functions
 */

export function validateRecipients(recipients: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (recipients.length === 0) {
    errors.push('At least one recipient is required');
  }
  
  if (recipients.length > 100) {
    errors.push('Maximum 100 recipients allowed');
  }
  
  const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push('Recipient percentages must sum to 100%');
  }
  
  const addresses = new Set();
  recipients.forEach((r, i) => {
    if (addresses.has(r.address.toLowerCase())) {
      errors.push(`Duplicate address at position ${i + 1}`);
    }
    addresses.add(r.address.toLowerCase());
  });
  
  return { valid: errors.length === 0, errors };
}

export function optimizeRecipients(recipients: any[]): any[] {
  // Sort by percentage descending to optimize gas
  return [...recipients].sort((a, b) => b.percentage - a.percentage);
}


