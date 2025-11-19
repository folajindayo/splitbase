import { NextRequest } from "next/server";
import { validateRequest, ValidationRule } from "@/middleware/validation";
import { ApiError } from "@/middleware/errorHandler";

describe("Validation Middleware", () => {
  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  describe("validateRequest", () => {
    it("validates required fields", async () => {
      const rules: ValidationRule[] = [
        { field: "name", required: true, type: "string" },
      ];

      const request = createMockRequest({ name: "Test" });
      const result = await validateRequest(request, rules);

      expect(result.name).toBe("Test");
    });

    it("throws error for missing required field", async () => {
      const rules: ValidationRule[] = [
        { field: "name", required: true, type: "string" },
      ];

      const request = createMockRequest({});

      await expect(validateRequest(request, rules)).rejects.toThrow(ApiError);
    });

    it("validates field types", async () => {
      const rules: ValidationRule[] = [
        { field: "age", required: true, type: "number" },
      ];

      const request = createMockRequest({ age: "not a number" });

      await expect(validateRequest(request, rules)).rejects.toThrow(ApiError);
    });

    it("validates min/max values", async () => {
      const rules: ValidationRule[] = [
        { field: "age", required: true, type: "number", min: 18, max: 100 },
      ];

      const request = createMockRequest({ age: 150 });

      await expect(validateRequest(request, rules)).rejects.toThrow(ApiError);
    });

    it("validates pattern matching", async () => {
      const rules: ValidationRule[] = [
        {
          field: "email",
          required: true,
          type: "string",
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      ];

      const request = createMockRequest({ email: "invalid-email" });

      await expect(validateRequest(request, rules)).rejects.toThrow(ApiError);
    });

    it("validates with custom function", async () => {
      const rules: ValidationRule[] = [
        {
          field: "username",
          required: true,
          type: "string",
          custom: (value) => value.length >= 3,
          message: "Username must be at least 3 characters",
        },
      ];

      const request = createMockRequest({ username: "ab" });

      await expect(validateRequest(request, rules)).rejects.toThrow("Username must be at least 3 characters");
    });
  });
});

