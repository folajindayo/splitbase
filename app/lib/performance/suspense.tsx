/**
 * Suspense boundary utilities
 */

import { Suspense, ComponentType, ReactNode, SuspenseProps } from "react";

export interface SuspenseBoundaryProps extends SuspenseProps {
  name?: string;
}

export function SuspenseBoundary({ name, children, fallback }: SuspenseBoundaryProps) {
  if (name && process.env.NODE_ENV === "development") {
    console.log(`[Suspense] ${name} boundary mounted`);
  }

  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: ReactNode,
  name?: string
) {
  const WrappedComponent = (props: P) => (
    <SuspenseBoundary name={name || Component.displayName} fallback={fallback}>
      <Component {...props} />
    </SuspenseBoundary>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export function createSuspenseResource<T>(promise: Promise<T>) {
  let status = "pending";
  let result: T;
  let error: any;

  const suspender = promise.then(
    (value) => {
      status = "success";
      result = value;
    },
    (err) => {
      status = "error";
      error = err;
    }
  );

  return {
    read(): T {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw error;
      } else {
        return result;
      }
    },
  };
}

