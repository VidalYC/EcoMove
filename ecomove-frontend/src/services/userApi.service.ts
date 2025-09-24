import { CreateLoanData, loanApiService, LoanWithDetails } from './loanApi.service';
import { stationApiService, StationWithStats } from './stationApi.service';

// ============ INTERFACES ============

export interface UserStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalSpent: number;
  averageDuration: number;
  favoriteStations: StationWithStats[];
  thisMonth: {
    loans: number;
    spent: number;
    duration: number;
  };
}

export interface QuickStats {
  activeLoans: number;
  availableVehicles: number;
  nearbyStations: number;
  totalSpent: number;
}

export interface UserLoan {
  id: string;
  transportId: string;
  transportType: string;
  transportModel: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled';
  cost: number;
  duration?: number;
  originStation: {
    id: string;
    name: string;
  };
  destinationStation?: {
    id: string;
    name: string;
  };
}

// ============ USER API SERVICE ============

class UserApiService {

  // ============ USER STATS ============

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const [loansResponse, stationsResponse] = await Promise.all([
        loanApiService.getLoanSummaryForUser(),
        stationApiService.getActiveStations()
      ]);

      // Calcular estadísticas básicas
      const { activeLoan, recentLoans, totalLoans, totalSpent, averageDuration } = loansResponse;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthLoans = recentLoans.filter(loan => 
        new Date(loan.fecha_inicio) >= startOfMonth
      );
      
      const thisMonthSpent = thisMonthLoans.reduce((sum, loan) => 
        sum + (loan.costo_total || 0), 0
      );
      
      const thisMonthDuration = thisMonthLoans.reduce((sum, loan) => 
        sum + (loan.duracion_real || 0), 0
      );

      const activeLoans = activeLoan ? 1 : 0;
      const completedLoans = recentLoans.filter(loan => loan.estado === 'completed').length;

      // Estaciones favoritas (limitado a las primeras 3)
      const favoriteStations: StationWithStats[] = stationsResponse.success && stationsResponse.data 
        ? (stationsResponse.data || []).slice(0, 3) : [];

      return {
        totalLoans,
        activeLoans,
        completedLoans,
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
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const response = await loanApiService.getUserLoanHistory(userId, 1, 20);
    if (response.success && response.data) {
      return response.data.prestamos.map((loan: LoanWithDetails) => this.mapLoanToUserLoan(loan));
    }
    throw new Error(response.message || 'Error al obtener préstamos');
  }

  /**
   * Obtener préstamo activo actual
   */
  async getCurrentLoan(): Promise<UserLoan | null> {
    try {
      const response = await loanApiService.getCurrentUserActiveLoan();
      console.log('🔍 Response structure:', response);
    if (response.data) {
      console.log('🔍 Data structure:', response.data);
      console.log('🔍 Data keys:', Object.keys(response.data));
      
      // Verificar específicamente el campo que está causando problemas
      if (response.data.usuario_documento) {
        console.log('🔍 usuario_documento:', response.data.usuario_documento, typeof response.data.usuario_documento);
      }
    }
      if (response.success && response.data) {
        return this.mapLoanToUserLoan(response.data);
      }
      return null;
    } catch (error) {
      console.error('Error getting current loan:', error);
      return null;
    }
  }

