import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  reset: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotal = 0,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotal);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      setPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
    setTotalItems(initialTotal);
  }, [initialPage, initialPageSize, initialTotal]);

  return {
    page,
    pageSize,
    totalPages,
    offset,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    setTotalItems,
    reset,
  };
}

