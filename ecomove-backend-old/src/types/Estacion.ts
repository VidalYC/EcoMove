// Interfaces para el módulo de estaciones
export interface IEstacion {
  id?: number;
  nombre: string;
  direccion: string;
  coordenada_id?: number;
  capacidad_maxima: number;
  fecha_creacion?: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  // Campos de coordenada (para consultas con JOIN)
  latitud?: number;
  longitud?: number;
}

export interface IEstacionCreate {
  nombre: string;
  direccion: string;
  capacidad_maxima: number;
  latitud: number;
  longitud: number;
}

export interface IEstacionUpdate {
  nombre?: string;
  direccion?: string;
  capacidad_maxima?: number;
  is_active?: boolean;
  latitud?: number;
  longitud?: number;
}

export interface ICoordenada {
  id?: number;
  latitud: number;
  longitud: number;
  created_at?: Date;
}

export interface IEstacionStats {
  total_estaciones: string;
  estaciones_activas: string;
  estaciones_inactivas: string;
  capacidad_total: string;
  ocupacion_promedio: string;
}

export interface IEstacionDisponibilidad {
  estacion: IEstacion;
  transportes_totales: number;
  transportes_disponibles: number;
  porcentaje_ocupacion: number;
  disponibilidad_por_tipo: {
    bicicletas: number;
    patinetas: number;
    scooters: number;
    vehiculos: number;
  };
}

export interface IEstacionFiltros {
  activa?: boolean;
  capacidad_min?: number;
  capacidad_max?: number;
  cerca_de?: {
    latitud: number;
    longitud: number;
    radio_km: number;
  };
}