  /**
   * Crear nuevo préstamo
   */
  // En userApi.service.ts
async createLoan(vehicleId: string, stationId: string): Promise<UserLoan | null> {
  try {
    console.log('🔍 UserApi createLoan called with:', { vehicleId, stationId });
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    const loanData: CreateLoanData = {
      usuario_id: userId,
      transporte_id: parseInt(vehicleId),
      estacion_origen_id: parseInt(stationId), // Usar stationId aquí
      metodo_pago: 'credit_card',
      duracion_estimada: 60
    };

    console.log('🔍 Parsed IDs:', {
    vehicleId: vehicleId,
    stationId: stationId,
    parsedVehicleId: parseInt(vehicleId),
    parsedStationId: parseInt(stationId),
    isVehicleIdNaN: isNaN(parseInt(vehicleId)),
    isStationIdNaN: isNaN(parseInt(stationId))
  })
    
    console.log('🔍 Mapped loan data:', loanData);
    
    const response = await loanApiService.createLoan(loanData);
    
    if (response.success && response.data) {
      return this.mapLoanToUserLoan(response.data);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error creating loan:', error);
    throw error;
  }
}

  /**
   * Completar préstamo
   */
  async completeLoan(loanId: string, destinationStationId: string): Promise<UserLoan> {
    const response = await loanApiService.completeLoan(parseInt(loanId), {
      estacion_destino_id: parseInt(destinationStationId)
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
    const response = await loanApiService.cancelLoan(parseInt(loanId));
    if (!response.success) {
      throw new Error(response.message || 'Error al cancelar préstamo');
    }
  }

  /**
   * Extender préstamo
   */
  async extendLoan(loanId: string, additionalMinutes: number): Promise<UserLoan> {
    const response = await loanApiService.extendLoan(parseInt(loanId), {
      minutos_adicionales: additionalMinutes
    });
    if (response.success && response.data) {
      return this.mapLoanToUserLoan(response.data);
    }
    throw new Error(response.message || 'Error al extender préstamo');
  }

  // ============ STATIONS AND VEHICLES ============
  
  /**
   * Obtener estaciones cercanas
   */
  async getNearbyStations(lat?: number, lng?: number): Promise<StationWithStats[]> {
    try {
      if (lat && lng) {
        const response = await stationApiService.getNearbyStations(lat, lng, 5);
        return response.success && response.data ? response.data.estaciones_cercanas : [];
      } else {
        const response = await stationApiService.getActiveStations();
        return response.success && response.data ? response.data.slice(0, 10) : [];
      }
    } catch (error) {
      console.error('Error getting nearby stations:', error);
      return [];
    }
  }

  // ============ MÉTODOS DE UTILIDAD ============

  /**
   * Obtener ID del usuario actual
   */
  private getCurrentUserId(): number | null {
    try {
      // Buscar con la clave correcta 'ecomove_user'
      const userString = localStorage.getItem('ecomove_user');
      console.log('🔍 Raw user string from localStorage:', userString);
      
      if (!userString) {
        console.log('❌ No user data in localStorage');
        return null;
      }
      
      const user = JSON.parse(userString);
      console.log('🔍 Parsed user object:', user);
      console.log('🔍 User ID:', user.id, typeof user.id);
      
      return user.id || null;
    } catch (error) {
      console.error('Error obteniendo user ID:', error);
      return null;
    }
  }

  /**
   * Mapear LoanWithDetails a UserLoan
   */
  private mapLoanToUserLoan(loan: LoanWithDetails): UserLoan {
    // Helper function para convertir de forma segura a string
    const safeToString = (value: any, fallback: string = '0'): string => {
      return (value !== undefined && value !== null) ? value.toString() : fallback;
    };

    // Mapear estado
    let status: 'active' | 'completed' | 'cancelled';
    if (loan.estado === 'overdue') {
      status = 'active';
    } else {
      status = loan.estado as 'active' | 'completed' | 'cancelled';
    }

    return {
      id: safeToString(loan.id),
      transportId: safeToString(loan.transporte_id),
      transportType: loan.transporte_tipo || 'unknown',
      transportModel: loan.transporte_modelo || 'unknown',
      startDate: loan.fecha_inicio || new Date().toISOString(),
      endDate: loan.fecha_fin || undefined,
      status,
      cost: loan.costo_total || 0,
      duration: loan.duracion_real || undefined,
      originStation: {
        id: safeToString(loan.estacion_origen_id),
        name: loan.estacion_origen_nombre || 'Estación origen'
      },
      destinationStation: loan.estacion_destino_id ? {
        id: safeToString(loan.estacion_destino_id),
        name: loan.estacion_destino_nombre || 'Estación destino'
      } : undefined
    };
  }

  /**
   * Obtener estadísticas rápidas para dashboard
   */
  async getQuickStats(): Promise<QuickStats> {
    try {
      const [loanSummary, stationsResponse] = await Promise.all([
        loanApiService.getLoanSummaryForUser(),
        stationApiService.getActiveStations()
      ]);

      const activeLoans = loanSummary.activeLoan ? 1 : 0;
      const nearbyStations = stationsResponse.success && stationsResponse.data 
        ? stationsResponse.data.length 
        : 0;

      return {
        activeLoans,
        availableVehicles: 0, // Esto se puede calcular desde transportApi si es necesario
        nearbyStations,
        totalSpent: loanSummary.totalSpent
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return {
        activeLoans: 0,
        availableVehicles: 0,
        nearbyStations: 0,
        totalSpent: 0
      };
    }
  }
}

// Exportar instancia singleton
export const userApiService = new UserApiService();