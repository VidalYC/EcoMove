// src/services/api.service.ts - CORREGIDO
import { config } from '../config/environment';

// ============ INTERFACES ============

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// User interfaces (existentes)
export interface User {
  id: string;
  nombre: string;
  correo: string;
  documento: string;
  telefono: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  password: string;
  documento: string;
  telefono: string;
}

// Station interfaces (existentes)
export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Vehicle interfaces (existentes)
export interface Vehicle {
  id: string;
  type: 'bicycle' | 'electric_scooter';
  model: string;
  isAvailable: boolean;
  batteryLevel?: number;
  currentStationId: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Loan interfaces (existentes)
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

// ============ API SERVICE CLASS ============

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = config.API_BASE_URL) {
    // Asegurar que la baseUrl no termine con /api/v1
    this.baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    this.token = localStorage.getItem('ecomove_token');
  }

  // ========== MÉTODO REQUEST BASE - CORREGIDO ==========
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
      console.log('Token enviado:', this.token.substring(0, 20) + '...');
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
        
        console.error('❌ API Error Details:', errorData);
        if (errorData.errors) {
          console.error('❌ Validation Errors:', errorData.errors);
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data);
      
      return data;
    } catch (error) {
      console.error('❌ Network Error:', error);
      throw error;
    }
  }

  // ========== NUEVOS MÉTODOS HTTP ESPECÍFICOS ==========

  /**
   * Método GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    // Agregar parámetros de query si existen
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      
      if (searchParams.toString()) {
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Método POST
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  /**
   * Método PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PUT',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  /**
   * Método PATCH
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PATCH',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  /**
   * Método DELETE
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ========== GESTIÓN DE TOKEN (existente) ==========
  setToken(token: string | null): void {
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

  // ========== MÉTODOS DE AUTENTICACIÓN (existentes) ==========
  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.post<{ user: User; token: string }>('/api/v1/users/auth/login', credentials);
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.post<{ user: User; token: string }>('/api/v1/users/auth/register', userData);
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  // ========== MÉTODOS DE PERFIL (existentes) ==========
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>('/api/v1/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/api/v1/users/profile', updates);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.put('/api/v1/users/change-password', data);
  }

  // ========== MÉTODOS ADMIN DE USUARIOS (existentes) ==========
  async getAdminUserStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/users/admin/stats');
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    return this.get(`/api/v1/users/admin`, { page, limit });
  }

  async searchUsers(term: string, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    return this.get('/api/v1/users/admin/search', { term, page, limit });
  }

  async getUserById(id: number): Promise<ApiResponse<any>> {
    return this.get(`/api/v1/users/admin/${id}`);
  }

  async activateUser(id: number): Promise<ApiResponse<any>> {
    return this.put(`/api/v1/users/admin/${id}/activate`);
  }

  async deactivateUser(id: number): Promise<ApiResponse<any>> {
    return this.put(`/api/v1/users/admin/${id}/deactivate`);
  }

  async updateUserById(id: number, updates: any): Promise<ApiResponse<any>> {
    return this.put(`/api/v1/users/admin/${id}`, updates);
  }

  // ========== MÉTODOS DE ESTACIONES (existentes - usando nuevos métodos) ==========
  async getStations(): Promise<ApiResponse<Station[]>> {
    return this.get<Station[]>('/api/v1/stations');
  }

  async createStation(station: Omit<Station, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Station>> {
    return this.post<Station>('/api/v1/stations', station);
  }

  async updateStation(id: string, updates: Partial<Station>): Promise<ApiResponse<Station>> {
    return this.put<Station>(`/api/v1/stations/${id}`, updates);
  }

  async deleteStation(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/v1/stations/${id}`);
  }

  async getStationById(id: string): Promise<ApiResponse<Station>> {
    return this.get<Station>(`/api/v1/stations/${id}`);
  }

  // ========== MÉTODOS DE VEHÍCULOS (existentes - usando nuevos métodos) ==========
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return this.get<Vehicle[]>('/api/v1/vehicles');
  }

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    return this.get<Vehicle>(`/api/v1/vehicles/${id}`);
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Vehicle>> {
    return this.post<Vehicle>('/api/v1/vehicles', vehicle);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    return this.put<Vehicle>(`/api/v1/vehicles/${id}`, updates);
  }

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/v1/vehicles/${id}`);
  }

  // ========== MÉTODOS DE PRÉSTAMOS (existentes - usando nuevos métodos) ==========
  async getLoans(): Promise<ApiResponse<Loan[]>> {
    return this.get<Loan[]>('/api/v1/loans');
  }

  async getLoanById(id: string): Promise<ApiResponse<Loan>> {
    return this.get<Loan>(`/api/v1/loans/${id}`);
  }

  async getLoanDetails(id: string): Promise<ApiResponse<Loan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }>> {
    return this.get<Loan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }>(`/api/v1/loans/${id}/detalles`);
  }

  async createLoan(request: CreateLoanRequest): Promise<ApiResponse<Loan>> {
    return this.post<Loan>('/api/v1/loans', request);
  }

  async completeLoan(id: string, request: CompleteLoanRequest): Promise<ApiResponse<Loan>> {
    return this.put<Loan>(`/api/v1/loans/${id}/completar`, request);
  }

  async cancelLoan(id: string): Promise<ApiResponse<Loan>> {
    return this.put<Loan>(`/api/v1/loans/${id}/cancelar`);
  }

  async extendLoan(id: string, additionalMinutes: number): Promise<ApiResponse<Loan>> {
    return this.put<Loan>(`/api/v1/loans/${id}/extender`, { additionalMinutes });
  }

  async calculateFare(vehicleId: string, durationMinutes: number): Promise<ApiResponse<{ fare: number; breakdown: any }>> {
    return this.post<{ fare: number; breakdown: any }>('/api/v1/loans/calcular-tarifa', {
      vehicleId,
      durationMinutes
    });
  }

  // ========== MÉTODOS ADMIN DE PRÉSTAMOS (existentes) ==========
  async getAdminLoanStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/loans/admin/estadisticas');
  }

  async getActiveLoansByAdmin(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/loans/admin/activos');
  }

  async getPeriodReport(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.get(`/api/v1/loans/admin/reporte`, { startDate, endDate });
  }

  // ========== HISTORIAL DE PRÉSTAMOS DE USUARIO (existentes) ==========
  async getUserLoanHistory(userId: string): Promise<ApiResponse<Loan[]>> {
    return this.get<Loan[]>(`/api/v1/loans/usuario/${userId}`);
  }

  // ========== MÉTODOS DE ESTADÍSTICAS ADICIONALES ==========
  
  /**
   * Obtener estadísticas de estaciones
   */
  async getStationStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/estaciones/estadisticas');
  }

  /**
   * Obtener estadísticas de transportes
   */
  async getTransportStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/transportes/estadisticas');
  }

  // ========== MÉTODOS DE HEALTH CHECK (existentes) ==========
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/health');
  }

  async getUsersHealthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/users/health');
  }

  async getStationsHealthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/stations/health');
  }

  async getTransportsHealthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/transports/health');
  }

  async getLoansHealthCheck(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/loans/health');
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();