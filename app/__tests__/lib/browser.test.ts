import {
  isMobile,
  isIOS,
  isAndroid,
  getBrowserName,
  getViewport,
} from "@/lib/shared/browser";

describe("Browser utilities", () => {
  describe("isMobile", () => {
    it("detects mobile devices", () => {
      const originalUA = navigator.userAgent;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        configurable: true,
      });

      expect(isMobile()).toBe(true);

      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    });
  });

  describe("isIOS", () => {
    it("detects iOS devices", () => {
      const originalUA = navigator.userAgent;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
        configurable: true,
      });

      expect(isIOS()).toBe(true);

      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    });
  });

  describe("isAndroid", () => {
    it("detects Android devices", () => {
      const originalUA = navigator.userAgent;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10)",
        configurable: true,
      });

      expect(isAndroid()).toBe(true);

      Object.defineProperty(navigator, "userAgent", {
        value: originalUA,
        configurable: true,
      });
    });
  });

  describe("getBrowserName", () => {
    it("identifies browser from user agent", () => {
      const testCases = [
        { ua: "Chrome/90.0", expected: "chrome" },
        { ua: "Firefox/88.0", expected: "firefox" },
        { ua: "Safari/14.0", expected: "safari" },
      ];

      testCases.forEach(({ ua, expected }) => {
        const originalUA = navigator.userAgent;

        Object.defineProperty(navigator, "userAgent", {
          value: ua,
          configurable: true,
        });

        expect(getBrowserName()).toBe(expected);

        Object.defineProperty(navigator, "userAgent", {
          value: originalUA,
          configurable: true,
        });
      });
    });
  });

  describe("getViewport", () => {
    it("returns viewport dimensions", () => {
      const viewport = getViewport();

      expect(viewport).toHaveProperty("width");
      expect(viewport).toHaveProperty("height");
      expect(typeof viewport.width).toBe("number");
      expect(typeof viewport.height).toBe("number");
    });
  });
});

