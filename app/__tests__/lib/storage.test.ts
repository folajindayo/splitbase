import {

  getItem,
  setItem,
  removeItem,
  clear,
  hasItem,
  setItemWithExpiry,
  getItemWithExpiry,
} from "@/lib/shared/storage";

describe("Storage utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getItem and setItem", () => {
    it("stores and retrieves values", () => {
      setItem("testKey", "testValue");
      expect(getItem("testKey")).toBe("testValue");
    });

    it("stores complex objects", () => {
      const obj = { name: "John", age: 30 };
      setItem("user", obj);
      expect(getItem("user")).toEqual(obj);
    });

    it("returns null for non-existent keys", () => {
      expect(getItem("nonExistent")).toBeNull();
    });
  });

  describe("removeItem", () => {
    it("removes items from storage", () => {
      setItem("testKey", "value");
      expect(hasItem("testKey")).toBe(true);

      removeItem("testKey");
      expect(hasItem("testKey")).toBe(false);
    });
  });

  describe("clear", () => {
    it("clears all items", () => {
      setItem("key1", "value1");
      setItem("key2", "value2");

      clear();

      expect(hasItem("key1")).toBe(false);
      expect(hasItem("key2")).toBe(false);
    });
  });

  describe("hasItem", () => {
    it("checks if item exists", () => {
      expect(hasItem("testKey")).toBe(false);

      setItem("testKey", "value");
      expect(hasItem("testKey")).toBe(true);
    });
  });

  describe("setItemWithExpiry and getItemWithExpiry", () => {
    it("stores items with expiry", () => {
      setItemWithExpiry("tempKey", "tempValue", 1);
      expect(getItemWithExpiry("tempKey")).toBe("tempValue");
    });

    it("returns null for expired items", async () => {
      setItemWithExpiry("expKey", "expValue", 0.001);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(getItemWithExpiry("expKey")).toBeNull();
    });

    it("removes expired items", async () => {
      setItemWithExpiry("expKey", "expValue", 0.001);

      await new Promise((resolve) => setTimeout(resolve, 10));

      getItemWithExpiry("expKey");
      expect(hasItem("expKey")).toBe(false);
    });
  });
});

