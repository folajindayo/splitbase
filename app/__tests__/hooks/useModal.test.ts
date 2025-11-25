import { renderHook, act } from "@testing-library/react";

import { useModal } from "@/hooks/useModal";

describe("useModal", () => {
  it("initializes with default closed state", () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("initializes with custom state", () => {
    const { result } = renderHook(() => useModal(true));

    expect(result.current.isOpen).toBe(true);
  });

  it("opens modal", () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("opens modal with data", () => {
    const { result } = renderHook(() => useModal());

    const testData = { id: 1, name: "Test" };

    act(() => {
      result.current.openModal(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual(testData);
  });

  it("closes modal and clears data", () => {
    const { result } = renderHook(() => useModal(true));

    act(() => {
      result.current.setData({ test: "data" });
    });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("toggles modal state", () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.toggleModal();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleModal();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("sets data independently", () => {
    const { result } = renderHook(() => useModal());

    const testData = { message: "Hello" };

    act(() => {
      result.current.setData(testData);
    });

    expect(result.current.data).toEqual(testData);
  });
});

