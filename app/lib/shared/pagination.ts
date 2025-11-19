export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function paginate<T>(
  data: T[],
  page: number = 1,
  limit: number = 10
): PaginationResult<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 10
): PaginationParams {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);

  return {
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, limit)), // Max 100 per page
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

