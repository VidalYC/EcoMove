import { TransportRepository } from '../../domain/repositories/transport.repository';
import { PricingService, FareCalculation } from '../../domain/services/enhanced-pricing.service';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';

export interface CalculateFareRequest {
  transportId: number;
  durationMinutes: number;
}

export interface CalculateFareResponse {
  transportId: number;
  transportType: string;
  transportModel: string;
  fareCalculation: FareCalculation;
}

export class CalculateFareUseCase {
  constructor(
    private readonly transportRepository: TransportRepository,
    private readonly pricingService: PricingService
  ) {}

  async execute(request: CalculateFareRequest): Promise<CalculateFareResponse> {
    const { transportId, durationMinutes } = request;

    // ✅ AGREGAR: Logging de inicio del cálculo
    console.log('🧮 Calculating fare', {
      transportId,
      durationMinutes,
      timestamp: new Date().toISOString()
    });

    // Validaciones
    if (transportId <= 0) {
      throw new ValidationException('ID de transporte inválido');
    }

    if (durationMinutes <= 0 || durationMinutes > 1440) {
      throw new ValidationException('Duración debe estar entre 1 y 1440 minutos (24 horas)');
    }

    // Buscar el transporte
    const transport = await this.transportRepository.findById(transportId);
    if (!transport) {
      throw new NotFoundException('Transporte no encontrado');
    }

    // Calcular tarifa usando el servicio consolidado
    const fareCalculation = await this.pricingService.calculateFare(transport, durationMinutes);

    // ✅ AGREGAR: Logging del resultado
    console.log('✅ Fare calculated successfully', {
      transportId,
      transportType: transport.type,
      baseFare: fareCalculation.baseFare,
      totalCost: fareCalculation.totalCost,
      hasDiscount: fareCalculation.appliedDiscounts && fareCalculation.appliedDiscounts > 0,
      timestamp: new Date().toISOString()
    });

    return {
      transportId: transport.id,
      transportType: transport.type,
      transportModel: transport.model,
      fareCalculation
    };
  }
}