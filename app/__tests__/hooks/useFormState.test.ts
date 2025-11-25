import { renderHook, act } from "@testing-library/react";

import { useFormState } from "@/hooks/useFormState";

describe("useFormState", () => {
  interface TestForm {
    name: string;
    email: string;
    age: number;
  }

  const initialValues: TestForm = {
    name: "",
    email: "",
    age: 0,
  };

  it("initializes with default values", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    expect(result.current.state.values).toEqual(initialValues);
    expect(result.current.state.errors).toEqual({});
    expect(result.current.state.touched).toEqual({});
    expect(result.current.state.isSubmitting).toBe(false);
    expect(result.current.state.isValid).toBe(true);
  });

  it("updates field value", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    act(() => {
      result.current.setValue("name", "John");
    });

    expect(result.current.state.values.name).toBe("John");
  });

  it("sets field error", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    act(() => {
      result.current.setError("email", "Invalid email");
    });

    expect(result.current.state.errors.email).toBe("Invalid email");
    expect(result.current.state.isValid).toBe(false);
  });

  it("marks field as touched", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    act(() => {
      result.current.setTouched("name");
    });

    expect(result.current.state.touched.name).toBe(true);
  });

  it("sets submitting state", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    act(() => {
      result.current.setSubmitting(true);
    });

    expect(result.current.state.isSubmitting).toBe(true);
  });

  it("resets form state", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    act(() => {
      result.current.setValue("name", "John");
      result.current.setError("email", "Invalid");
      result.current.setTouched("name");
      result.current.setSubmitting(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  });

  it("handles change event", () => {
    const { result } = renderHook(() => useFormState(initialValues));

    const mockEvent = {
      target: { value: "test@example.com" },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange("email")(mockEvent);
    });

    expect(result.current.state.values.email).toBe("test@example.com");
    expect(result.current.state.touched.email).toBe(true);
  });
});

