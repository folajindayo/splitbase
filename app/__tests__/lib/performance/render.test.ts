import {

  shouldComponentUpdate,
  createComparator,
  getRenderCount,
  clearRenderCounts,
} from "@/lib/performance/render";

describe("Performance Render Utilities", () => {
  describe("shouldComponentUpdate", () => {
    it("returns true when props differ", () => {
      const prevProps = { a: 1, b: 2 };
      const nextProps = { a: 1, b: 3 };

      expect(shouldComponentUpdate(prevProps, nextProps)).toBe(true);
    });

    it("returns false when props are identical", () => {
      const prevProps = { a: 1, b: 2 };
      const nextProps = { a: 1, b: 2 };

      expect(shouldComponentUpdate(prevProps, nextProps)).toBe(false);
    });

    it("checks only specified keys when provided", () => {
      const prevProps = { a: 1, b: 2, c: 3 };
      const nextProps = { a: 1, b: 3, c: 4 };

      expect(shouldComponentUpdate(prevProps, nextProps, ["a"])).toBe(false);
      expect(shouldComponentUpdate(prevProps, nextProps, ["b"])).toBe(true);
      expect(shouldComponentUpdate(prevProps, nextProps, ["c"])).toBe(true);
      expect(shouldComponentUpdate(prevProps, nextProps, ["a", "b"])).toBe(true);
    });

    it("returns true when prop count differs", () => {
      const prevProps = { a: 1 };
      const nextProps = { a: 1, b: 2 };

      expect(shouldComponentUpdate(prevProps as any, nextProps as any)).toBe(true);
    });
  });

  describe("createComparator", () => {
    it("creates a comparator function", () => {
      const comparator = createComparator(["a", "b"]);

      expect(typeof comparator).toBe("function");
    });

    it("returns true when specified props are equal", () => {
      const comparator = createComparator<{ a: number; b: number; c: number }>(["a", "b"]);
      const prevProps = { a: 1, b: 2, c: 3 };
      const nextProps = { a: 1, b: 2, c: 4 };

      expect(comparator(prevProps, nextProps)).toBe(true);
    });

    it("returns false when specified props differ", () => {
      const comparator = createComparator<{ a: number; b: number }>(["a", "b"]);
      const prevProps = { a: 1, b: 2 };
      const nextProps = { a: 1, b: 3 };

      expect(comparator(prevProps, nextProps)).toBe(false);
    });
  });

  describe("getRenderCount", () => {
    beforeEach(() => {
      clearRenderCounts();
    });

    it("returns 0 for components that haven't rendered", () => {
      expect(getRenderCount("TestComponent")).toBe(0);
    });

    it("returns render count when available", () => {
      if (typeof window !== "undefined") {
        (window as any).__renderCounts = { TestComponent: 5 };
        expect(getRenderCount("TestComponent")).toBe(5);
      }
    });
  });

  describe("clearRenderCounts", () => {
    it("clears all render counts", () => {
      if (typeof window !== "undefined") {
        (window as any).__renderCounts = { TestComponent: 5 };
        clearRenderCounts();
        expect((window as any).__renderCounts).toEqual({});
      }
    });
  });
});

