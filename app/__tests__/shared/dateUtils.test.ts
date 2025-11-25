import {

  formatDate,
  formatTime,
  formatDateTime,
  timeAgo,
  timeFromNow,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  addDays,
  addHours,
  addMinutes,
  startOfDay,
  endOfDay,
  diffInDays,
  diffInHours,
  diffInMinutes,
  formatDuration,
  parseDate,
  isValidDate,
  toISODate,
} from "../../lib/shared/dateUtils";

describe("dateUtils", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15");
      const result = formatDate(date);
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });
  });

  describe("formatTime", () => {
    it("should format time correctly", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("timeAgo", () => {
    it("should return 'just now' for recent time", () => {
      const now = new Date();
      expect(timeAgo(now)).toBe("just now");
    });

    it("should return minutes ago", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(date)).toBe("5 minutes ago");
    });

    it("should return hours ago", () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(timeAgo(date)).toBe("3 hours ago");
    });
  });

  describe("date checkers", () => {
    it("should check if date is today", () => {
      expect(isToday(new Date())).toBe(true);
      expect(isToday(addDays(new Date(), -1))).toBe(false);
    });

    it("should check if date is yesterday", () => {
      const yesterday = addDays(new Date(), -1);
      expect(isYesterday(yesterday)).toBe(true);
    });

    it("should check if date is tomorrow", () => {
      const tomorrow = addDays(new Date(), 1);
      expect(isTomorrow(tomorrow)).toBe(true);
    });

    it("should check if date is past", () => {
      const past = new Date("2020-01-01");
      expect(isPast(past)).toBe(true);
    });

    it("should check if date is future", () => {
      const future = addDays(new Date(), 10);
      expect(isFuture(future)).toBe(true);
    });
  });

  describe("date operations", () => {
    it("should add days correctly", () => {
      const date = new Date("2024-01-01");
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it("should add hours correctly", () => {
      const date = new Date("2024-01-01T12:00:00");
      const result = addHours(date, 3);
      expect(result.getHours()).toBe(15);
    });

    it("should add minutes correctly", () => {
      const date = new Date("2024-01-01T12:00:00");
      const result = addMinutes(date, 30);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe("start and end of day", () => {
    it("should get start of day", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("should get end of day", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });

  describe("date differences", () => {
    it("should calculate difference in days", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-06");
      expect(diffInDays(date1, date2)).toBe(5);
    });

    it("should calculate difference in hours", () => {
      const date1 = new Date("2024-01-01T12:00:00");
      const date2 = new Date("2024-01-01T15:00:00");
      expect(diffInHours(date1, date2)).toBe(3);
    });

    it("should calculate difference in minutes", () => {
      const date1 = new Date("2024-01-01T12:00:00");
      const date2 = new Date("2024-01-01T12:45:00");
      expect(diffInMinutes(date1, date2)).toBe(45);
    });
  });

  describe("formatDuration", () => {
    it("should format seconds", () => {
      expect(formatDuration(5000)).toBe("5s");
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration(125000)).toContain("m");
      expect(formatDuration(125000)).toContain("s");
    });

    it("should format hours and minutes", () => {
      const ms = 3 * 60 * 60 * 1000 + 30 * 60 * 1000;
      expect(formatDuration(ms)).toContain("h");
      expect(formatDuration(ms)).toContain("m");
    });
  });

  describe("parseDate", () => {
    it("should parse valid date string", () => {
      const result = parseDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return null for invalid date", () => {
      expect(parseDate("invalid")).toBeNull();
    });
  });

  describe("isValidDate", () => {
    it("should return true for valid dates", () => {
      expect(isValidDate("2024-01-15")).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it("should return false for invalid dates", () => {
      expect(isValidDate("not-a-date")).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe("toISODate", () => {
    it("should format as ISO date", () => {
      const date = new Date("2024-01-15T12:00:00");
      const result = toISODate(date);
      expect(result).toBe("2024-01-15");
    });
  });
});

