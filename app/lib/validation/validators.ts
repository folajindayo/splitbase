/**
 * Validation utility functions
 */

import { ZodSchema, ZodError } from "zod";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: { _: ["Validation failed"] },
    };
  }
}

export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    const validated = await schema.parseAsync(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: { _: ["Validation failed"] },
    };
  }
}

export function validatePartial<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<Partial<T>> {
  const partialSchema = schema.partial();
  return validate(partialSchema, data);
}

export function getFirstError(errors: Record<string, string[]>): string | null {
  const keys = Object.keys(errors);
  if (keys.length === 0) return null;
  const firstKey = keys[0];
  return errors[firstKey][0] || null;
}

export function getAllErrors(errors: Record<string, string[]>): string[] {
  return Object.values(errors).flat();
}

