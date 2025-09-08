// Enums para préstamos (según schema PostgreSQL)
export enum EstadoPrestamo {
  ACTIVO = 'active',
  COMPLETADO = 'completed',
  CANCELADO = 'cancelled',
  EXTENDIDO = 'extended'
}

export enum MetodoPago {
  EFECTIVO = 'cash',
  TARJETA_CREDITO = 'credit-card',
  PSE = 'pse',
  BILLETERA_DIGITAL = 'digital-wallet'
}

// Interfaces para préstamos
export interface IPrestamo {
  id?: number;
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  estacion_destino_id?: number;
  fecha_inicio: Date;
  fecha_fin?: Date;
  duracion_estimada?: number; // minutos
  costo_total?: number;
  estado: EstadoPrestamo;
  metodo_pago?: MetodoPago;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPrestamoCreate {
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  duracion_estimada?: number;
}

export interface IPrestamoUpdate {
  estacion_destino_id?: number;
  fecha_fin?: Date;
  costo_total?: number;
  estado?: EstadoPrestamo;
  metodo_pago?: MetodoPago;
}

export interface IPrestamoCompleto extends IPrestamo {
  // Datos del usuario
  usuario_nombre?: string;
  usuario_correo?: string;
  usuario_documento?: string;
  
  // Datos del transporte
  transporte_tipo?: string;
  transporte_modelo?: string;
  
  // Datos de estaciones
  estacion_origen_nombre?: string;
  estacion_destino_nombre?: string;
}

export interface IPrestamoStats {
  total_prestamos: string;
  prestamos_activos: string;
  prestamos_completados: string;
  prestamos_cancelados: string;
  ingresos_totales: string;
  duracion_promedio: string;
  transporte_mas_usado: string;
}

export interface IPrestamoFiltros {
  usuario_id?: number;
  transporte_id?: number;
  estacion_origen_id?: number;
  estacion_destino_id?: number;
  estado?: EstadoPrestamo;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  metodo_pago?: MetodoPago;
}

export interface ICalculoTarifa {
  tarifa_base: number;
  duracion_minutos: number;
  costo_total: number;
  descuentos_aplicados?: number;
  impuestos?: number;
}

export interface IHistorialPrestamo {
  prestamos: IPrestamoCompleto[];
  total: number;
  totalPages: number;
  currentPage: number;
  estadisticas_usuario: {
    total_prestamos: number;
    tiempo_total_uso: number; // minutos
    gasto_total: number;
    transporte_favorito: string;
  };
}