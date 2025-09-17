// 🔧 HTTP LOAN REPOSITORY
import { LoanRepository, QueryOptions } from '../../core/repositories';
import { Loan, CreateLoanData, CompleteLoanData } from '../../core/entities/Loan';
import { ID, PaginatedResponse } from '../../shared/types';
import { ApiClient } from '../http/ApiClient';
import { API_ENDPOINTS } from '../../shared/constants';

export class HttpLoanRepository implements LoanRepository {
  constructor(private apiClient: ApiClient) {}

  async create(loanData: CreateLoanData): Promise<Loan> {
    const response = await this.apiClient.post(API_ENDPOINTS.LOANS.CREATE, loanData);
    return Loan.fromApi(response.data);
  }

  async findById(id: ID): Promise<Loan | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.LOANS.BY_ID(id));
      return Loan.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findByUser(userId: ID, options: QueryOptions = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams({
      userId: userId.toString(),
    });
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await this.apiClient.get(`${API_ENDPOINTS.LOANS.LIST}?${params.toString()}`);
    
    return {
      data: response.data.data.map((loanData: any) => Loan.fromApi(loanData)),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  }

  async findActiveByUser(userId: ID): Promise<Loan | null> {
    try {
      const response = await this.apiClient.get(`/api/v1/loans/active?userId=${userId}`);
      return response.data ? Loan.fromApi(response.data) : null;
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await this.apiClient.get(`${API_ENDPOINTS.LOANS.LIST}?${params.toString()}`);
    
    return {
      data: response.data.data.map((loanData: any) => Loan.fromApi(loanData)),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  }

  async complete(id: ID, data: CompleteLoanData): Promise<Loan> {
    const response = await this.apiClient.put(API_ENDPOINTS.LOANS.COMPLETE(id), data);
    return Loan.fromApi(response.data);
  }

  async cancel(id: ID): Promise<Loan> {
    const response = await this.apiClient.put(API_ENDPOINTS.LOANS.CANCEL(id), {});
    return Loan.fromApi(response.data);
  }

  async update(id: ID, updates: Partial<Loan>): Promise<Loan> {
    const response = await this.apiClient.patch(API_ENDPOINTS.LOANS.BY_ID(id), updates);
    return Loan.fromApi(response.data);
  }

  async findOverdue(): Promise<Loan[]> {
    const response = await this.apiClient.get('/api/v1/loans/overdue');
    return response.data.map((loanData: any) => Loan.fromApi(loanData));
  }
}