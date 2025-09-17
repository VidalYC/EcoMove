import { Bicycle } from '../../domain/entities/transport/bicycle.entity';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { CreateBicycleDto } from '../../../shared/interfaces/transport-dtos';

export class CreateBicycleUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(dto: CreateBicycleDto): Promise<Bicycle> {
    // Validate brake type
    const validBrakeTypes = ['Disco', 'V-Brake', 'Cantilever', 'Tambor'];
    if (!validBrakeTypes.includes(dto.brakeType)) {
      throw new Error(`Tipo de freno inválido. Debe ser uno de: ${validBrakeTypes.join(', ')}`);
    }

    // Validate gear count
    if (dto.gearCount < 1 || dto.gearCount > 30) {
      throw new Error('El número de marchas debe estar entre 1 y 30');
    }

    // Validate hourly rate
    if (dto.hourlyRate <= 0) {
      throw new Error('La tarifa por hora debe ser mayor a 0');
    }

    return await this.transportRepository.createBicycle({
      model: dto.model.trim(),
      hourlyRate: dto.hourlyRate,
      gearCount: dto.gearCount,
      brakeType: dto.brakeType,
      stationId: dto.stationId
    });
  }
}