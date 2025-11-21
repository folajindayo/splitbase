/**
 * Amount Validator
 */

export function validateAmount(amount: string): {
  isValid: boolean;
  error?: string;
} {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }
  
  const parsed = parseFloat(amount);
  
  if (isNaN(parsed)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (parsed <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  return { isValid: true };
}

export function validateSharePercentage(percentage: number): {
  isValid: boolean;
  error?: string;
} {
  if (percentage < 0 || percentage > 100) {
    return { isValid: false, error: 'Share must be between 0 and 100%' };
  }
  
  return { isValid: true };
}

