// 🔧 HTTP STATION REPOSITORY
import { StationRepository, FindNearbyOptions, QueryOptions } from '../../core/repositories';
import { Station } from '../../core/entities/Station';
import { ID, PaginatedResponse } from '../../shared/types';
import { ApiClient } from '../http/ApiClient';
import { API_ENDPOINTS } from '../../shared/constants';

export class HttpStationRepository implements StationRepository {
  constructor(private apiClient: ApiClient) {}

  async findById(id: ID): Promise<Station | null> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.STATIONS.BY_ID(id));
      return Station.fromApi(response.data);
    } catch (error: any) {
      if (error.code === 'HTTP_404') {
        return null;
      }
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResponse<Station>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await this.apiClient.get(`${API_ENDPOINTS.STATIONS.LIST}?${params.toString()}`);
    
    return {
      data: response.data.data.map((stationData: any) => Station.fromApi(stationData)),
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
    };
  }

  async findNearby(options: FindNearbyOptions): Promise<Station[]> {
    const params = new URLSearchParams({
      latitude: options.center.getLatitude().toString(),
      longitude: options.center.getLongitude().toString(),
      radius: options.radiusKm.toString(),
    });

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const response = await this.apiClient.get(`${API_ENDPOINTS.STATIONS.NEARBY}?${params.toString()}`);
    return response.data.map((stationData: any) => Station.fromApi(stationData));
  }

  async findWithAvailableTransports(): Promise<Station[]> {
    const response = await this.apiClient.get('/api/v1/stations/with-transports');
    return response.data.map((stationData: any) => Station.fromApi(stationData));
  }

  async findWithAvailableSpace(): Promise<Station[]> {
    const response = await this.apiClient.get('/api/v1/stations/with-space');
    return response.data.map((stationData: any) => Station.fromApi(stationData));
  }

  async updateTransportCount(id: ID, count: number): Promise<Station> {
    const response = await this.apiClient.patch(API_ENDPOINTS.STATIONS.BY_ID(id), {
      currentTransports: count,
    });
    return Station.fromApi(response.data);
  }
}