import { ElectricScooter } from '../../domain/entities/electric-scooter.entity';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { CreateElectricScooterDto } from '../../../shared/interfaces/transport-dtos';

export class CreateElectricScooterUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(dto: CreateElectricScooterDto): Promise<ElectricScooter> {
    // Validate max speed
    if (dto.maxSpeed < 10 || dto.maxSpeed > 50) {
      throw new Error('La velocidad máxima debe estar entre 10 y 50 km/h');
    }

    // Validate range
    if (dto.range < 10 || dto.range > 100) {
      throw new Error('La autonomía debe estar entre 10 y 100 km');
    }

    // Validate hourly rate
    if (dto.hourlyRate <= 0) {
      throw new Error('La tarifa por hora debe ser mayor a 0');
    }

    // Validate battery level if provided
    if (dto.batteryLevel !== undefined && (dto.batteryLevel < 0 || dto.batteryLevel > 100)) {
      throw new Error('El nivel de batería debe estar entre 0 y 100%');
    }

    return await this.transportRepository.createElectricScooter({
      model: dto.model.trim(),
      hourlyRate: dto.hourlyRate,
      maxSpeed: dto.maxSpeed,
      range: dto.range,
      stationId: dto.stationId
    });
  }
}