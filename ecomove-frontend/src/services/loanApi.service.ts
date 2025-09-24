// src/services/loanApi.service.ts
import { apiService, ApiResponse } from './api.service';

// ============ INTERFACES ============

export interface Loan {
  id: number;
  codigo_prestamo: string;
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  estacion_destino_id?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  duracion_estimada?: number;
  duracion_real?: number;
  costo_total?: number;
  costo_adicional?: number;
  estado: 'active' | 'completed' | 'cancelled' | 'overdue';
  metodo_pago?: 'credit_card' | 'debit_card' | 'cash' | 'wallet';
  comentarios?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanWithDetails extends Loan {
  // Información del usuario
  usuario_nombre?: string;
  usuario_correo?: string;
  usuario_documento?: string;
  // Información del transporte
  transporte_tipo?: string;
  transporte_modelo?: string;
  transporte_codigo?: string;
  // Información de estaciones
  estacion_origen_nombre?: string;
  estacion_destino_nombre?: string;
}

export interface CreateLoanData {
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  metodo_pago?: 'credit_card' | 'debit_card' | 'cash' | 'wallet';
  duracion_estimada?: number; // en minutos
}

export interface CompleteLoanData {
  estacion_destino_id: number;
  comentarios?: string;
}

export interface ExtendLoanData {
  minutos_adicionales: number;
  metodo_pago?: 'credit_card' | 'debit_card' | 'cash' | 'wallet';
}

export interface LoanFilters {
  estado?: 'active' | 'completed' | 'cancelled' | 'overdue';
  usuario_id?: number;
  transporte_id?: number;
  estacion_origen_id?: number;
  estacion_destino_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  pagina?: number;
  limite?: number;
}

export interface UserLoanHistory {
  prestamos: LoanWithDetails[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
  estadisticas_usuario: {
    total_prestamos: number;
    tiempo_total_uso: number; // en minutos
    gasto_total: number;
    transporte_favorito: string;
  };
}

export interface LoanStats {
  total_prestamos: number;
  prestamos_activos: number;
  prestamos_completados: number;
  prestamos_cancelados: number;
  prestamos_vencidos: number;
  ingresos_totales: number;
  duracion_promedio: number; // en minutos
  transporte_mas_usado: string;
  estacion_mas_activa: string;
}

export interface FareCalculation {
  transporte_id: number;
  tipo_transporte: string;
  modelo_transporte: string;
  tarifa_base: number;
  duracion_minutos: number;
  costo_estimado: number;
  costo_por_minuto: number;
  descuentos_aplicados: number;
  costo_final: number;
}

export interface PeriodReport {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  resumen: {
    total_prestamos: number;
    ingresos_totales: number;
    duracion_total: number;
    usuarios_activos: number;
  };
  prestamos_por_dia: {
    [fecha: string]: {
      prestamos: number;
      ingresos: number;
    };
  };
  transportes_mas_usados: {
    tipo_transporte: string;
    modelo_transporte: string;
    total_prestamos: number;
    ingresos_generados: number;
  }[];
  estaciones_mas_activas: {
    nombre_estacion: string;
    total_prestamos: number;
    prestamos_origen: number;
    prestamos_destino: number;
  }[];
}

export interface PaginatedLoans {
  prestamos: LoanWithDetails[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
  limite: number;
}

// ============ LOAN API SERVICE ============

class LoanApiService {
  private readonly baseUrl = '/api/v1/loans'; // CORREGIDO: era '/api/v1/prestamos'

  // ========== GESTIÓN DE PRÉSTAMOS DE USUARIO ==========

  /**
   * Crear nuevo préstamo
   */
  async createLoan(data: CreateLoanData): Promise<ApiResponse<LoanWithDetails>> {
    // AGREGAR ESTAS LÍNEAS AL INICIO:
    console.log('🔍 Creating loan with data:', data);
    console.log('🔍 Data types:', {
      transporte_id: typeof data.transporte_id,
      estacion_origen_id: typeof data.estacion_origen_id,
      metodo_pago: typeof data.metodo_pago,
      duracion_estimada: typeof data.duracion_estimada
    });
    
    return apiService.post<LoanWithDetails>(this.baseUrl, data);
  }

  /**
   * Completar préstamo activo
   */
  async completeLoan(loanId: number, data: CompleteLoanData): Promise<ApiResponse<LoanWithDetails>> {
    return apiService.patch<LoanWithDetails>(`${this.baseUrl}/${loanId}/completar`, data);
  }

  /**
   * Cancelar préstamo
   */
  async cancelLoan(loanId: number): Promise<ApiResponse<{ message: string }>> {
    return apiService.patch<{ message: string }>(`${this.baseUrl}/${loanId}/cancelar`, {});
  }

