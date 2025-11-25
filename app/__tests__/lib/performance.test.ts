import {

  memoize,
  throttle,
  debounce,
  batch,
} from "@/lib/shared/performance";

describe("Performance utilities", () => {
  describe("memoize", () => {
    it("caches function results", () => {
      const fn = jest.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      memoized(1, 2);
      memoized(1, 2);
      memoized(1, 2);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(memoized(1, 2)).toBe(3);
    });

    it("computes new result for different arguments", () => {
      const fn = jest.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      memoized(1, 2);
      memoized(2, 3);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(2, 3)).toBe(5);
    });
  });

  describe("throttle", () => {
    jest.useFakeTimers();

    it("limits function calls", () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("debounce", () => {
    jest.useFakeTimers();

    it("delays function execution", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("resets delay on subsequent calls", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(50);
      debounced();
      jest.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("batch", () => {
    jest.useFakeTimers();

    it("batches multiple calls", () => {
      const fn = jest.fn();
      const batched = batch(fn, 50);

      batched(1);
      batched(2);
      batched(3);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith([1, 2, 3]);
    });
  });
});

