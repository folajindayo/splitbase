/**
 * Common type definitions
 * Shared types used across the application
 */

export type Status = "pending" | "active" | "completed" | "cancelled" | "failed";

export type Role = "admin" | "user" | "moderator";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export interface FilterOptions {
  [key: string]: any;
}

export interface Address {
  address: string;
  name?: string;
  verified?: boolean;
}

export interface Timestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Address, Timestamp {
  id: string;
  email?: string;
  role: Role;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];
export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

