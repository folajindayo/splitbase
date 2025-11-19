import { useState, useCallback } from "react";

export interface FormErrors {
  [key: string]: string;
}

export interface FormState<T> {
  values: T;
  errors: FormErrors;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
}

interface UseFormStateResult<T> {
  state: FormState<T>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useFormState<T extends Record<string, any>>(
  initialValues: T
): UseFormStateResult<T> {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  const setValue = useCallback((field: keyof T, value: any) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
    }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false,
    }));
  }, []);

  const setTouched = useCallback((field: keyof T) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, e.target.value);
      setTouched(field);
    },
    [setValue, setTouched]
  );

  return {
    state,
    setValue,
    setError,
    setTouched,
    setSubmitting,
    reset,
    handleChange,
  };
}

