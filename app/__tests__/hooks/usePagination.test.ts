import { renderHook, act } from "@testing-library/react";

import { usePagination } from "@/hooks/usePagination";

describe("usePagination", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.offset).toBe(0);
  });

  it("initializes with custom values", () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 2,
        initialPageSize: 20,
        totalItems: 100,
      })
    );

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.offset).toBe(20);
  });

  it("calculates pagination correctly", () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 100,
        initialPageSize: 10,
      })
    );

    expect(result.current.totalPages).toBe(10);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it("goes to specific page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100 })
    );

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.page).toBe(5);
    expect(result.current.offset).toBe(40);
  });

  it("goes to next page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(2);
  });

  it("goes to previous page", () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 100,
        initialPage: 3,
      })
    );

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.page).toBe(2);
  });

  it("does not go below page 1", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100 })
    );

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.page).toBe(1);
  });

  it("does not go above total pages", () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 100,
        initialPage: 10,
      })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(10);
  });

  it("resets to first page when page size changes", () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 100,
        initialPage: 5,
      })
    );

    act(() => {
      result.current.setPageSize(20);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
  });

  it("updates total items", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50 })
    );

    expect(result.current.totalPages).toBe(5);

    act(() => {
      result.current.setTotalItems(100);
    });

    expect(result.current.totalPages).toBe(10);
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() =>
      usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 100,
      })
    );

    act(() => {
      result.current.goToPage(5);
      result.current.setPageSize(20);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });
});

