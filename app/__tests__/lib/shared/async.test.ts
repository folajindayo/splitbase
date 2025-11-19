import { retry, sleep, timeout, parallel, sequential, allSettled } from "@/lib/shared/async";

describe("Async Utilities", () => {
  describe("retry", () => {
    it("succeeds on first attempt", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      const result = await retry(fn, 3, 10);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on failure", async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");

      const result = await retry(fn, 3, 10);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("throws after max attempts", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("fail"));
      await expect(retry(fn, 2, 10)).rejects.toThrow("fail");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("sleep", () => {
    it("delays execution", async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe("timeout", () => {
    it("resolves if promise completes in time", async () => {
      const promise = Promise.resolve("success");
      const result = await timeout(promise, 100);
      expect(result).toBe("success");
    });

    it("rejects if promise times out", async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 200));
      await expect(timeout(promise, 50)).rejects.toThrow("Operation timed out");
    });
  });

  describe("parallel", () => {
    it("executes tasks in parallel", async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
      ];

      const results = await parallel(tasks);
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe("sequential", () => {
    it("executes tasks sequentially", async () => {
      const order: number[] = [];
      const tasks = [
        async () => {
          await sleep(10);
          order.push(1);
          return 1;
        },
        async () => {
          order.push(2);
          return 2;
        },
      ];

      await sequential(tasks);
      expect(order).toEqual([1, 2]);
    });
  });

  describe("allSettled", () => {
    it("returns all results", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject("error"),
        Promise.resolve(3),
      ];

      const results = await allSettled(promises);
      expect(results[0]).toEqual({ status: "fulfilled", value: 1 });
      expect(results[1]).toEqual({ status: "rejected", reason: "error" });
      expect(results[2]).toEqual({ status: "fulfilled", value: 3 });
    });
  });
});

