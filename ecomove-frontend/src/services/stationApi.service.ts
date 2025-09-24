// src/services/stationApi.service.ts
import { apiService, ApiResponse } from './api.service';

// ============ INTERFACES ============

export interface Station {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  capacidad: number;
  estado: 'active' | 'inactive' | 'maintenance';
  zona: string;
  descripcion?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStationData {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  capacidad: number;
  zona: string;
  descripcion?: string;
  horario_apertura?: string;
  horario_cierre?: string;
}

export interface UpdateStationData {
  nombre?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  estado?: 'active' | 'inactive' | 'maintenance';
  zona?: string;
  descripcion?: string;
  horario_apertura?: string;
  horario_cierre?: string;
}

export interface StationFilters {
  estado?: 'active' | 'inactive' | 'maintenance';
  zona?: string;
  cerca_de?: {
    latitud: number;
    longitud: number;
    radio_km?: number;
  };
  pagina?: number;
  limite?: number;
}

export interface StationWithStats {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  capacidad: number;
  estado: 'active' | 'inactive' | 'maintenance';
  zona: string;
  descripcion?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  created_at: string;
  updated_at: string;
  // Estadísticas adicionales
  transportes_disponibles: number;
  transportes_totales: number;
  ocupacion_porcentaje: number;
  prestamos_origen: number;
  prestamos_destino: number;
  distancia_km?: number; // Solo cuando se busca por ubicación
}

export interface StationStats {
  total_estaciones: number;
  activas: number;
  inactivas: number;
  en_mantenimiento: number;
  capacidad_total: number;
  ocupacion_promedio: number;
  por_zona: {
    [zona: string]: {
      estaciones: number;
      capacidad: number;
      ocupacion: number;
    };
  };
  mas_utilizadas: StationWithStats[];
}

export interface PaginatedStations {
  estaciones: StationWithStats[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
  limite: number;
}

export interface NearbyStationsResponse {
  estaciones_cercanas: StationWithStats[];
  ubicacion_busqueda: {
    latitud: number;
    longitud: number;
    radio_km: number;
  };
  total_encontradas: number;
}

// ============ STATION API SERVICE ============

class StationApiService {
  private readonly baseUrl = '/api/v1/stations'; // CORREGIDO: era '/api/v1/estaciones'

  // ========== OBTENER ESTACIONES ==========

  /**
   * Obtener todas las estaciones con filtros opcionales
   */
  async getStations(filters?: StationFilters): Promise<ApiResponse<PaginatedStations>> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.zona) params.append('zona', filters.zona);
    if (filters?.pagina) params.append('pagina', filters.pagina.toString());
    if (filters?.limite) params.append('limite', filters.limite.toString());
    
    // Para búsqueda por ubicación
    if (filters?.cerca_de) {
      params.append('latitud', filters.cerca_de.latitud.toString());
      params.append('longitud', filters.cerca_de.longitud.toString());
      if (filters.cerca_de.radio_km) {
        params.append('radio_km', filters.cerca_de.radio_km.toString());
      }
    }

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    
    console.log('🏢 Fetching stations from:', url);
    return apiService.get<PaginatedStations>(url);
  }

  /**
   * Obtener estaciones activas solamente
   */
  async getActiveStations(): Promise<ApiResponse<StationWithStats[]>> {
    return apiService.get<StationWithStats[]>(`${this.baseUrl}?estado=active`);
  }

  /**
   * Obtener una estación por ID
   */
  async getStationById(id: number): Promise<ApiResponse<StationWithStats>> {
    return apiService.get<StationWithStats>(`${this.baseUrl}/${id}`);
  }

  /**
   * Buscar estaciones cercanas a una ubicación
   */
  async getNearbyStations(
    latitud: number,
    longitud: number,
    radioKm: number = 5
  ): Promise<ApiResponse<NearbyStationsResponse>> {
    const params = new URLSearchParams({
      latitud: latitud.toString(),
      longitud: longitud.toString(),
      radio_km: radioKm.toString()
    });

    return apiService.get<NearbyStationsResponse>(`${this.baseUrl}/cercanas?${params}`);
  }

  /**
   * Buscar estaciones por zona
   */
  async getStationsByZone(zona: string): Promise<ApiResponse<StationWithStats[]>> {
    return apiService.get<StationWithStats[]>(`${this.baseUrl}/zona/${zona}`);
  }

  /**
   * Obtener todas las zonas disponibles
   */
  async getAvailableZones(): Promise<ApiResponse<string[]>> {
    return apiService.get<string[]>(`${this.baseUrl}/zonas`);
  }

  // ========== CREAR Y ACTUALIZAR ==========