  /**
   * Extender préstamo activo
   */
  async extendLoan(loanId: number, data: ExtendLoanData): Promise<ApiResponse<LoanWithDetails>> {
    return apiService.patch<LoanWithDetails>(`${this.baseUrl}/${loanId}/extender`, data);
  }

  // ========== CONSULTAS DE PRÉSTAMOS ==========

  /**
   * Obtener préstamo por ID
   */
  async getLoanById(loanId: number): Promise<ApiResponse<LoanWithDetails>> {
    return apiService.get<LoanWithDetails>(`${this.baseUrl}/${loanId}`);
  }

  /**
   * Obtener todos los préstamos con filtros
   */
  async getLoans(filters?: LoanFilters): Promise<ApiResponse<PaginatedLoans>> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id.toString());
    if (filters?.transporte_id) params.append('transporte_id', filters.transporte_id.toString());
    if (filters?.estacion_origen_id) params.append('estacion_origen_id', filters.estacion_origen_id.toString());
    if (filters?.estacion_destino_id) params.append('estacion_destino_id', filters.estacion_destino_id.toString());
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.pagina) params.append('pagina', filters.pagina.toString());
    if (filters?.limite) params.append('limite', filters.limite.toString());

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    return apiService.get<PaginatedLoans>(url);
  }

  /**
   * Obtener préstamos activos
   */
  async getActiveLoans(pagina = 1, limite = 20): Promise<ApiResponse<PaginatedLoans>> {
    return this.getLoans({ estado: 'active', pagina, limite });
  }

  /**
   * Obtener historial de préstamos de un usuario
   */
  async getUserLoanHistory(
    usuarioId: number,
    pagina = 1,
    limite = 10
  ): Promise<ApiResponse<UserLoanHistory>> {
    return apiService.get<UserLoanHistory>(
      `${this.baseUrl}/usuario/${usuarioId}?pagina=${pagina}&limite=${limite}`
    );
  }

  /**
   * Obtener préstamo activo del usuario actual
   */
  async getCurrentUserActiveLoan(): Promise<ApiResponse<LoanWithDetails | null>> {
  try {
    const response = await apiService.get<any>('/api/v1/loans/usuario/actual', { limite: 1 });
    
    if (response.success && response.data?.prestamos?.length > 0) {
      // Buscar préstamo activo en los resultados
      const activeLoan = response.data.prestamos.find((loan: any) => 
        loan.estado === 'active' || loan.estado === 'extended'
      );
      
      return {
        success: true,
        message: activeLoan ? 'Préstamo activo encontrado' : 'No hay préstamos activos',
        data: activeLoan || null
      };
    }
    
    return {
      success: true, // ✅ Cambiar a true porque no tener préstamos activos no es un error
      message: 'No hay préstamos activos',
      data: null
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al obtener préstamo activo',
      data: null
    };
  }
}
  // ========== CÁLCULOS Y TARIFAS ==========

  /**
   * Calcular tarifa de préstamo
   */
  async calculateFare(
    transporteId: number,
    duracionMinutos: number
  ): Promise<ApiResponse<FareCalculation>> {
    return apiService.post<FareCalculation>(`${this.baseUrl}/calcular-tarifa`, {
      transporte_id: transporteId,
      duracion_minutos: duracionMinutos
    });
  }

