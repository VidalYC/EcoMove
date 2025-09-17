import { TransportRepository } from '../../domain/repositories/transport.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface CalculateFareRequest {
  transportId: number;
  durationMinutes: number;
}

export interface CalculateFareResponse {
  baseFare: number;
  durationMinutes: number;
  totalCost: number;
  appliedDiscounts?: number;
  taxes?: number;
}

export class CalculateFareUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(request: CalculateFareRequest): Promise<CalculateFareResponse> {
    const { transportId, durationMinutes } = request;

    // Validar parámetros
    if (transportId <= 0) {
      throw new ValidationException('ID de transporte inválido');
    }

    if (durationMinutes <= 0 || durationMinutes > 1440) {
      throw new ValidationException('Duración debe estar entre 1 y 1440 minutos (24 horas)');
    }

    // Buscar el transporte
    const transport = await this.transportRepository.findById(transportId);
    if (!transport) {
      throw new ValidationException('Transporte no encontrado');
    }

    // Calcular tarifa
    const baseFare = transport.hourlyRate;
    const hourlyRate = baseFare;
    const hours = durationMinutes / 60;
    let totalCost = hourlyRate * hours;

    // Aplicar descuentos por tiempo (ejemplo: descuento por más de 2 horas)
    let appliedDiscounts = 0;
    if (durationMinutes > 120) { // Más de 2 horas
      appliedDiscounts = totalCost * 0.1; // 10% de descuento
      totalCost -= appliedDiscounts;
    }

    // Aplicar impuestos (ejemplo: 19% IVA)
    const taxes = totalCost * 0.19;
    totalCost += taxes;

    // Redondear a 2 decimales
    totalCost = Math.round(totalCost * 100) / 100;

    return {
      baseFare,
      durationMinutes,
      totalCost,
      appliedDiscounts,
      taxes
    };
  }
}