  /**
   * Crear nueva estación
   */
  async createStation(data: CreateStationData): Promise<ApiResponse<Station>> {
    return apiService.post<Station>(this.baseUrl, data);
  }

  /**
   * Actualizar estación
   */
  async updateStation(id: number, data: UpdateStationData): Promise<ApiResponse<Station>> {
    return apiService.put<Station>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Cambiar estado de la estación
   */
  async changeStationStatus(
    id: number,
    estado: 'active' | 'inactive' | 'maintenance'
  ): Promise<ApiResponse<Station>> {
    return apiService.patch<Station>(`${this.baseUrl}/${id}/estado`, { estado });
  }

  /**
   * Actualizar capacidad de la estación
   */
  async updateStationCapacity(id: number, capacidad: number): Promise<ApiResponse<Station>> {
    return apiService.patch<Station>(`${this.baseUrl}/${id}/capacidad`, { capacidad });
  }

  // ========== GESTIÓN DE TRANSPORTES EN ESTACIONES ==========

  /**
   * Obtener transportes disponibles en una estación
   */
  async getStationTransports(stationId: number): Promise<ApiResponse<any[]>> {
    return apiService.get<any[]>(`${this.baseUrl}/${stationId}/transportes`);
  }

  /**
   * Verificar disponibilidad de espacios en estación
   */
  async checkStationAvailability(stationId: number): Promise<ApiResponse<{
    capacidad: number;
    ocupados: number;
    disponibles: number;
    porcentaje_ocupacion: number;
    puede_recibir: boolean;
  }>> {
    return apiService.get(`${this.baseUrl}/${stationId}/disponibilidad`);
  }

  // ========== ESTADÍSTICAS ==========

  /**
   * Obtener estadísticas generales de estaciones
   */
  async getStationStats(): Promise<ApiResponse<StationStats>> {
    return apiService.get<StationStats>(`${this.baseUrl}/estadisticas`);
  }

  /**
   * Obtener estaciones más utilizadas
   */
  async getMostUsedStations(limite = 10): Promise<ApiResponse<StationWithStats[]>> {
    return apiService.get<StationWithStats[]>(`${this.baseUrl}/mas-utilizadas?limite=${limite}`);
  }

  /**
   * Obtener estadísticas de ocupación por zona
   */
  async getOccupancyByZone(): Promise<ApiResponse<{
    [zona: string]: {
      estaciones: number;
      capacidad_total: number;
      transportes_actuales: number;
      porcentaje_ocupacion: number;
    };
  }>> {
    return apiService.get(`${this.baseUrl}/ocupacion-por-zona`);
  }

  // ========== ELIMINAR ==========

  /**
   * Eliminar estación (soft delete)
   */
  async deleteStation(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Verificar si una estación está disponible
   */
  async isStationAvailable(id: number): Promise<boolean> {
    try {
      const response = await this.getStationById(id);
      return response.success && response.data?.estado === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Calcular distancia entre dos puntos (en km)
   */
  calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Encontrar la estación más cercana
   */
  async findNearestStation(
    latitud: number, 
    longitud: number
  ): Promise<StationWithStats | null> {
    try {
      const response = await this.getNearbyStations(latitud, longitud, 10);
      if (response.success && response.data?.estaciones_cercanas && response.data.estaciones_cercanas.length > 0) {
        return response.data.estaciones_cercanas[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si una estación tiene capacidad
   */
  async hasCapacity(stationId: number): Promise<boolean> {
    try {
      const response = await this.checkStationAvailability(stationId);
      return response.success && (response.data?.puede_recibir || false);
    } catch {
      return false;
    }
  }

  /**
   * Obtener resumen rápido de estación
   */
  async getStationSummary(stationId: number): Promise<{
    station: StationWithStats | null;
    isAvailable: boolean;
    hasTransports: boolean;
    hasCapacity: boolean;
  }> {
    try {
      const [stationResponse, availabilityResponse] = await Promise.all([
        this.getStationById(stationId),
        this.checkStationAvailability(stationId)
      ]);

      const station = stationResponse.success ? stationResponse.data : null;
      const availability = availabilityResponse.success ? availabilityResponse.data : null;

      return {
        station: station || null,
        isAvailable: station?.estado === 'active',
        hasTransports: (station?.transportes_disponibles || 0) > 0,
        hasCapacity: availability?.puede_recibir || false
      };
    } catch {
      return {
        station: null,
        isAvailable: false,
        hasTransports: false,
        hasCapacity: false
      };
    }
  }
}

// Exportar instancia singleton
export const stationApiService = new StationApiService();