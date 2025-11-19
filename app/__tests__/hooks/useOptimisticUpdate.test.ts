import { renderHook, act, waitFor } from "@testing-library/react";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";

describe("useOptimisticUpdate", () => {
  it("initializes with null data", () => {
    const { result } = renderHook(() => useOptimisticUpdate<string>());

    expect(result.current.data).toBeNull();
    expect(result.current.isOptimistic).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets optimistic data immediately", async () => {
    const { result } = renderHook(() => useOptimisticUpdate<string>());

    const updateFn = jest.fn().mockResolvedValue("real data");

    act(() => {
      result.current.performUpdate("optimistic data", updateFn);
    });

    // Should show optimistic data immediately
    expect(result.current.data).toBe("optimistic data");
    expect(result.current.isOptimistic).toBe(true);
  });

  it("updates with real data after successful update", async () => {
    const { result } = renderHook(() => useOptimisticUpdate<string>());

    const updateFn = jest.fn().mockResolvedValue("real data");

    await act(async () => {
      await result.current.performUpdate("optimistic data", updateFn);
    });

    await waitFor(() => {
      expect(result.current.data).toBe("real data");
      expect(result.current.isOptimistic).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it("reverts on error", async () => {
    const { result } = renderHook(() => useOptimisticUpdate<string>());

    const updateFn = jest.fn().mockRejectedValue(new Error("Update failed"));

    await act(async () => {
      await result.current.performUpdate("optimistic data", updateFn);
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
      expect(result.current.isOptimistic).toBe(false);
      expect(result.current.error).toBe("Update failed");
    });
  });

  it("resets state", () => {
    const { result } = renderHook(() => useOptimisticUpdate<string>());

    const updateFn = jest.fn().mockResolvedValue("real data");

    act(() => {
      result.current.performUpdate("optimistic data", updateFn);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isOptimistic).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles multiple sequential updates", async () => {
    const { result } = renderHook(() => useOptimisticUpdate<number>());

    const updateFn1 = jest.fn().mockResolvedValue(1);
    const updateFn2 = jest.fn().mockResolvedValue(2);

    await act(async () => {
      await result.current.performUpdate(100, updateFn1);
    });

    await waitFor(() => {
      expect(result.current.data).toBe(1);
    });

    await act(async () => {
      await result.current.performUpdate(200, updateFn2);
    });

    await waitFor(() => {
      expect(result.current.data).toBe(2);
    });
  });
});

