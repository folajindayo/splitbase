import { renderHook, act } from "@testing-library/react";
import {
  useOptimizedCallback,
  useThrottledCallback,
  useDebouncedCallback,
} from "@/hooks/useOptimizedCallback";

describe("useOptimizedCallback", () => {
  it("returns stable callback reference", () => {
    const fn = jest.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useOptimizedCallback(callback),
      { initialProps: { callback: fn } }
    );

    const firstCallback = result.current;
    rerender({ callback: fn });
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it("calls latest callback version", () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ callback }) => useOptimizedCallback(callback),
      { initialProps: { callback: fn1 } }
    );

    act(() => {
      result.current();
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);

    rerender({ callback: fn2 });

    act(() => {
      result.current();
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

describe("useThrottledCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throttles callback calls", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottledCallback(fn, 1000));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces callback calls", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 1000));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels previous calls", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 1000));

    act(() => {
      result.current();
      jest.advanceTimersByTime(500);
      result.current();
      jest.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledTimes(0);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

