import {

  sortBy,
  sortByMultiple,
  sortByDate,
  naturalSort,
} from "@/lib/shared/sort";

describe("Sort utilities", () => {
  const testData = [
    { id: 3, name: "Charlie", age: 35 },
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ];

  describe("sortBy", () => {
    it("sorts in ascending order", () => {
      const result = sortBy(testData, "id", "asc");
      expect(result[0].id).toBe(1);
      expect(result[2].id).toBe(3);
    });

    it("sorts in descending order", () => {
      const result = sortBy(testData, "id", "desc");
      expect(result[0].id).toBe(3);
      expect(result[2].id).toBe(1);
    });

    it("handles null values", () => {
      const nullData = [{ val: 1 }, { val: null }, { val: 2 }];
      const result = sortBy(nullData as any, "val", "asc");
      expect(result[2].val).toBeNull();
    });
  });

  describe("sortByMultiple", () => {
    const data = [
      { category: "A", priority: 2 },
      { category: "B", priority: 1 },
      { category: "A", priority: 1 },
    ];

    it("sorts by multiple fields", () => {
      const result = sortByMultiple(data, [
        { field: "category", order: "asc" },
        { field: "priority", order: "asc" },
      ]);

      expect(result[0].category).toBe("A");
      expect(result[0].priority).toBe(1);
    });
  });

  describe("sortByDate", () => {
    const dateData = [
      { date: new Date("2023-03-01") },
      { date: new Date("2023-01-01") },
      { date: new Date("2023-02-01") },
    ];

    it("sorts dates in ascending order", () => {
      const result = sortByDate(dateData, "date", "asc");
      expect(result[0].date.getMonth()).toBe(0); // January
    });

    it("sorts dates in descending order", () => {
      const result = sortByDate(dateData, "date", "desc");
      expect(result[0].date.getMonth()).toBe(2); // March
    });
  });

  describe("naturalSort", () => {
    const data = [
      { name: "item10" },
      { name: "item2" },
      { name: "item1" },
    ];

    it("performs natural sort", () => {
      const result = naturalSort(data, "name", "asc");
      expect(result[0].name).toBe("item1");
      expect(result[1].name).toBe("item2");
      expect(result[2].name).toBe("item10");
    });
  });
});

