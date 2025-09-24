// src/services/transportApi.service.ts
import { apiService, ApiResponse } from './api.service';

// ============ INTERFACES ============

export interface Transport {
  id: number;
  codigo: string;
  tipo: 'bicycle' | 'electric_scooter' | 'scooter';
  modelo: string;
  marca?: string;
  estado: 'available' | 'in_use' | 'maintenance' | 'damaged';
  estacion_actual_id?: number;
  tarifa_por_hora: number;
  created_at: string;
  updated_at: string;
  // Campos específicos según tipo
  numero_cambios?: number; // Para bicicletas
  tipo_frenos?: string; // Para bicicletas
  nivel_bateria?: number; // Para scooters eléctricos
  velocidad_maxima?: number; // Para scooters eléctricos
}

export interface CreateTransportData {
  tipo: 'bicycle' | 'electric_scooter' | 'scooter';
  modelo: string;
  marca?: string;
  tarifa_por_hora: number;
  estacion_actual_id?: number;
  // Campos específicos para bicicletas
  numero_cambios?: number;
  tipo_frenos?: string;
  // Campos específicos para scooters eléctricos
  nivel_bateria?: number;
  velocidad_maxima?: number;
}

export interface UpdateTransportData {
  modelo?: string;
  marca?: string;
  estado?: 'available' | 'in_use' | 'maintenance' | 'damaged';
  estacion_actual_id?: number;
  tarifa_por_hora?: number;
  nivel_bateria?: number;
}

export interface TransportFilters {
  tipo?: 'bicycle' | 'electric_scooter' | 'scooter';
  estado?: 'available' | 'in_use' | 'maintenance' | 'damaged';
  estacion_id?: number;
  pagina?: number;
  limite?: number;
}

export interface TransportStats {
  total_transportes: number;
  disponibles: number;
  en_uso: number;
  en_mantenimiento: number;
  dañados: number;
  por_tipo: {
    bicicletas: number;
    scooters_electricos: number;
    scooters: number;
  };
  ingresos_generados: number;
  utilizacion_promedio: number;
}

export interface PaginatedTransports {
  transportes: Transport[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
  limite: number;
}

// ============ TRANSPORT API SERVICE ============

class TransportApiService {
  private readonly baseUrl = '/api/v1/transports'; // CORREGIDO: era '/api/v1/transportes'

  // ========== OBTENER TRANSPORTES ==========

  /**
   * Obtener todos los transportes con filtros opcionales
   */
  async getTransports(filters?: TransportFilters): Promise<ApiResponse<PaginatedTransports>> {
    const params = new URLSearchParams();
    
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.estacion_id) params.append('estacion_id', filters.estacion_id.toString());
    if (filters?.pagina) params.append('pagina', filters.pagina.toString());
    if (filters?.limite) params.append('limite', filters.limite.toString());

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    
    console.log('🌐 Fetching transports from:', url);
    return apiService.get<PaginatedTransports>(url);
  }

  /**
   * Obtener transportes disponibles
   */
  async getAvailableTransports(estacion_id?: number): Promise<ApiResponse<Transport[]>> {
    const filters: TransportFilters = { estado: 'available' };
    if (estacion_id) filters.estacion_id = estacion_id;
    
    const response = await this.getTransports(filters);
    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.transportes
      };
    }
    return {
      success: false,
      message: response.message || 'Error al obtener transportes disponibles',
      data: []
    };
  }

  /**
   * Obtener un transporte por ID
   */
  async getTransportById(id: number): Promise<ApiResponse<Transport>> {
    return apiService.get<Transport>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtener transportes por estación
   */
  async getTransportsByStation(estacionId: number): Promise<ApiResponse<Transport[]>> {
    return apiService.get<Transport[]>(`${this.baseUrl}/estacion/${estacionId}`);
  }

  /**
   * Buscar transportes por código
   */
  async searchTransportByCode(codigo: string): Promise<ApiResponse<Transport>> {
    return apiService.get<Transport>(`${this.baseUrl}/buscar/${codigo}`);
  }

  // ========== CREAR Y ACTUALIZAR ==========

  /**
   * Crear nuevo transporte
   */
  async createTransport(data: CreateTransportData): Promise<ApiResponse<Transport>> {
    return apiService.post<Transport>(this.baseUrl, data);
  }

  /**
   * Actualizar transporte
   */
  async updateTransport(id: number, data: UpdateTransportData): Promise<ApiResponse<Transport>> {
    return apiService.put<Transport>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Cambiar estado del transporte
   */
  async changeTransportStatus(
    id: number, 
    estado: 'available' | 'in_use' | 'maintenance' | 'damaged'
  ): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(`${this.baseUrl}/${id}/estado`, { estado });
  }

  /**
   * Mover transporte a otra estación
   */
  async moveTransportToStation(
    transportId: number, 
    estacionId: number
  ): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(
      `${this.baseUrl}/${transportId}/mover`,
      { estacion_destino_id: estacionId }
    );
  }

  // ========== GESTIÓN ESPECÍFICA ==========

  /**
   * Actualizar nivel de batería (para scooters eléctricos)
   */
  async updateBatteryLevel(id: number, nivel_bateria: number): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(`${this.baseUrl}/${id}/bateria`, { nivel_bateria });
  }

  /**
   * Reportar mantenimiento
   */
  async reportMaintenance(
    id: number, 
    descripcion: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(
      `${this.baseUrl}/${id}/mantenimiento`,
      { descripcion }
    );
  }

  /**
   * Marcar como reparado
   */
  async markAsRepaired(id: number): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(`${this.baseUrl}/${id}/reparado`, {});
  }

  // ========== ESTADÍSTICAS ==========

  /**
   * Obtener estadísticas de transportes
   */
  async getTransportStats(): Promise<ApiResponse<TransportStats>> {
    return apiService.get<TransportStats>(`${this.baseUrl}/estadisticas`);
  }

  /**
   * Obtener transportes más utilizados
   */
  async getMostUsedTransports(limite = 10): Promise<ApiResponse<Transport[]>> {
    return apiService.get<Transport[]>(`${this.baseUrl}/mas-utilizados?limite=${limite}`);
  }

  // ========== ELIMINAR ==========

  /**
   * Eliminar transporte (soft delete)
   */
  async deleteTransport(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Verificar disponibilidad de transporte
   */
  async isTransportAvailable(id: number): Promise<boolean> {
    try {
      const response = await this.getTransportById(id);
      return response.success && response.data?.estado === 'available';
    } catch {
      return false;
    }
  }

  /**
   * Obtener transportes por tipo
   */
  async getTransportsByType(tipo: 'bicycle' | 'electric_scooter' | 'scooter'): Promise<ApiResponse<Transport[]>> {
    const response = await this.getTransports({ tipo });
    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.transportes
      };
    }
    return {
      success: false,
      message: response.message || 'Error al obtener transportes por tipo',
      data: []
    };
  }

  /**
   * Contar transportes disponibles en una estación
   */
  async countAvailableInStation(estacionId: number): Promise<number> {
    try {
      const response = await this.getTransports({
        estado: 'available',
        estacion_id: estacionId
      });
      return response.data?.total || 0;
    } catch {
      return 0;
    }
  }
}

// Exportar instancia singleton
export const transportApiService = new TransportApiService();