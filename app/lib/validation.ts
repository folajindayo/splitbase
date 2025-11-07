/**
 * Validation Utilities
 * Form validation and data validation helpers
 */

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate ENS/Basename domain
 */
export function isValidDomain(domain: string): boolean {
  if (!domain) return false;
  return /^[a-zA-Z0-9-]+\.(eth|base\.eth)$/.test(domain);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate amount (positive number with decimals)
 */
export function isValidAmount(amount: string | number): {
  valid: boolean;
  error?: string;
} {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: "Amount must be a valid number" };
  }

  if (num <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (num > 1000000) {
    return { valid: false, error: "Amount is too large" };
  }

  return { valid: true };
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(percentage: number): {
  valid: boolean;
  error?: string;
} {
  if (isNaN(percentage)) {
    return { valid: false, error: "Percentage must be a number" };
  }

  if (percentage < 0 || percentage > 100) {
    return { valid: false, error: "Percentage must be between 0 and 100" };
  }

  return { valid: true };
}

/**
 * Validate date (not in the past)
 */
export function isValidFutureDate(date: string | Date): {
  valid: boolean;
  error?: string;
} {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (dateObj < new Date()) {
    return { valid: false, error: "Date must be in the future" };
  }

  return { valid: true };
}

/**
 * Validate text length
 */
export function isValidLength(
  text: string,
  min: number,
  max: number
): {
  valid: boolean;
  error?: string;
} {
  if (!text) {
    return { valid: false, error: "Text is required" };
  }

  if (text.length < min) {
    return { valid: false, error: `Text must be at least ${min} characters` };
  }

  if (text.length > max) {
    return { valid: false, error: `Text must be no more than ${max} characters` };
  }

  return { valid: true };
}

/**
 * Validate escrow creation data
 */
export function validateEscrowData(data: {
  title: string;
  buyer_address: string;
  seller_address: string;
  total_amount: number;
  escrow_type: string;
  release_date?: string;
}): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Title
  const titleValidation = isValidLength(data.title, 3, 100);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error!;
  }

  // Buyer address
  if (!isValidAddress(data.buyer_address)) {
    errors.buyer_address = "Invalid buyer address";
  }

  // Seller address
  if (!isValidAddress(data.seller_address)) {
    errors.seller_address = "Invalid seller address";
  }

  // Check addresses are different
  if (
    data.buyer_address.toLowerCase() === data.seller_address.toLowerCase()
  ) {
    errors.seller_address = "Buyer and seller addresses must be different";
  }

  // Amount
  const amountValidation = isValidAmount(data.total_amount);
  if (!amountValidation.valid) {
    errors.total_amount = amountValidation.error!;
  }

  // Release date (for time-locked escrows)
  if (data.escrow_type === "time_locked" && data.release_date) {
    const dateValidation = isValidFutureDate(data.release_date);
    if (!dateValidation.valid) {
      errors.release_date = dateValidation.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate milestone data
 */
export function validateMilestones(
  milestones: Array<{ title: string; percentage: number }>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (milestones.length < 2) {
    errors.push("At least 2 milestones are required");
  }

  if (milestones.length > 10) {
    errors.push("Maximum 10 milestones allowed");
  }

  // Check each milestone
  milestones.forEach((milestone, index) => {
    const titleValidation = isValidLength(milestone.title, 3, 50);
    if (!titleValidation.valid) {
      errors.push(`Milestone ${index + 1}: ${titleValidation.error}`);
    }

    const percentageValidation = isValidPercentage(milestone.percentage);
    if (!percentageValidation.valid) {
      errors.push(`Milestone ${index + 1}: ${percentageValidation.error}`);
    }
  });

  // Check total percentage
  const totalPercentage = milestones.reduce(
    (sum, m) => sum + m.percentage,
    0
  );
  if (Math.abs(totalPercentage - 100) > 0.01) {
    errors.push(`Total percentage must equal 100% (currently ${totalPercentage}%)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize text input
 */
export function validateAndSanitizeText(
  text: string,
  minLength: number = 1,
  maxLength: number = 500
): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  const lengthValidation = isValidLength(text, minLength, maxLength);
  
  if (!lengthValidation.valid) {
    return {
      valid: false,
      sanitized: "",
      error: lengthValidation.error,
    };
  }

  return {
    valid: true,
    sanitized: sanitizeInput(text),
  };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: "weak" | "medium" | "strong";
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letters");
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain numbers");
  } else {
    score++;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain special characters");
  } else {
    score++;
  }

  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";

  return {
    valid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Validate phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

/**
 * Validate transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  if (!hash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate private key (without exposing it)
 */
export function isValidPrivateKey(key: string): boolean {
  if (!key) return false;
  // Remove 0x prefix if present
  const cleanKey = key.startsWith("0x") ? key.slice(2) : key;
  return cleanKey.length === 64 && /^[a-fA-F0-9]+$/.test(cleanKey);
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate array has no duplicates
 */
export function hasNoDuplicates<T>(arr: T[]): {
  valid: boolean;
  duplicates: T[];
} {
  const seen = new Set<T>();
  const duplicates: T[] = [];

  for (const item of arr) {
    if (seen.has(item)) {
      if (!duplicates.includes(item)) {
        duplicates.push(item);
      }
    } else {
      seen.add(item);
    }
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): {
  valid: boolean;
  error?: string;
} {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`,
      };
    }
  }

  return { valid: true };
}

