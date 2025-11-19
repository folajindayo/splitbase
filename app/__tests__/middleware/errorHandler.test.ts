import { ApiError, handleApiError, createApiResponse } from "@/middleware/errorHandler";

describe("Error Handler Middleware", () => {
  describe("ApiError", () => {
    it("creates API error with status code", () => {
      const error = new ApiError(404, "Not found", "NOT_FOUND");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.name).toBe("ApiError");
    });
  });

  describe("handleApiError", () => {
    it("handles ApiError correctly", async () => {
      const error = new ApiError(400, "Bad request");
      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad request");
      expect(data.timestamp).toBeDefined();
    });

    it("handles generic Error", async () => {
      const error = new Error("Something went wrong");
      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Something went wrong");
    });

    it("handles unknown error type", async () => {
      const response = handleApiError("string error");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("An unexpected error occurred");
    });
  });

  describe("createApiResponse", () => {
    it("creates successful response", async () => {
      const response = createApiResponse({ message: "Success" });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toBe("Success");
      expect(data.timestamp).toBeDefined();
    });

    it("creates response with custom status", async () => {
      const response = createApiResponse({ id: "123" }, 201);

      expect(response.status).toBe(201);
    });
  });
});

