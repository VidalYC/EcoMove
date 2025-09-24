// src/services/adminApi.service.ts
import { ApiService } from './api.service';

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  newUsersThisMonth: number;
  inactiveUsers: number;
  userGrowth: {
    thisMonth: number;
    percentage: number;
  };
}

export interface PaginatedUsers {
  users: AdminUser[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AdminUser {
  id: number;
  nombre: string;
  correo: string;
  documento: string;
  telefono: string;
  role: 'user' | 'admin';
  estado: 'active' | 'inactive';
  fechaRegistro: string;
}

export interface SystemStats {
  users: AdminUserStats;
  stations: {
    totalStations: number;
    activeStations: number;
    totalCapacity: number;
    currentOccupancy: number;
    occupancyRate: number;
  };
  transports: {
    totalVehicles: number;
    availableVehicles: number;
    inUseVehicles: number;
    maintenanceVehicles: number;
    utilizationRate: number;
  };
  loans: {
    totalLoans: number;
    activeLoans: number;
    completedLoans: number;
    totalRevenue: number;
    averageDuration: number;
  };
}

class AdminApiService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // ============ USER MANAGEMENT ============
  
  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(): Promise<AdminUserStats> {
    const response = await this.apiService.getAdminUserStats();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener estadísticas de usuarios');
  }

  /**
   * Obtener lista paginada de usuarios
   */
  async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
    const response = await this.apiService.getAllUsers(page, limit);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener usuarios');
  }

  /**
   * Buscar usuarios
   */
  async searchUsers(term: string, page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
    const response = await this.apiService.searchUsers(term, page, limit);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al buscar usuarios');
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number): Promise<AdminUser> {
    const response = await this.apiService.getUserById(id);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener usuario');
  }

  /**
   * Activar usuario
   */
  async activateUser(id: number): Promise<void> {
    const response = await this.apiService.activateUser(id);
    if (!response.success) {
      throw new Error(response.message || 'Error al activar usuario');
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(id: number): Promise<void> {
    const response = await this.apiService.deactivateUser(id);
    if (!response.success) {
      throw new Error(response.message || 'Error al desactivar usuario');
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: number, updates: Partial<AdminUser>): Promise<AdminUser> {
    const response = await this.apiService.updateUserById(id, updates);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al actualizar usuario');
  }

  // ============ SYSTEM STATS ============

  /**
   * Obtener estadísticas del sistema completo
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const [userStats, stationStats, transportStats, loanStats] = await Promise.allSettled([
        this.getUserStats(),
        this.getStationStats(),
        this.getTransportStats(),
        this.getLoanStats()
      ]);

      return {
        users: userStats.status === 'fulfilled' ? userStats.value : {
          totalUsers: 0,
          activeUsers: 0,
          admins: 0,
          newUsersThisMonth: 0,
          inactiveUsers: 0,
          userGrowth: { thisMonth: 0, percentage: 0 }
        },
        stations: stationStats.status === 'fulfilled' ? stationStats.value : {
          totalStations: 0,
          activeStations: 0,
          totalCapacity: 0,
          currentOccupancy: 0,
          occupancyRate: 0
        },
        transports: transportStats.status === 'fulfilled' ? transportStats.value : {
          totalVehicles: 0,
          availableVehicles: 0,
          inUseVehicles: 0,
          maintenanceVehicles: 0,
          utilizationRate: 0
        },
        loans: loanStats.status === 'fulfilled' ? loanStats.value : {
          totalLoans: 0,
          activeLoans: 0,
          completedLoans: 0,
          totalRevenue: 0,
          averageDuration: 0
        }
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  // ============ INDIVIDUAL STATS METHODS ============

  private async getStationStats() {
    const response = await this.apiService.getStationStats();
    if (response.success && response.data) {
      return {
        totalStations: response.data.totalStations || 0,
        activeStations: response.data.activeStations || 0,
        totalCapacity: response.data.totalCapacity || 0,
        currentOccupancy: response.data.currentOccupancy || 0,
        occupancyRate: response.data.occupancyRate || 0
      };
    }
    throw new Error('Error al obtener estadísticas de estaciones');
  }

  private async getTransportStats() {
    const response = await this.apiService.getTransportStats();
    if (response.success && response.data) {
      return {
        totalVehicles: response.data.totalVehicles || 0,
        availableVehicles: response.data.availableVehicles || 0,
        inUseVehicles: response.data.inUseVehicles || 0,
        maintenanceVehicles: response.data.maintenanceVehicles || 0,
        utilizationRate: response.data.utilizationRate || 0
      };
    }
    throw new Error('Error al obtener estadísticas de transportes');
  }

  private async getLoanStats() {
    const response = await this.apiService.getAdminLoanStats();
    if (response.success && response.data) {
      return {
        totalLoans: response.data.totalLoans || 0,
        activeLoans: response.data.activeLoans || 0,
        completedLoans: response.data.completedLoans || 0,
        totalRevenue: response.data.totalRevenue || 0,
        averageDuration: response.data.averageDuration || 0
      };
    }
    throw new Error('Error al obtener estadísticas de préstamos');
  }

  // ============ TRANSPORT MANAGEMENT ============
  
  async getTransports(): Promise<any[]> {
    const response = await this.apiService.getVehicles();
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message || 'Error al obtener transportes');
  }

  // ============ STATION MANAGEMENT ============
  
  async getStations(): Promise<any[]> {
    const response = await this.apiService.getStations();
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message || 'Error al obtener estaciones');
  }

  // ============ LOAN MANAGEMENT ============
  
  async getActiveLoans(): Promise<any[]> {
    const response = await this.apiService.getActiveLoansByAdmin();
    if (response.success) {
      return response.data || [];
    }
    throw new Error(response.message || 'Error al obtener préstamos activos');
  }

  async getPeriodReport(startDate: string, endDate: string): Promise<any> {
    const response = await this.apiService.getPeriodReport(startDate, endDate);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener reporte de período');
  }
}

export const adminApiService = new AdminApiService();