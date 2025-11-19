import {
  filterBySearch,
  filterByMultiple,
  filterByDateRange,
  filterByRange,
  filterUnique,
  fuzzyFilter,
} from "@/lib/shared/filters";

describe("Filter utilities", () => {
  const testData = [
    { id: 1, name: "John Doe", age: 30, role: "admin" },
    { id: 2, name: "Jane Smith", age: 25, role: "user" },
    { id: 3, name: "Bob Johnson", age: 35, role: "user" },
    { id: 4, name: "Alice Brown", age: 28, role: "admin" },
  ];

  describe("filterBySearch", () => {
    it("filters by search query", () => {
      const result = filterBySearch(testData, "john", ["name"]);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("John Doe");
    });

    it("returns all items for empty query", () => {
      const result = filterBySearch(testData, "", ["name"]);
      expect(result.length).toBe(testData.length);
    });
  });

  describe("filterByMultiple", () => {
    it("filters by multiple criteria", () => {
      const result = filterByMultiple(testData, { role: "admin" });
      expect(result.length).toBe(2);
    });

    it("handles array filters", () => {
      const result = filterByMultiple(testData, { role: ["admin", "user"] });
      expect(result.length).toBe(testData.length);
    });
  });

  describe("filterByDateRange", () => {
    const dateData = [
      { date: new Date("2023-01-01") },
      { date: new Date("2023-06-01") },
      { date: new Date("2023-12-01") },
    ];

    it("filters by date range", () => {
      const result = filterByDateRange(
        dateData,
        "date",
        new Date("2023-05-01"),
        new Date("2023-11-01")
      );
      expect(result.length).toBe(1);
    });
  });

  describe("filterByRange", () => {
    it("filters by numeric range", () => {
      const result = filterByRange(testData, "age", 26, 32);
      expect(result.length).toBe(2);
    });

    it("handles min only", () => {
      const result = filterByRange(testData, "age", 30);
      expect(result.length).toBe(2);
    });
  });

  describe("filterUnique", () => {
    const duplicateData = [
      { type: "A" },
      { type: "B" },
      { type: "A" },
      { type: "C" },
    ];

    it("filters unique items", () => {
      const result = filterUnique(duplicateData, "type");
      expect(result.length).toBe(3);
    });
  });

  describe("fuzzyFilter", () => {
    it("performs fuzzy search", () => {
      const result = fuzzyFilter(testData, "jd", ["name"]);
      expect(result.some(item => item.name === "John Doe")).toBe(true);
    });
  });
});

