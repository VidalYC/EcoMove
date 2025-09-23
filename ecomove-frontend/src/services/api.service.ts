export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginData {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  documento: string;
  telefono: string;
  password: string;
}

export interface User {
  id: string;
  nombre: string;
  correo: string;
  documento: string;
  telefono: string;
  role: 'user' | 'admin';
  estado: 'active' | 'inactive';
  createdAt?: string;
  registrationDate?: string;
  fechaRegistro?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  currentOccupancy: number;
  availableVehicles: number;
  distance?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  type: 'bicycle' | 'electric-scooter';
  model: string;
  stationId: string | null;
  status: 'available' | 'in-use' | 'maintenance';
  batteryLevel?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: string;
  endTime?: string;
  originStationId: string;
  destinationStationId?: string;
  totalCost: number;
  status: 'active' | 'completed' | 'cancelled';
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanRequest {
  vehicleId: string;
  originStationId: string;
}

export interface CompleteLoanRequest {
  destinationStationId: string;
}

import { config } from '../config/environment';

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = config.API_BASE_URL) {
    // Asegurar que la baseUrl no termine con /api/v1
    this.baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    this.token = localStorage.getItem('ecomove_token');
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Construir la URL correctamente - el endpoint ya incluye /api/v1
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Si es error 401, limpiar token inválido
        if (response.status === 401) {
          this.setToken(null);
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('💥 API request error:', error);
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ecomove_token', token);
    } else {
      localStorage.removeItem('ecomove_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // ============ AUTH METHODS ============
  async login(credentials: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/v1/users/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    console.log('📤 API Service - Enviando datos:', userData);
    
    const response = await this.request<AuthResponse>('/api/v1/users/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    
    console.log('📥 API Service - Respuesta:', response);
    
    if (response.success && response.data?.token) {
        this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    // Si hay endpoint de logout en el backend
    try {
      await this.request('/api/v1/users/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint failed, clearing token locally');
    } finally {
      this.setToken(null);
    }
  }

  // ============ USER METHODS ============
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/v1/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.request('/api/v1/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============ ADMIN USER METHODS ============
  async getAdminUserStats(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/users/admin/stats');
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin?page=${page}&limit=${limit}`);
  }

  async searchUsers(term: string, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin/search?term=${encodeURIComponent(term)}&page=${page}&limit=${limit}`);
  }

  async getUserById(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin/${id}`);
  }

  async activateUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin/${id}/activate`, {
      method: 'PUT'
    });
  }

  async deactivateUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin/${id}/deactivate`, {
      method: 'PUT'
    });
  }

  async updateUserById(id: number, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // ============ STATION METHODS ============
  async getStations(): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>('/api/v1/stations');
  }

  async getStation(id: string): Promise<ApiResponse<Station>> {
    return this.request<Station>(`/api/v1/stations/${id}`);
  }

  async getStationAvailability(id: string): Promise<ApiResponse<{ available: Vehicle[] }>> {
    return this.request<{ available: Vehicle[] }>(`/api/v1/stations/${id}/availability`);
  }

  async getNearbyStations(lat: number, lng: number, radius = 1000): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>(`/api/v1/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getStationsWithTransports(): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>('/api/v1/stations/with-transports');
  }

  async getStationStats(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/stations/stats');
  }

  // ============ VEHICLE/TRANSPORT METHODS ============
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.request<Vehicle[]>('/api/v1/transports');
  }

  async getAvailableVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.request<Vehicle[]>('/api/v1/transports/available');
  }

  async getVehicle(id: string): Promise<ApiResponse<Vehicle>> {
    return this.request<Vehicle>(`/api/v1/transports/${id}`);
  }

  async getTransportStats(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/transports/stats');
  }

  // ============ LOAN METHODS ============
  async getLoans(): Promise<ApiResponse<Loan[]>> {
    return this.request<Loan[]>('/api/v1/loans');
  }

  async getLoan(id: string): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/api/v1/loans/${id}`);
  }

  async getLoanDetails(id: string): Promise<ApiResponse<Loan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }>> {
    return this.request<Loan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }>(`/api/v1/loans/${id}/detalles`);
  }

  async createLoan(request: CreateLoanRequest): Promise<ApiResponse<Loan>> {
    return this.request<Loan>('/api/v1/loans', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async completeLoan(id: string, request: CompleteLoanRequest): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/api/v1/loans/${id}/completar`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async cancelLoan(id: string): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/api/v1/loans/${id}/cancelar`, {
      method: 'PUT',
    });
  }

  async extendLoan(id: string, additionalMinutes: number): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/api/v1/loans/${id}/extender`, {
      method: 'PUT',
      body: JSON.stringify({ additionalMinutes }),
    });
  }

  async calculateFare(vehicleId: string, durationMinutes: number): Promise<ApiResponse<{ fare: number; breakdown: any }>> {
    return this.request<{ fare: number; breakdown: any }>('/api/v1/loans/calcular-tarifa', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        durationMinutes
      })
    });
  }

  // ============ ADMIN LOAN METHODS ============
  async getAdminLoanStats(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/loans/admin/estadisticas');
  }

  async getActiveLoansByAdmin(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/loans/admin/activos');
  }

  async getPeriodReport(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/loans/admin/reporte?startDate=${startDate}&endDate=${endDate}`);
  }

  // ============ USER LOAN HISTORY ============
  async getUserLoanHistory(userId: string): Promise<ApiResponse<Loan[]>> {
    return this.request<Loan[]>(`/api/v1/loans/usuario/${userId}`);
  }

  // ============ HEALTH CHECK METHODS ============
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/health');
  }

  async getUsersHealthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/users/health');
  }

  async getStationsHealthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/stations/health');
  }

  async getTransportsHealthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/transports/health');
  }

  async getLoansHealthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/loans/health');
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();