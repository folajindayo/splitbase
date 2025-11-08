import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ValidationType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  URL = 'url',
  DATE = 'date',
  PHONE = 'phone',
  CREDIT_CARD = 'credit_card',
  PASSWORD = 'password',
  UUID = 'uuid',
  ARRAY = 'array',
  OBJECT = 'object',
  ENUM = 'enum',
  CUSTOM = 'custom',
}

export interface ValidationRule {
  type: ValidationType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  message?: string;
  items?: ValidationRule; // For arrays
  properties?: Record<string, ValidationRule>; // For objects
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  sanitized?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  type: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface SanitizationOptions {
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
  escape?: boolean;
  stripHtml?: boolean;
  removeWhitespace?: boolean;
}

class ValidationSystem {
  private static instance: ValidationSystem;

  // Regex patterns
  private readonly patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    creditCard: /^\d{13,19}$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alpha: /^[a-zA-Z]+$/,
    numeric: /^\d+$/,
  };

  private constructor() {}

  static getInstance(): ValidationSystem {
    if (!ValidationSystem.instance) {
      ValidationSystem.instance = new ValidationSystem();
    }
    return ValidationSystem.instance;
  }

  // Validate data
  validate(
    data: Record<string, any>,
    schema: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const sanitized: Record<string, any> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rule.message || `${field} is required`,
          type: 'required',
        });
        continue;
      }

      // Skip validation if not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Validate by type
      const typeValidation = this.validateType(field, value, rule);
      if (!typeValidation.valid) {
        errors.push(...typeValidation.errors);
      } else {
        sanitized[field] = typeValidation.sanitized ?? value;
      }

      if (typeValidation.warnings) {
        warnings.push(...typeValidation.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitized,
    };
  }

  // Validate type
  private validateType(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let sanitized = value;

    switch (rule.type) {
      case ValidationType.STRING:
        const stringResult = this.validateString(field, value, rule);
        if (!stringResult.valid) errors.push(...stringResult.errors);
        sanitized = stringResult.sanitized;
        break;

      case ValidationType.NUMBER:
        const numberResult = this.validateNumber(field, value, rule);
        if (!numberResult.valid) errors.push(...numberResult.errors);
        sanitized = numberResult.sanitized;
        break;

      case ValidationType.BOOLEAN:
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: rule.message || `${field} must be a boolean`,
            type: 'type',
            value,
          });
        }
        break;

      case ValidationType.EMAIL:
        const emailResult = this.validateEmail(field, value, rule);
        if (!emailResult.valid) errors.push(...emailResult.errors);
        sanitized = emailResult.sanitized;
        break;

      case ValidationType.URL:
        if (!this.patterns.url.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid URL`,
            type: 'format',
            value,
          });
        }
        break;

      case ValidationType.DATE:
        const dateResult = this.validateDate(field, value, rule);
        if (!dateResult.valid) errors.push(...dateResult.errors);
        sanitized = dateResult.sanitized;
        break;

      case ValidationType.PHONE:
        if (!this.patterns.phone.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid phone number`,
            type: 'format',
            value,
          });
        }
        sanitized = this.sanitizePhone(value);
        break;

      case ValidationType.CREDIT_CARD:
        const ccResult = this.validateCreditCard(field, value, rule);
        if (!ccResult.valid) errors.push(...ccResult.errors);
        break;

      case ValidationType.PASSWORD:
        const pwdResult = this.validatePassword(field, value, rule);
        if (!pwdResult.valid) errors.push(...pwdResult.errors);
        if (pwdResult.warnings) warnings.push(...pwdResult.warnings);
        break;

      case ValidationType.UUID:
        if (!this.patterns.uuid.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid UUID`,
            type: 'format',
            value,
          });
        }
        break;

      case ValidationType.ARRAY:
        const arrayResult = this.validateArray(field, value, rule);
        if (!arrayResult.valid) errors.push(...arrayResult.errors);
        sanitized = arrayResult.sanitized;
        break;

      case ValidationType.OBJECT:
        const objectResult = this.validateObject(field, value, rule);
        if (!objectResult.valid) errors.push(...objectResult.errors);
        sanitized = objectResult.sanitized;
        break;

      case ValidationType.ENUM:
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({
            field,
            message:
              rule.message || `${field} must be one of: ${rule.enum.join(', ')}`,
            type: 'enum',
            value,
          });
        }
        break;

      case ValidationType.CUSTOM:
        if (rule.custom) {
          const result = rule.custom(value);
          if (result !== true) {
            errors.push({
              field,
              message: typeof result === 'string' ? result : rule.message || `${field} validation failed`,
              type: 'custom',
              value,
            });
          }
        }
        break;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push({
        field,
        message: rule.message || `${field} format is invalid`,
        type: 'pattern',
        value,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      sanitized,
    };
  }

  // Validate string
  private validateString(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof value !== 'string') {
      errors.push({
        field,
        message: rule.message || `${field} must be a string`,
        type: 'type',
        value,
      });
      return { valid: false, errors };
    }

    const sanitized = value.trim();

    if (rule.minLength && sanitized.length < rule.minLength) {
      errors.push({
        field,
        message: rule.message || `${field} must be at least ${rule.minLength} characters`,
        type: 'minLength',
        value,
      });
    }

    if (rule.maxLength && sanitized.length > rule.maxLength) {
      errors.push({
        field,
        message: rule.message || `${field} must be at most ${rule.maxLength} characters`,
        type: 'maxLength',
        value,
      });
    }

    return { valid: errors.length === 0, errors, sanitized };
  }

  // Validate number
  private validateNumber(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (typeof num !== 'number' || isNaN(num)) {
      errors.push({
        field,
        message: rule.message || `${field} must be a number`,
        type: 'type',
        value,
      });
      return { valid: false, errors };
    }

    if (rule.min !== undefined && num < rule.min) {
      errors.push({
        field,
        message: rule.message || `${field} must be at least ${rule.min}`,
        type: 'min',
        value,
      });
    }

    if (rule.max !== undefined && num > rule.max) {
      errors.push({
        field,
        message: rule.message || `${field} must be at most ${rule.max}`,
        type: 'max',
        value,
      });
    }

    return { valid: errors.length === 0, errors, sanitized: num };
  }

  // Validate email
  private validateEmail(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.patterns.email.test(value)) {
      errors.push({
        field,
        message: rule.message || `${field} must be a valid email`,
        type: 'format',
        value,
      });
    }

    const sanitized = value.toLowerCase().trim();

    return { valid: errors.length === 0, errors, sanitized };
  }

  // Validate date
  private validateDate(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      errors.push({
        field,
        message: rule.message || `${field} must be a valid date`,
        type: 'format',
        value,
      });
      return { valid: false, errors };
    }

    const sanitized = date.toISOString();

    return { valid: true, errors, sanitized };
  }

  // Validate credit card
  private validateCreditCard(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const sanitized = String(value).replace(/\s|-/g, '');

    if (!this.patterns.creditCard.test(sanitized)) {
      errors.push({
        field,
        message: rule.message || `${field} must be a valid credit card number`,
        type: 'format',
        value,
      });
      return { valid: false, errors };
    }

    // Luhn algorithm
    if (!this.luhnCheck(sanitized)) {
      errors.push({
        field,
        message: rule.message || `${field} credit card number is invalid`,
        type: 'checksum',
        value,
      });
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate password
  private validatePassword(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (typeof value !== 'string') {
      errors.push({
        field,
        message: rule.message || `${field} must be a string`,
        type: 'type',
        value,
      });
      return { valid: false, errors };
    }

    const minLength = rule.minLength || 8;

    if (value.length < minLength) {
      errors.push({
        field,
        message: rule.message || `${field} must be at least ${minLength} characters`,
        type: 'minLength',
        value,
      });
    }

    // Password strength checks
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      warnings.push({
        field,
        message: 'Password should contain uppercase, lowercase, number, and special characters',
        suggestion: 'Use a mix of character types for better security',
      });
    }

    // Common passwords check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(value.toLowerCase())) {
      errors.push({
        field,
        message: rule.message || `${field} is too common`,
        type: 'weak',
        value,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // Validate array
  private validateArray(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!Array.isArray(value)) {
      errors.push({
        field,
        message: rule.message || `${field} must be an array`,
        type: 'type',
        value,
      });
      return { valid: false, errors };
    }

    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push({
        field,
        message: rule.message || `${field} must have at least ${rule.minLength} items`,
        type: 'minLength',
        value,
      });
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push({
        field,
        message: rule.message || `${field} must have at most ${rule.maxLength} items`,
        type: 'maxLength',
        value,
      });
    }

    // Validate items
    const sanitized: any[] = [];
    if (rule.items) {
      value.forEach((item, index) => {
        const itemResult = this.validateType(`${field}[${index}]`, item, rule.items!);
        if (!itemResult.valid) {
          errors.push(...itemResult.errors);
        }
        sanitized.push(itemResult.sanitized ?? item);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: rule.items ? sanitized : value,
    };
  }

  // Validate object
  private validateObject(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({
        field,
        message: rule.message || `${field} must be an object`,
        type: 'type',
        value,
      });
      return { valid: false, errors };
    }

    // Validate properties
    const sanitized: Record<string, any> = {};
    if (rule.properties) {
      const propResult = this.validate(value, rule.properties);
      if (!propResult.valid) {
        propResult.errors.forEach((err) => {
          errors.push({
            ...err,
            field: `${field}.${err.field}`,
          });
        });
      }
      Object.assign(sanitized, propResult.sanitized);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: rule.properties ? sanitized : value,
    };
  }

  // Sanitize data
  sanitize(value: any, options: SanitizationOptions = {}): any {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    if (options.trim) {
      sanitized = sanitized.trim();
    }

    if (options.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    if (options.uppercase) {
      sanitized = sanitized.toUpperCase();
    }

    if (options.escape) {
      sanitized = this.escapeHtml(sanitized);
    }

    if (options.stripHtml) {
      sanitized = this.stripHtml(sanitized);
    }

    if (options.removeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, '');
    }

    return sanitized;
  }

  // Escape HTML
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  // Strip HTML
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  // Sanitize phone
  private sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  // Luhn check for credit cards
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Quick validators
  isEmail(email: string): boolean {
    return this.patterns.email.test(email);
  }

  isUrl(url: string): boolean {
    return this.patterns.url.test(url);
  }

  isPhone(phone: string): boolean {
    return this.patterns.phone.test(phone);
  }

  isUUID(uuid: string): boolean {
    return this.patterns.uuid.test(uuid);
  }

  isAlphanumeric(text: string): boolean {
    return this.patterns.alphanumeric.test(text);
  }
}

// Export singleton instance
export const validation = ValidationSystem.getInstance();

// Convenience functions
export const validate = (data: Record<string, any>, schema: Record<string, ValidationRule>) =>
  validation.validate(data, schema);

export const sanitize = (value: any, options?: SanitizationOptions) =>
  validation.sanitize(value, options);

export const isEmail = (email: string) => validation.isEmail(email);
export const isUrl = (url: string) => validation.isUrl(url);
export const isPhone = (phone: string) => validation.isPhone(phone);
export const isUUID = (uuid: string) => validation.isUUID(uuid);
export const isAlphanumeric = (text: string) => validation.isAlphanumeric(text);
