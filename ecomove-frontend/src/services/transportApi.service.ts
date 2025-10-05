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
  autonomia?: number; // Para scooters eléctricos
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
  autonomia?: number; // Autonomía en kilómetros (requerido para scooters eléctricos)
}

export interface UpdateTransportData {
  modelo?: string;
  marca?: string;
  estado?: 'available' | 'in_use' | 'maintenance' | 'damaged';
  estacion_actual_id?: number;
  tarifa_por_hora?: number;
  nivel_bateria?: number;
  autonomia?: number;
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
  private readonly baseUrl = '/api/v1/transports';

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
   * CORREGIDO: Usa rutas específicas según el tipo de vehículo
   */
  async createTransport(data: CreateTransportData): Promise<ApiResponse<Transport>> {
    // Seleccionar endpoint según tipo de vehículo
    let endpoint: string;
    
    switch (data.tipo) {
      case 'bicycle':
        endpoint = `${this.baseUrl}/bicycles`;
        break;
      case 'electric_scooter':
        endpoint = `${this.baseUrl}/electric-scooters`;
        break;
      case 'scooter':
        throw new Error('Los scooters normales aún no están implementados en el backend');
      default:
        throw new Error(`Tipo de vehículo no soportado: ${data.tipo}`);
    }
    
    // Transformar datos al formato esperado por el backend
    const payload: any = {
      model: data.modelo,
      brand: data.marca,
      hourlyRate: data.tarifa_por_hora,
      currentStationId: data.estacion_actual_id
    };

    // Agregar campos específicos según el tipo
    if (data.tipo === 'bicycle') {
      payload.gearCount = data.numero_cambios;
      payload.brakeType = data.tipo_frenos;
    } else if (data.tipo === 'electric_scooter') {
      payload.batteryLevel = data.nivel_bateria || 100;
      payload.maxSpeed = data.velocidad_maxima;
      payload.autonomy = data.autonomia || 50; // ← CAMPO CRÍTICO AGREGADO
    }
    
    console.log(`📍 Creando ${data.tipo} en:`, endpoint);
    console.log('📦 Datos enviados:', payload);
    
    return apiService.post<Transport>(endpoint, payload);
  }

  /**
   * Actualizar transporte
   */
  async updateTransport(id: number, data: UpdateTransportData): Promise<ApiResponse<Transport>> {
    // Transformar datos al formato esperado por el backend
    const payload: any = {};
    
    if (data.modelo !== undefined) payload.model = data.modelo;
    if (data.marca !== undefined) payload.brand = data.marca;
    if (data.estado !== undefined) payload.status = data.estado;
    if (data.estacion_actual_id !== undefined) payload.currentStationId = data.estacion_actual_id;
    if (data.tarifa_por_hora !== undefined) payload.hourlyRate = data.tarifa_por_hora;
    if (data.nivel_bateria !== undefined) payload.batteryLevel = data.nivel_bateria;
    if (data.autonomia !== undefined) payload.autonomy = data.autonomia;
    
    console.log('📝 Actualizando transporte:', id);
    console.log('📦 Datos enviados:', payload);
    
    return apiService.put<Transport>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Cambiar estado del transporte
   */
  async changeTransportStatus(
    id: number, 
    estado: 'available' | 'in_use' | 'maintenance' | 'damaged'
  ): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(`${this.baseUrl}/${id}/status`, { estado });
  }

  /**
   * Mover transporte a otra estación
   */
  async moveTransportToStation(
    transportId: number, 
    estacionId: number
  ): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(
      `${this.baseUrl}/${transportId}/move`,
      { estacion_destino_id: estacionId }
    );
  }

  // ========== GESTIÓN ESPECÍFICA ==========

  /**
   * Actualizar nivel de batería (para scooters eléctricos)
   */
  async updateBatteryLevel(id: number, nivel_bateria: number): Promise<ApiResponse<Transport>> {
    return apiService.patch<Transport>(`${this.baseUrl}/${id}/battery`, { nivel_bateria });
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
    return apiService.get<TransportStats>(`${this.baseUrl}/stats`);
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