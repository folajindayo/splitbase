import {

  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompact,
  round,
  roundUp,
  roundDown,
  clamp,
  inRange,
  randomInt,
  percentage,
  percentageChange,
  average,
  median,
  sum,
  product,
  isEven,
  isOdd,
  isPositive,
  isNegative,
  isZero,
  isPrime,
  toOrdinal,
  isValidNumber,
} from "../../lib/shared/numberUtils";

describe("numberUtils", () => {
  describe("formatNumber", () => {
    it("should format number with thousands separator", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should format with decimals", () => {
      expect(formatNumber(1234.567, 2)).toBe("1,234.57");
    });
  });

  describe("formatCurrency", () => {
    it("should format as USD currency", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
      expect(result).toContain("$");
    });
  });

  describe("formatPercentage", () => {
    it("should format as percentage", () => {
      expect(formatPercentage(0.5)).toBe("50.0%");
      expect(formatPercentage(0.333, 2)).toBe("33.30%");
    });
  });

  describe("formatCompact", () => {
    it("should format large numbers compactly", () => {
      expect(formatCompact(1500)).toBe("1.5K");
      expect(formatCompact(1500000)).toBe("1.5M");
      expect(formatCompact(1500000000)).toBe("1.5B");
    });

    it("should not format small numbers", () => {
      expect(formatCompact(500)).toBe("500");
    });
  });

  describe("rounding", () => {
    it("should round to decimals", () => {
      expect(round(1.235, 2)).toBe(1.24);
      expect(round(1.234, 2)).toBe(1.23);
    });

    it("should round up", () => {
      expect(roundUp(1.231, 2)).toBe(1.24);
    });

    it("should round down", () => {
      expect(roundDown(1.239, 2)).toBe(1.23);
    });
  });

  describe("clamp", () => {
    it("should clamp number between min and max", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("inRange", () => {
    it("should check if number is in range", () => {
      expect(inRange(5, 0, 10)).toBe(true);
      expect(inRange(-5, 0, 10)).toBe(false);
      expect(inRange(15, 0, 10)).toBe(false);
    });
  });

  describe("randomInt", () => {
    it("should generate random integer in range", () => {
      const result = randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("percentage calculations", () => {
    it("should calculate percentage", () => {
      expect(percentage(25, 100)).toBe(25);
      expect(percentage(50, 200)).toBe(25);
    });

    it("should handle zero total", () => {
      expect(percentage(25, 0)).toBe(0);
    });

    it("should calculate percentage change", () => {
      expect(percentageChange(100, 150)).toBe(50);
      expect(percentageChange(100, 50)).toBe(-50);
    });
  });

  describe("statistics", () => {
    it("should calculate average", () => {
      expect(average(1, 2, 3, 4, 5)).toBe(3);
      expect(average(10, 20, 30)).toBe(20);
    });

    it("should calculate median", () => {
      expect(median(1, 2, 3, 4, 5)).toBe(3);
      expect(median(1, 2, 3, 4)).toBe(2.5);
    });

    it("should calculate sum", () => {
      expect(sum(1, 2, 3, 4, 5)).toBe(15);
    });

    it("should calculate product", () => {
      expect(product(2, 3, 4)).toBe(24);
    });
  });

  describe("number checks", () => {
    it("should check if even", () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(3)).toBe(false);
    });

    it("should check if odd", () => {
      expect(isOdd(3)).toBe(true);
      expect(isOdd(2)).toBe(false);
    });

    it("should check if positive", () => {
      expect(isPositive(5)).toBe(true);
      expect(isPositive(-5)).toBe(false);
      expect(isPositive(0)).toBe(false);
    });

    it("should check if negative", () => {
      expect(isNegative(-5)).toBe(true);
      expect(isNegative(5)).toBe(false);
      expect(isNegative(0)).toBe(false);
    });

    it("should check if zero", () => {
      expect(isZero(0)).toBe(true);
      expect(isZero(1)).toBe(false);
    });

    it("should check if prime", () => {
      expect(isPrime(2)).toBe(true);
      expect(isPrime(3)).toBe(true);
      expect(isPrime(4)).toBe(false);
      expect(isPrime(17)).toBe(true);
    });
  });

  describe("toOrdinal", () => {
    it("should convert to ordinal", () => {
      expect(toOrdinal(1)).toBe("1st");
      expect(toOrdinal(2)).toBe("2nd");
      expect(toOrdinal(3)).toBe("3rd");
      expect(toOrdinal(4)).toBe("4th");
      expect(toOrdinal(21)).toBe("21st");
    });
  });

  describe("isValidNumber", () => {
    it("should validate numbers", () => {
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber("123")).toBe(false);
    });
  });
});

