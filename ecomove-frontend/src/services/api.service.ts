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

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = config.API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('ecomove_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
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

  // ============ AUTH METHODS ============
  async login(credentials: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/users/auth/login', {
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
    
    const response = await this.request<AuthResponse>('/users/auth/register', {
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
      await this.request('/users/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint failed, clearing token locally');
    } finally {
      this.setToken(null);
    }
  }

  // ============ USER METHODS ============
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  

  // ============ STATION METHODS ============
  async getStations(): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>('/stations');
  }

  async getStation(id: string): Promise<ApiResponse<Station>> {
    return this.request<Station>(`/stations/${id}`);
  }

  async getStationAvailability(id: string): Promise<ApiResponse<{ available: Vehicle[] }>> {
    return this.request<{ available: Vehicle[] }>(`/stations/${id}/availability`);
  }

  async getNearbyStations(lat: number, lng: number, radius = 1000): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>(`/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getStationsWithTransports(): Promise<ApiResponse<Station[]>> {
    return this.request<Station[]>('/stations/with-transports');
  }

  // ============ VEHICLE METHODS ============
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.request<Vehicle[]>('/transports');
  }

  async getAvailableVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.request<Vehicle[]>('/transports/available');
  }

  async getVehicle(id: string): Promise<ApiResponse<Vehicle>> {
    return this.request<Vehicle>(`/transports/${id}`);
  }

  // ============ LOAN METHODS ============
  async getLoans(): Promise<ApiResponse<Loan[]>> {
    return this.request<Loan[]>('/loans');
  }

  async getLoan(id: string): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/loans/${id}`);
  }

  async getLoanDetails(id: string): Promise<ApiResponse<Loan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }>> {
    return this.request(`/loans/${id}/detalles`);
  }

  async createLoan(data: CreateLoanRequest): Promise<ApiResponse<Loan>> {
    return this.request<Loan>('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeLoan(id: string, data: CompleteLoanRequest): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/loans/${id}/completar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelLoan(id: string): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/loans/${id}/cancelar`, {
      method: 'PUT',
    });
  }

  async extendLoan(id: string, data: { newDurationMinutes: number }): Promise<ApiResponse<Loan>> {
    return this.request<Loan>(`/loans/${id}/extender`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async calculateFare(data: { vehicleType: string; durationMinutes: number }): Promise<ApiResponse<{ fare: number; breakdown: any }>> {
    return this.request('/loans/calcular-tarifa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ ADMIN METHODS ============
  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.request('/loans/admin/estadisticas');
  }

  async getAdminReport(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.request(`/loans/admin/reporte?startDate=${startDate}&endDate=${endDate}`);
  }

  async getActiveLoansAdmin(): Promise<ApiResponse<Loan[]>> {
    return this.request<Loan[]>('/loans/admin/activos');
  }

  // ============ HEALTH CHECK ============
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;