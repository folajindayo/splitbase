import {
  clamp,
  round,
  percentage,
  average,
  median,
  sum,
  max,
  min,
  lerp,
  normalize,
  isPrime,
  gcd,
  lcm,
} from "@/lib/shared/math";

describe("Math Utilities", () => {
  describe("clamp", () => {
    it("clamps value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("round", () => {
    it("rounds to specified decimals", () => {
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.14159, 3)).toBe(3.142);
      expect(round(3.5, 0)).toBe(4);
    });
  });

  describe("percentage", () => {
    it("calculates percentage", () => {
      expect(percentage(50, 100)).toBe(50);
      expect(percentage(25, 200)).toBe(12.5);
      expect(percentage(0, 100)).toBe(0);
    });

    it("handles zero total", () => {
      expect(percentage(50, 0)).toBe(0);
    });
  });

  describe("average", () => {
    it("calculates average", () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20])).toBe(15);
    });

    it("handles empty array", () => {
      expect(average([])).toBe(0);
    });
  });

  describe("median", () => {
    it("calculates median for odd length", () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it("calculates median for even length", () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it("handles empty array", () => {
      expect(median([])).toBe(0);
    });
  });

  describe("sum", () => {
    it("calculates sum", () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
      expect(sum([])).toBe(0);
    });
  });

  describe("max", () => {
    it("finds maximum", () => {
      expect(max([1, 5, 3, 9, 2])).toBe(9);
    });
  });

  describe("min", () => {
    it("finds minimum", () => {
      expect(min([5, 2, 8, 1, 9])).toBe(1);
    });
  });

  describe("lerp", () => {
    it("interpolates between values", () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 100, 0.25)).toBe(25);
    });
  });

  describe("normalize", () => {
    it("normalizes value to 0-1 range", () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
      expect(normalize(25, 0, 100)).toBe(0.25);
    });
  });

  describe("isPrime", () => {
    it("identifies prime numbers", () => {
      expect(isPrime(2)).toBe(true);
      expect(isPrime(3)).toBe(true);
      expect(isPrime(17)).toBe(true);
      expect(isPrime(4)).toBe(false);
      expect(isPrime(1)).toBe(false);
    });
  });

  describe("gcd", () => {
    it("calculates greatest common divisor", () => {
      expect(gcd(48, 18)).toBe(6);
      expect(gcd(100, 50)).toBe(50);
    });
  });

  describe("lcm", () => {
    it("calculates least common multiple", () => {
      expect(lcm(12, 18)).toBe(36);
      expect(lcm(4, 6)).toBe(12);
    });
  });
});

