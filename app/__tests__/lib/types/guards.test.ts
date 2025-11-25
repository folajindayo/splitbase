import {

  isEscrowStatus,
  isSplitStatus,
  isCustodyStatus,
  isEthereumAddress,
  isApiResponse,
  isApiError,
  isSuccessResponse,
  isErrorResponse,
  assertEthereumAddress,
  assertEscrowStatus,
} from "@/lib/types/guards";
import { ApiResponse, ApiError } from "@/lib/types/api";

describe("Type Guards", () => {
  describe("isEscrowStatus", () => {
    it("returns true for valid escrow statuses", () => {
      expect(isEscrowStatus("pending")).toBe(true);
      expect(isEscrowStatus("active")).toBe(true);
      expect(isEscrowStatus("completed")).toBe(true);
      expect(isEscrowStatus("cancelled")).toBe(true);
      expect(isEscrowStatus("disputed")).toBe(true);
    });

    it("returns false for invalid statuses", () => {
      expect(isEscrowStatus("invalid")).toBe(false);
      expect(isEscrowStatus(123)).toBe(false);
      expect(isEscrowStatus(null)).toBe(false);
    });
  });

  describe("isSplitStatus", () => {
    it("returns true for valid split statuses", () => {
      expect(isSplitStatus("active")).toBe(true);
      expect(isSplitStatus("paused")).toBe(true);
      expect(isSplitStatus("completed")).toBe(true);
    });

    it("returns false for invalid statuses", () => {
      expect(isSplitStatus("invalid")).toBe(false);
      expect(isSplitStatus(123)).toBe(false);
    });
  });

  describe("isCustodyStatus", () => {
    it("returns true for valid custody statuses", () => {
      expect(isCustodyStatus("active")).toBe(true);
      expect(isCustodyStatus("locked")).toBe(true);
      expect(isCustodyStatus("withdrawn")).toBe(true);
    });

    it("returns false for invalid statuses", () => {
      expect(isCustodyStatus("invalid")).toBe(false);
    });
  });

  describe("isEthereumAddress", () => {
    it("returns true for valid addresses", () => {
      expect(isEthereumAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")).toBe(
        true
      );
      expect(isEthereumAddress("0x0000000000000000000000000000000000000000")).toBe(
        true
      );
    });

    it("returns false for invalid addresses", () => {
      expect(isEthereumAddress("0x123")).toBe(false);
      expect(isEthereumAddress("invalid")).toBe(false);
      expect(isEthereumAddress(123)).toBe(false);
    });
  });

  describe("isApiResponse", () => {
    it("returns true for valid API responses", () => {
      expect(isApiResponse({ success: true, data: "test" })).toBe(true);
      expect(isApiResponse({ success: false, error: {} })).toBe(true);
    });

    it("returns false for invalid responses", () => {
      expect(isApiResponse({})).toBe(false);
      expect(isApiResponse({ data: "test" })).toBe(false);
      expect(isApiResponse(null)).toBe(false);
    });
  });

  describe("isApiError", () => {
    it("returns true for valid API errors", () => {
      expect(isApiError({ code: "ERR_001", message: "Error" })).toBe(true);
    });

    it("returns false for invalid errors", () => {
      expect(isApiError({ code: "ERR_001" })).toBe(false);
      expect(isApiError({ message: "Error" })).toBe(false);
      expect(isApiError(null)).toBe(false);
    });
  });

  describe("isSuccessResponse", () => {
    it("returns true for success responses", () => {
      const response: ApiResponse<string> = {
        success: true,
        data: "test",
      };
      expect(isSuccessResponse(response)).toBe(true);
    });

    it("returns false for error responses", () => {
      const response: ApiResponse<string> = {
        success: false,
        error: { code: "ERR", message: "Error" },
      };
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe("isErrorResponse", () => {
    it("returns true for error responses", () => {
      const response: ApiResponse<string> = {
        success: false,
        error: { code: "ERR", message: "Error" },
      };
      expect(isErrorResponse(response)).toBe(true);
    });

    it("returns false for success responses", () => {
      const response: ApiResponse<string> = {
        success: true,
        data: "test",
      };
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe("assertEthereumAddress", () => {
    it("does not throw for valid addresses", () => {
      expect(() =>
        assertEthereumAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
      ).not.toThrow();
    });

    it("throws for invalid addresses", () => {
      expect(() => assertEthereumAddress("invalid")).toThrow();
      expect(() => assertEthereumAddress("0x123")).toThrow();
    });
  });

  describe("assertEscrowStatus", () => {
    it("does not throw for valid statuses", () => {
      expect(() => assertEscrowStatus("pending")).not.toThrow();
      expect(() => assertEscrowStatus("active")).not.toThrow();
    });

    it("throws for invalid statuses", () => {
      expect(() => assertEscrowStatus("invalid")).toThrow();
    });
  });
});

