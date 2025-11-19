import { renderHook, act } from "@testing-library/react";
import { useForm } from "@/hooks/useForm";

describe("useForm", () => {
  const initialValues = {
    email: "",
    password: "",
    remember: false,
  };

  const mockValidate = (values: typeof initialValues) => {
    const errors: Partial<Record<keyof typeof initialValues, string>> = {};
    if (!values.email) errors.email = "Email is required";
    if (!values.password) errors.password = "Password is required";
    return errors;
  };

  const mockOnSubmit = jest.fn();

  it("initializes with provided values", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it("handles input changes correctly", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "email", value: "test@example.com", type: "text" },
      } as any);
    });

    expect(result.current.values.email).toBe("test@example.com");
  });

  it("handles checkbox changes correctly", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "remember", checked: true, type: "checkbox" },
      } as any);
    });

    expect(result.current.values.remember).toBe(true);
  });

  it("marks fields as touched on blur", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: "email" },
      } as any);
    });

    expect(result.current.touched.email).toBe(true);
  });

  it("validates form on submit", async () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validate: mockValidate,
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    expect(result.current.errors.email).toBe("Email is required");
    expect(result.current.errors.password).toBe("Password is required");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit when validation passes", async () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validate: mockValidate,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.setFieldValue("email", "test@example.com");
      result.current.setFieldValue("password", "password123");
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      remember: false,
    });
  });

  it("resets form correctly", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.setFieldValue("email", "test@example.com");
      result.current.setFieldError("email", "Error");
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});

