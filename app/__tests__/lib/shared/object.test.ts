import {

  pick,
  omit,
  deepClone,
  deepMerge,
  isEqual,
  isEmpty,
  mapValues,
  invert,
} from "@/lib/shared/object";

describe("Object Utilities", () => {
  describe("pick", () => {
    it("picks specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });
  });

  describe("omit", () => {
    it("omits specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });
  });

  describe("deepClone", () => {
    it("deeply clones objects", () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it("clones arrays", () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it("clones dates", () => {
      const date = new Date();
      const cloned = deepClone(date);
      
      expect(cloned.getTime()).toBe(date.getTime());
      expect(cloned).not.toBe(date);
    });
  });

  describe("deepMerge", () => {
    it("deeply merges objects", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe("isEqual", () => {
    it("compares objects deeply", () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    });
  });

  describe("isEmpty", () => {
    it("checks if object is empty", () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe("mapValues", () => {
    it("maps object values", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = mapValues(obj, (v) => v * 2);
      expect(result).toEqual({ a: 2, b: 4, c: 6 });
    });
  });

  describe("invert", () => {
    it("inverts object keys and values", () => {
      const obj = { a: "1", b: "2" };
      expect(invert(obj)).toEqual({ "1": "a", "2": "b" });
    });
  });
});

