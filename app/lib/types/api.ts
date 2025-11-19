/**
 * API type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  version?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

// Escrow API types
export interface EscrowResponse {
  id: string;
  buyer: string;
  seller: string;
  amount: string;
  token?: string;
  status: EscrowStatus;
  description: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export type EscrowStatus = "pending" | "active" | "completed" | "cancelled" | "disputed";

export interface CreateEscrowRequest {
  buyer: string;
  seller: string;
  amount: string;
  token?: string;
  description: string;
  deadline: string;
}

export interface UpdateEscrowRequest {
  status?: EscrowStatus;
  description?: string;
  deadline?: string;
}

// Split API types
export interface SplitResponse {
  id: string;
  name: string;
  recipients: SplitRecipient[];
  token?: string;
  totalAmount?: string;
  status: SplitStatus;
  createdAt: string;
  updatedAt: string;
}

export type SplitStatus = "active" | "paused" | "completed";

export interface SplitRecipient {
  address: string;
  percentage: number;
  amountReceived?: string;
}

export interface CreateSplitRequest {
  name: string;
  recipients: Omit<SplitRecipient, "amountReceived">[];
  token?: string;
}

export interface UpdateSplitRequest {
  name?: string;
  status?: SplitStatus;
}

// Custody API types
export interface CustodyResponse {
  id: string;
  owner: string;
  balance: string;
  token: string;
  lockedUntil?: string;
  status: CustodyStatus;
  createdAt: string;
  updatedAt: string;
}

export type CustodyStatus = "active" | "locked" | "withdrawn";

export interface DepositRequest {
  amount: string;
  token: string;
  recipient: string;
}

export interface WithdrawRequest {
  amount: string;
  recipient: string;
}

