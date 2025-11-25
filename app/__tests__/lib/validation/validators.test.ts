import {

  validate,
  validateAsync,
  validatePartial,
  getFirstError,
  getAllErrors,
} from "@/lib/validation/validators";
import { z } from "zod";

describe("Validators", () => {
  const userSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18),
  });

  describe("validate", () => {
    it("validates correct data", () => {
      const data = {
        name: "John",
        email: "john@example.com",
        age: 25,
      };

      const result = validate(userSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toBeUndefined();
    });

    it("returns errors for invalid data", () => {
      const data = {
        name: "J",
        email: "invalid",
        age: 15,
      };

      const result = validate(userSchema, data);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors!)).toContain("name");
      expect(Object.keys(result.errors!)).toContain("email");
      expect(Object.keys(result.errors!)).toContain("age");
    });

    it("handles missing fields", () => {
      const data = {
        name: "John",
      };

      const result = validate(userSchema, data);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("validateAsync", () => {
    it("validates correct data asynchronously", async () => {
      const data = {
        name: "John",
        email: "john@example.com",
        age: 25,
      };

      const result = await validateAsync(userSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it("returns errors for invalid data", async () => {
      const data = {
        name: "J",
        email: "invalid",
        age: 15,
      };

      const result = await validateAsync(userSchema, data);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("validatePartial", () => {
    it("validates partial data", () => {
      const data = {
        name: "John",
      };

      const result = validatePartial(userSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("name", "John");
    });

    it("still validates provided fields", () => {
      const data = {
        name: "J",
      };

      const result = validatePartial(userSchema, data);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors!)).toContain("name");
    });
  });

  describe("getFirstError", () => {
    it("returns first error message", () => {
      const errors = {
        name: ["Too short"],
        email: ["Invalid email"],
      };

      const firstError = getFirstError(errors);
      expect(firstError).toBe("Too short");
    });

    it("returns null for empty errors", () => {
      const firstError = getFirstError({});
      expect(firstError).toBeNull();
    });
  });

  describe("getAllErrors", () => {
    it("returns all error messages", () => {
      const errors = {
        name: ["Too short", "Invalid format"],
        email: ["Invalid email"],
      };

      const allErrors = getAllErrors(errors);
      expect(allErrors).toHaveLength(3);
      expect(allErrors).toContain("Too short");
      expect(allErrors).toContain("Invalid format");
      expect(allErrors).toContain("Invalid email");
    });

    it("returns empty array for empty errors", () => {
      const allErrors = getAllErrors({});
      expect(allErrors).toEqual([]);
    });
  });
});

