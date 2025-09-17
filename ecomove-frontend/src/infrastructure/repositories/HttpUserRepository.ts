// 🔧 HTTP USER REPOSITORY
import { UserRepository } from '../../core/repositories';
import { User, CreateUserData, UpdateUserData } from '../../core/entities/User';
import { ID, PaginatedResponse } from '../../shared/types';
import { ApiClient } from '../http/ApiClient';
import { API_ENDPOINTS } from '../../shared/constants';

export class HttpUserRepository implements UserRepository {
  constructor(private apiClient: ApiClient) {}

  async create(userData: CreateUserData): Promise<User> {
    const response = await this.apiClient.post(API_ENDPOINTS.USERS.PROFILE, userData);
    return User.fromApi(response.data);
  }

  async findById(id: ID): Promise<User | null> {
    try {
      const response = await this.apiClient.get(`/api/v1/users/${id}`);
      return User.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.apiClient.get(`/api/v1/users/email/${email}`);
      return User.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findByDocument(documentNumber: string): Promise<User | null> {
    try {
      const response = await this.apiClient.get(`/api/v1/users/document/${documentNumber}`);
      return User.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async update(id: ID, updates: UpdateUserData): Promise<User> {
    const response = await this.apiClient.put(`/api/v1/users/${id}`, updates);
    return User.fromApi(response.data);
  }

  async delete(id: ID): Promise<void> {
    await this.apiClient.delete(`/api/v1/users/${id}`);
  }

  async findAll(options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await this.apiClient.get(`/api/v1/users?${params.toString()}`);
    
    return {
      data: response.data.data.map((userData: any) => User.fromApi(userData)),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  }
}