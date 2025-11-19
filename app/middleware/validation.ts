import { NextRequest } from "next/server";
import { ApiError } from "./errorHandler";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export async function validateRequest(
  request: NextRequest,
  rules: ValidationRule[]
): Promise<any> {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    throw new ApiError(400, "Invalid JSON body");
  }

  for (const rule of rules) {
    const value = body[rule.field];

    if (rule.required && (value === undefined || value === null)) {
      throw new ApiError(400, rule.message || `${rule.field} is required`);
    }

    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        throw new ApiError(
          400,
          rule.message || `${rule.field} must be of type ${rule.type}`
        );
      }

      if (rule.min !== undefined && value < rule.min) {
        throw new ApiError(
          400,
          rule.message || `${rule.field} must be at least ${rule.min}`
        );
      }

      if (rule.max !== undefined && value > rule.max) {
        throw new ApiError(
          400,
          rule.message || `${rule.field} must be at most ${rule.max}`
        );
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        throw new ApiError(
          400,
          rule.message || `${rule.field} has invalid format`
        );
      }

      if (rule.custom && !rule.custom(value)) {
        throw new ApiError(
          400,
          rule.message || `${rule.field} validation failed`
        );
      }
    }
  }

  return body;
}

