/**
 * Type guard functions
 */

import { EscrowStatus, SplitStatus, CustodyStatus, ApiResponse, ApiError } from "./api";

export function isEscrowStatus(value: unknown): value is EscrowStatus {
  return (
    typeof value === "string" &&
    ["pending", "active", "completed", "cancelled", "disputed"].includes(value)
  );
}

export function isSplitStatus(value: unknown): value is SplitStatus {
  return (
    typeof value === "string" && ["active", "paused", "completed"].includes(value)
  );
}

export function isCustodyStatus(value: unknown): value is CustodyStatus {
  return (
    typeof value === "string" && ["active", "locked", "withdrawn"].includes(value)
  );
}

export function isEthereumAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as any).success === "boolean"
  );
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as any).code === "string" &&
    typeof (value as any).message === "string"
  );
}

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success && response.data !== undefined;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: ApiError } {
  return !response.success && response.error !== undefined;
}

export function assertEthereumAddress(
  value: unknown,
  name: string = "address"
): asserts value is string {
  if (!isEthereumAddress(value)) {
    throw new Error(`Invalid Ethereum address: ${name}`);
  }
}

export function assertEscrowStatus(
  value: unknown,
  name: string = "status"
): asserts value is EscrowStatus {
  if (!isEscrowStatus(value)) {
    throw new Error(`Invalid escrow status: ${name}`);
  }
}

