// src/services/userApi.service.ts
import { ApiService, Station, Loan } from './api.service';

export interface UserStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalSpent: number;
  averageDuration: number;
  favoriteStations: Station[];
  thisMonth: {
    loans: number;
    spent: number;
    duration: number;
  };
}

export interface UserLoan {
  id: string;
  vehicleId: string;
  vehicleType: 'bicycle' | 'electric-scooter';
  vehicleModel: string;
  startTime: string;
  endTime?: string;
  originStationId: string;
  originStationName: string;
  destinationStationId?: string;
  destinationStationName?: string;
  totalCost: number;
  status: 'active' | 'completed' | 'cancelled';
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickStats {
  nearbyStations: number;
  availableVehicles: number;
  currentLoan?: UserLoan;
  weatherInfo?: {
    temperature: number;
    condition: string;
    recommendation: string;
  };
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

class UserApiService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // ============ UTILITY METHODS ============
  
  /**
   * Convertir Loan del backend a UserLoan para el frontend
   */
  private mapLoanToUserLoan(loan: Loan): UserLoan {
    return {
      id: loan.id,
      vehicleId: loan.vehicleId,
      vehicleType: 'bicycle', // Default, se puede obtener del backend
      vehicleModel: 'Unknown', // Default, se puede obtener del backend
      startTime: loan.startTime,
      endTime: loan.endTime,
      originStationId: loan.originStationId,
      originStationName: 'Station', // Default, se puede obtener del backend
      destinationStationId: loan.destinationStationId,
      destinationStationName: undefined,
      totalCost: loan.totalCost,
      status: loan.status,
      duration: loan.duration,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    };
  }

  // ============ USER PROFILE ============
  
  /**
   * Obtener perfil del usuario actual
   */
  async getProfile() {
    const response = await this.apiService.getProfile();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener perfil');
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(updates: any) {
    const response = await this.apiService.updateProfile(updates);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al actualizar perfil');
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.apiService.changePassword({
      currentPassword,
      newPassword
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Error al cambiar contraseña');
  }

  // ============ USER STATISTICS ============
  
  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(): Promise<UserStats> {
    try {
      // Obtener préstamos del usuario
      const loansResponse = await this.apiService.getLoans();
      const rawLoans = loansResponse.success ? loansResponse.data || [] : [];
      const loans = rawLoans.map((loan: Loan) => this.mapLoanToUserLoan(loan));

      // Calcular estadísticas
      const activeLoans = loans.filter((loan: UserLoan) => loan.status === 'active');
      const completedLoans = loans.filter((loan: UserLoan) => loan.status === 'completed');
      const totalSpent = completedLoans.reduce((sum: number, loan: UserLoan) => sum + loan.totalCost, 0);
      
      // Calcular duración promedio
      const totalDuration = completedLoans
        .filter((loan: UserLoan) => loan.duration)
        .reduce((sum: number, loan: UserLoan) => sum + (loan.duration || 0), 0);
      const averageDuration = completedLoans.length > 0 ? totalDuration / completedLoans.length : 0;

      // Estadísticas del mes actual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthLoans = loans.filter((loan: UserLoan) => {
        const loanDate = new Date(loan.createdAt);
        return loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear;
      });
      
      const thisMonthSpent = thisMonthLoans
        .filter((loan: UserLoan) => loan.status === 'completed')
        .reduce((sum: number, loan: UserLoan) => sum + loan.totalCost, 0);
      
      const thisMonthDuration = thisMonthLoans
        .filter((loan: UserLoan) => loan.duration && loan.status === 'completed')
        .reduce((sum: number, loan: UserLoan) => sum + (loan.duration || 0), 0);

      // Obtener estaciones favoritas (simulado por ahora)
      const stationsResponse = await this.apiService.getStations();
      const favoriteStations = stationsResponse.success ? 
        (stationsResponse.data || []).slice(0, 3) : [];

      return {
        totalLoans: loans.length,
        activeLoans: activeLoans.length,
        completedLoans: completedLoans.length,
        totalSpent,
        averageDuration,
        favoriteStations,
        thisMonth: {
          loans: thisMonthLoans.length,
          spent: thisMonthSpent,
          duration: thisMonthDuration
        }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // ============ USER LOANS ============
  
  /**
   * Obtener historial de préstamos del usuario
   */
  async getUserLoans(): Promise<UserLoan[]> {
    const response = await this.apiService.getLoans();
    if (response.success && response.data) {
      return response.data.map((loan: Loan) => this.mapLoanToUserLoan(loan));
    }
    throw new Error(response.message || 'Error al obtener préstamos');
  }

  /**
   * Obtener préstamo activo actual
   */
  async getCurrentLoan(): Promise<UserLoan | null> {
    try {
      const loans = await this.getUserLoans();
      const activeLoan = loans.find(loan => loan.status === 'active');
      return activeLoan || null;
    } catch (error) {
      console.error('Error getting current loan:', error);
      return null;
    }
  }

  /**
   * Crear nuevo préstamo
   */
  async createLoan(vehicleId: string, originStationId: string): Promise<UserLoan> {
    const response = await this.apiService.createLoan({
      vehicleId,
      originStationId
    });
    if (response.success && response.data) {
      return this.mapLoanToUserLoan(response.data);
    }
    throw new Error(response.message || 'Error al crear préstamo');
  }

  /**
   * Completar préstamo
   */
  async completeLoan(loanId: string, destinationStationId: string): Promise<UserLoan> {
    const response = await this.apiService.completeLoan(loanId, {
      destinationStationId
    });
    if (response.success && response.data) {
      return this.mapLoanToUserLoan(response.data);
    }
    throw new Error(response.message || 'Error al completar préstamo');
  }

  /**
   * Cancelar préstamo
   */
  async cancelLoan(loanId: string): Promise<void> {
    const response = await this.apiService.cancelLoan(loanId);
    if (!response.success) {
      throw new Error(response.message || 'Error al cancelar préstamo');
    }
  }

  /**
   * Extender préstamo
   */
  async extendLoan(loanId: string, additionalMinutes: number): Promise<UserLoan> {
    const response = await this.apiService.extendLoan(loanId, additionalMinutes);
    if (response.success && response.data) {
      return this.mapLoanToUserLoan(response.data);
    }
    throw new Error(response.message || 'Error al extender préstamo');
  }

  // ============ STATIONS AND VEHICLES ============
  
  /**
   * Obtener estaciones cercanas
   */
  async getNearbyStations(lat?: number, lng?: number, radius: number = 1000): Promise<Station[]> {
    let response;
    
    if (lat && lng) {
      response = await this.apiService.getNearbyStations(lat, lng, radius);
    } else {
      response = await this.apiService.getStations();
    }

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener estaciones');
  }

  /**
   * Obtener estaciones con vehículos disponibles
   */
  async getStationsWithVehicles(): Promise<Station[]> {
    const response = await this.apiService.getStationsWithTransports();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener estaciones con vehículos');
  }

  /**
   * Obtener vehículos disponibles en una estación
   */
  async getStationAvailability(stationId: string): Promise<Vehicle[]> {
    const response = await this.apiService.getStationAvailability(stationId);
    if (response.success && response.data) {
      return response.data.available;
    }
    throw new Error(response.message || 'Error al obtener disponibilidad de estación');
  }

  /**
   * Obtener vehículos disponibles
   */
  async getAvailableVehicles(): Promise<Vehicle[]> {
    const response = await this.apiService.getAvailableVehicles();
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener vehículos disponibles');
  }

  /**
   * Calcular tarifa de préstamo
   */
  async calculateFare(vehicleId: string, durationMinutes: number): Promise<{ fare: number; breakdown: any }> {
    const response = await this.apiService.calculateFare(vehicleId, durationMinutes);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al calcular tarifa');
  }

  // ============ QUICK DASHBOARD STATS ============
  
  /**
   * Obtener estadísticas rápidas para el dashboard
   */
  async getQuickStats(userLat?: number, userLng?: number): Promise<QuickStats> {
    try {
      const [stationsData, vehiclesData, currentLoan] = await Promise.allSettled([
        userLat && userLng ? 
          this.getNearbyStations(userLat, userLng, 2000) :
          this.getNearbyStations(),
        this.getAvailableVehicles(),
        this.getCurrentLoan()
      ]);

      const nearbyStations = stationsData.status === 'fulfilled' ? stationsData.value.length : 0;
      const availableVehicles = vehiclesData.status === 'fulfilled' ? vehiclesData.value.length : 0;
      const activeLoan = currentLoan.status === 'fulfilled' ? currentLoan.value || undefined : undefined;

      // Simulación de información del clima
      const weatherInfo = {
        temperature: 24,
        condition: 'sunny',
        recommendation: 'Perfecto para usar bicicleta'
      };

      return {
        nearbyStations,
        availableVehicles,
        currentLoan: activeLoan,
        weatherInfo
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return {
        nearbyStations: 0,
        availableVehicles: 0,
        currentLoan: undefined,
        weatherInfo: undefined
      };
    }
  }

  // ============ ADDITIONAL USER METHODS ============

  /**
   * Obtener detalles de un préstamo específico
   */
  async getLoanDetails(loanId: string): Promise<UserLoan & { vehicle: Vehicle; originStation: Station; destinationStation?: Station }> {
    const response = await this.apiService.getLoanDetails(loanId);
    if (response.success && response.data) {
      const mappedLoan = this.mapLoanToUserLoan(response.data);
      return {
        ...mappedLoan,
        vehicle: response.data.vehicle,
        originStation: response.data.originStation,
        destinationStation: response.data.destinationStation
      };
    }
    throw new Error(response.message || 'Error al obtener detalles del préstamo');
  }

  /**
   * Obtener estación específica por ID
   */
  async getStation(stationId: string): Promise<Station> {
    const response = await this.apiService.getStation(stationId);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener estación');
  }

  /**
   * Obtener vehículo específico por ID
   */
  async getVehicle(vehicleId: string): Promise<Vehicle> {
    const response = await this.apiService.getVehicle(vehicleId);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Error al obtener vehículo');
  }

  /**
   * Buscar estaciones por nombre o dirección
   */
  async searchStations(query: string): Promise<Station[]> {
    try {
      const allStations = await this.getNearbyStations();
      return allStations.filter(station => 
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        station.address.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching stations:', error);
      return [];
    }
  }

  /**
   * Obtener rutas sugeridas entre estaciones
   */
  async getRoute(originStationId: string, destinationStationId: string): Promise<any> {
    try {
      // En una implementación real, esto podría llamar a un servicio de mapas
      // Por ahora, devolvemos datos simulados
      const [originStation, destinationStation] = await Promise.all([
        this.getStation(originStationId),
        this.getStation(destinationStationId)
      ]);

      return {
        origin: originStation,
        destination: destinationStation,
        distance: Math.random() * 5 + 1, // Distancia simulada en km
        duration: Math.random() * 20 + 5, // Duración simulada en minutos
        estimatedCost: Math.random() * 5000 + 2000 // Costo estimado simulado
      };
    } catch (error) {
      console.error('Error getting route:', error);
      throw new Error('Error al calcular ruta');
    }
  }

  /**
   * Obtener recomendaciones personalizadas
   */
  async getRecommendations(): Promise<{
    recommendedStations: Station[];
    recommendedVehicles: Vehicle[];
    tips: string[];
  }> {
    try {
      const [stats, nearbyStations, availableVehicles] = await Promise.allSettled([
        this.getUserStats(),
        this.getNearbyStations(),
        this.getAvailableVehicles()
      ]);

      const userStats = stats.status === 'fulfilled' ? stats.value : null;
      const stations = nearbyStations.status === 'fulfilled' ? nearbyStations.value : [];
      const vehicles = availableVehicles.status === 'fulfilled' ? availableVehicles.value : [];

      // Recomendaciones basadas en estadísticas del usuario
      const tips = [];
      if (userStats) {
        if (userStats.totalLoans === 0) {
          tips.push('¡Bienvenido! Te recomendamos empezar con una bicicleta para tu primer viaje.');
        } else if (userStats.averageDuration > 60) {
          tips.push('Considera usar patinetas eléctricas para viajes largos - son más eficientes.');
        }
        
        if (userStats.thisMonth.loans > 10) {
          tips.push('¡Eres un usuario frecuente! Considera suscribirte a nuestro plan mensual.');
        }
      }

      return {
        recommendedStations: stations.slice(0, 3),
        recommendedVehicles: vehicles.slice(0, 5),
        tips
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return {
        recommendedStations: [],
        recommendedVehicles: [],
        tips: ['Explora las estaciones cercanas para encontrar el vehículo perfecto.']
      };
    }
  }

  /**
   * Reportar problema con vehículo
   */
  async reportVehicleIssue(vehicleId: string, issue: string, description: string): Promise<void> {
    try {
      // En una implementación real, esto enviaría el reporte al backend
      console.log('Reporting vehicle issue:', { vehicleId, issue, description });
      
      // Simulamos una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Podrías implementar esto con un endpoint específico en tu backend
      // const response = await this.apiService.request('/reports/vehicle-issue', {
      //   method: 'POST',
      //   body: JSON.stringify({ vehicleId, issue, description })
      // });
      
    } catch (error) {
      console.error('Error reporting vehicle issue:', error);
      throw new Error('Error al reportar problema con vehículo');
    }
  }

  /**
   * Guardar estación como favorita
   */
  async addFavoriteStation(stationId: string): Promise<void> {
    try {
      // En una implementación real, esto guardaría la estación favorita en el backend
      console.log('Adding favorite station:', stationId);
      
      // Simulamos guardado local por ahora
      const favorites = JSON.parse(localStorage.getItem('favoriteStations') || '[]');
      if (!favorites.includes(stationId)) {
        favorites.push(stationId);
        localStorage.setItem('favoriteStations', JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite station:', error);
      throw new Error('Error al agregar estación favorita');
    }
  }

  /**
   * Remover estación de favoritas
   */
  async removeFavoriteStation(stationId: string): Promise<void> {
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteStations') || '[]');
      const updatedFavorites = favorites.filter((id: string) => id !== stationId);
      localStorage.setItem('favoriteStations', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing favorite station:', error);
      throw new Error('Error al remover estación favorita');
    }
  }

  /**
   * Obtener estaciones favoritas
   */
  async getFavoriteStations(): Promise<Station[]> {
    try {
      const favoriteIds = JSON.parse(localStorage.getItem('favoriteStations') || '[]');
      const allStations = await this.getNearbyStations();
      return allStations.filter(station => favoriteIds.includes(station.id));
    } catch (error) {
      console.error('Error getting favorite stations:', error);
      return [];
    }
  }
}

export const userApiService = new UserApiService();