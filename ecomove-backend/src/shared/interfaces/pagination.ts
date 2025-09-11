export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}