/**
 * Central Type Definitions
 * Shared types and interfaces for the application
 */

// Common types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Status types
export type Status = "idle" | "loading" | "success" | "error";
export type RequestStatus = "pending" | "fulfilled" | "rejected";

// Callback types
export type Callback = () => void;
export type AsyncCallback = () => Promise<void>;
export type ErrorCallback = (error: Error) => void;

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type ClickHandler = (event: React.MouseEvent) => void;

// API types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface WithId {
  id: string;
}

export interface WithTimestamps {
  createdAt: string;
  updatedAt: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

// Form types
export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

// Address types
export type Address = `0x${string}`;

// Transaction types
export interface Transaction extends WithId, WithTimestamps {
  hash: string;
  from: Address;
  to: Address;
  value: string;
  status: "pending" | "confirmed" | "failed";
}

