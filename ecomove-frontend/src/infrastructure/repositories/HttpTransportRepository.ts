// 🔧 HTTP TRANSPORT REPOSITORY
import { TransportRepository, FindNearbyOptions, QueryOptions } from '../../core/repositories';
import { Transport } from '../../core/entities/Transport';
import { ID, PaginatedResponse } from '../../shared/types';
import { ApiClient } from '../http/ApiClient';
import { API_ENDPOINTS } from '../../shared/constants';

export class HttpTransportRepository implements TransportRepository {
  constructor(private apiClient: ApiClient) {}

  async findById(id: ID): Promise<Transport | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.TRANSPORTS.BY_ID(id));
      return Transport.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<Transport>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await this.apiClient.get(`${API_ENDPOINTS.TRANSPORTS.LIST}?${params.toString()}`);
    
    return {
      data: response.data.data.map((transportData: any) => Transport.fromApi(transportData)),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  }

  async findAvailable(stationId?: ID): Promise<Transport[]> {
    const params = new URLSearchParams();
    if (stationId) params.append('stationId', stationId.toString());

    const response = await this.apiClient.get(`${API_ENDPOINTS.TRANSPORTS.AVAILABLE}?${params.toString()}`);
    return response.data.map((transportData: any) => Transport.fromApi(transportData));
  }

  async findByStation(stationId: ID): Promise<Transport[]> {
    const response = await this.apiClient.get(`/api/v1/stations/${stationId}/transports`);
    return response.data.map((transportData: any) => Transport.fromApi(transportData));
  }

  async updateStatus(id: ID, status: string): Promise<Transport> {
    const response = await this.apiClient.patch(API_ENDPOINTS.TRANSPORTS.BY_ID(id), {
      status,
    });
    return Transport.fromApi(response.data);
  }

  async findNearby(options: FindNearbyOptions): Promise<Transport[]> {
    const params = new URLSearchParams({
      latitude: options.center.getLatitude().toString(),
      longitude: options.center.getLongitude().toString(),
      radius: options.radiusKm.toString(),
    });

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const response = await this.apiClient.get(`/api/v1/transports/nearby?${params.toString()}`);
    return response.data.map((transportData: any) => Transport.fromApi(transportData));
  }
}