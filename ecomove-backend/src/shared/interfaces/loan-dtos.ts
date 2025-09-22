import { LoanStatus } from '../enums/loan.enums';
import { PaymentMethod } from '../enums/payment.enums';

export interface CreateLoanDto {
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  duracion_estimada?: number;
}

export interface CompleteLoanDto {
  estacion_destino_id: number;
  costo_total: number;
  metodo_pago: PaymentMethod;
}

export interface ExtendLoanDto {
  minutos_adicionales: number;
  costo_adicional: number;
}

export interface LoanFiltersDto {
  usuario_id?: number;
  transporte_id?: number;
  estacion_origen_id?: number;
  estacion_destino_id?: number;
  estado?: LoanStatus;
  fecha_inicio?: string;
  fecha_fin?: string;
  metodo_pago?: PaymentMethod;
  page?: number;
  limit?: number;
}

export interface LoanResponseDto {
  id: number;
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  estacion_destino_id: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_estimada: number | null;
  costo_total: number | null;
  estado: LoanStatus;
  metodo_pago: PaymentMethod | null;
  created_at: string;
  updated_at: string;
}

export interface LoanWithDetailsDto extends LoanResponseDto {
  usuario_nombre?: string;
  usuario_correo?: string;
  usuario_documento?: string;
  transporte_tipo?: string;
  transporte_modelo?: string;
  estacion_origen_nombre?: string;
  estacion_destino_nombre?: string;
}

export interface UserLoanHistoryDto {
  prestamos: LoanWithDetailsDto[];
  total: number;
  totalPages: number;
  currentPage: number;
  estadisticas_usuario: {
    total_prestamos: number;
    tiempo_total_uso: number;
    gasto_total: number;
    transporte_favorito: string;
  };
}

export interface LoanStatsDto {
  total_prestamos: number;
  prestamos_activos: number;
  prestamos_completados: number;
  prestamos_cancelados: number;
  ingresos_totales: number;
  duracion_promedio: number;
  transporte_mas_usado: string;
}

export interface PeriodReportDto {
  resumen: LoanStatsDto;
  prestamos_por_dia: Array<{
    fecha: string;
    total_prestamos: number;
    ingresos: number;
    prestamos_completados: number;
    prestamos_cancelados: number;
  }>;
  transportes_mas_usados: Array<{
    tipo_transporte: string;
    modelo_transporte: string;
    total_prestamos: number;
    ingresos_generados: number;
  }>;
  estaciones_mas_activas: Array<{
    nombre_estacion: string;
    total_prestamos: number;
    prestamos_origen: number;
    prestamos_destino: number;
  }>;
}

export interface CalculateFareDto {
  transporte_id: number;
  duracion_minutos: number;
}

export interface FareCalculationDto {
  transporte_id: number;
  tipo_transporte: string;
  modelo_transporte: string;
  tarifa_base: number;
  duracion_minutos: number;
  costo_total: number;
  descuentos_aplicados?: number;
  impuestos?: number;
  desglose: {
    tarifa_por_hora: number;
    duracion_horas: number;
    descuento_porcentaje?: number;
    impuesto_porcentaje: number;
  };
}