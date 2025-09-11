// Enums para estados y tipos (corregidos según schema PostgreSQL)
export enum TipoTransporte {
  BICICLETA = 'bicycle',
  PATINETA_ELECTRICA = 'electric-scooter',
  SCOOTER = 'scooter',
  VEHICULO_ELECTRICO = 'electric-vehicle'
}

export enum EstadoTransporte {
  DISPONIBLE = 'available',
  EN_USO = 'in-use',
  MANTENIMIENTO = 'maintenance',
  FUERA_DE_SERVICIO = 'out-of-service'
}

// Interfaz base para todos los transportes
export interface ITransporte {
  id?: number;
  tipo: TipoTransporte;
  modelo: string;
  estado: EstadoTransporte;
  estacion_actual_id?: number;
  tarifa_por_hora: number;
  fecha_adquisicion: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Interfaz para crear transporte (sin campos auto-generados)
export interface ITransporteCreate {
  tipo: TipoTransporte;
  modelo: string;
  estacion_actual_id?: number;
  tarifa_por_hora: number;
  fecha_adquisicion?: Date;
}

// Interfaz para actualizar transporte
export interface ITransporteUpdate {
  modelo?: string;
  estado?: EstadoTransporte;
  estacion_actual_id?: number;
  tarifa_por_hora?: number;
}

// Bicicleta específica
export interface IBicicleta extends ITransporte {
  tipo: TipoTransporte.BICICLETA;
  num_marchas: number;
  tipo_freno: string;
}

export interface IBicicletaCreate extends ITransporteCreate {
  tipo: TipoTransporte.BICICLETA;
  num_marchas: number;
  tipo_freno: string;
}

// Patineta eléctrica específica
export interface IPatinetaElectrica extends ITransporte {
  tipo: TipoTransporte.PATINETA_ELECTRICA;
  nivel_bateria: number;
  velocidad_maxima: number;
  autonomia: number;
}

export interface IPatinetaElectricaCreate extends ITransporteCreate {
  tipo: TipoTransporte.PATINETA_ELECTRICA;
  nivel_bateria?: number;
  velocidad_maxima: number;
  autonomia: number;
}

// Unión de tipos para transportes específicos
export type TransporteEspecifico = IBicicleta | IPatinetaElectrica;
export type TransporteEspecificoCreate = IBicicletaCreate | IPatinetaElectricaCreate;

// Estadísticas de transporte
export interface ITransporteStats {
  total_transportes: string;
  disponibles: string;
  en_uso: string;
  mantenimiento: string;
  por_tipo: {
    bicicletas: string;
    patinetas: string;
    scooters: string;
    vehiculos: string;
  };
}

// Filtros para búsqueda
export interface ITransporteFiltros {
  tipo?: TipoTransporte;
  estado?: EstadoTransporte;
  estacion_id?: number;
  tarifa_min?: number;
  tarifa_max?: number;
}