  /**
   * Estimar costo de préstamo antes de crearlo
   */
  async estimateLoanCost(
    transporteId: number,
    duracionEstimadaMinutos: number = 60
  ): Promise<ApiResponse<{
    costo_estimado: number;
    tarifa_por_hora: number;
    duracion_estimada: number;
    transporte_info: {
      tipo: string;
      modelo: string;
      codigo: string;
    };
  }>> {
    const response = await this.calculateFare(transporteId, duracionEstimadaMinutos);
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          costo_estimado: response.data.costo_final,
          tarifa_por_hora: response.data.tarifa_base,
          duracion_estimada: duracionEstimadaMinutos,
          transporte_info: {
            tipo: response.data.tipo_transporte,
            modelo: response.data.modelo_transporte,
            codigo: `${response.data.tipo_transporte}-${response.data.transporte_id}`
          }
        },
        message: response.message
      };
    }
    return response as any;
  }

  // ========== ESTADÍSTICAS Y REPORTES (ADMIN) ==========

  /**
   * Obtener estadísticas generales de préstamos
   */
  async getLoanStats(): Promise<ApiResponse<LoanStats>> {
    return apiService.get<LoanStats>(`${this.baseUrl}/admin/estadisticas`);
  }

  /**
   * Obtener reporte de período
   */
  async getPeriodReport(
    fechaInicio: string,
    fechaFin: string
  ): Promise<ApiResponse<PeriodReport>> {
    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
    return apiService.get<PeriodReport>(`${this.baseUrl}/admin/reporte?${params}`);
  }

  /**
   * Obtener préstamos vencidos
   */
  async getOverdueLoans(pagina = 1, limite = 20): Promise<ApiResponse<PaginatedLoans>> {
    return this.getLoans({ estado: 'overdue', pagina, limite });
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Verificar si un usuario tiene préstamos activos
   */
  async userHasActiveLoan(usuarioId?: number): Promise<boolean> {
    try {
      if (usuarioId) {
        const response = await this.getLoans({ 
          usuario_id: usuarioId, 
          estado: 'active', 
          limite: 1 
        });
        return response.success && (response.data?.total || 0) > 0;
      } else {
        // Para usuario actual
        const response = await this.getCurrentUserActiveLoan();
        return response.success && response.data !== null;
      }
    } catch {
      return false;
    }
  }

  /**
   * Verificar si un transporte está en préstamo
   */
  async isTransportInUse(transporteId: number): Promise<boolean> {
    try {
      const response = await this.getLoans({ 
        transporte_id: transporteId, 
        estado: 'active', 
        limite: 1 
      });
      return response.success && (response.data?.total || 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtener duración de préstamo activo
   */
  async getActiveLoanDuration(loanId: number): Promise<number> {
    try {
      const response = await this.getLoanById(loanId);
      if (response.success && response.data?.fecha_inicio) {
        const startTime = new Date(response.data.fecha_inicio);
        const now = new Date();
        return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)); // en minutos
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Formatear duración en texto legible
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Calcular costo por minuto adicional
   */
  calculateOvertimeCost(baseFare: number, overtimeMinutes: number): number {
    const hourlyRate = baseFare;
    const minuteRate = hourlyRate / 60;
    const overtimeFactor = 1.5; // 50% adicional por tiempo extra
    return overtimeMinutes * minuteRate * overtimeFactor;
  }

  /**
   * Validar datos de creación de préstamo
   */
  validateCreateLoanData(data: CreateLoanData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.transporte_id || data.transporte_id <= 0) {
      errors.push('ID de transporte es requerido');
    }

    if (!data.estacion_origen_id || data.estacion_origen_id <= 0) {
      errors.push('Estación de origen es requerida');
    }

    if (data.duracion_estimada && data.duracion_estimada <= 0) {
      errors.push('Duración estimada debe ser mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtener resumen de préstamo para dashboard
   */
  async getLoanSummaryForUser(usuarioId?: number): Promise<{
    activeLoan: LoanWithDetails | null;
    recentLoans: LoanWithDetails[];
    totalLoans: number;
    totalSpent: number;
    averageDuration: number;
  }> {
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        this.getCurrentUserActiveLoan(),
        apiService.get<any>('/api/v1/loans/usuario/actual?limite=5') // Cambiar tipo a 'any'
      ]);

      let activeLoan: LoanWithDetails | null = null;
      if (activeResponse.success && activeResponse.data) {
        activeLoan = activeResponse.data;
      }

      const historyData = historyResponse.success ? historyResponse.data : null;
      
      // Debug temporal
      console.log('🔍 History data structure:', historyData);
      
      return {
        activeLoan,
        recentLoans: historyData?.prestamos || [],
        // ✅ Corregir: usar la estructura real que devuelve tu backend
        totalLoans: historyData?.total || 0, // En lugar de estadisticas_usuario.total_prestamos
        totalSpent: 0, // Tu backend no devuelve esta info
        averageDuration: 0 // Tu backend no devuelve esta info
      };
    } catch (error) {
      console.error('Error getting loan summary:', error);
      return {
        activeLoan: null,
        recentLoans: [],
        totalLoans: 0,
        totalSpent: 0,
        averageDuration: 0
      };
    }
  }

  /**
   * Generar código QR para préstamo
   */
  generateLoanQRData(loan: LoanWithDetails): string {
    return JSON.stringify({
      type: 'ecomove_loan',
      loanId: loan.id,
      code: loan.codigo_prestamo,
      transportId: loan.transporte_id,
      userId: loan.usuario_id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Parsear datos de QR de préstamo
   */
  parseLoanQRData(qrData: string): {
    isValid: boolean;
    loanId?: number;
    code?: string;
    transportId?: number;
    userId?: number;
  } {
    try {
      const data = JSON.parse(qrData);
      if (data.type === 'ecomove_loan') {
        return {
          isValid: true,
          loanId: data.loanId,
          code: data.code,
          transportId: data.transportId,
          userId: data.userId
        };
      }
      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }
}

// Exportar instancia singleton
export const loanApiService = new LoanApiService();