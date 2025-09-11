export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}