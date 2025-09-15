import { StationRepository, Station, Coordinate } from '../../domain/entities/station.entity';

export class UpdateStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number, updates: {
    name?: string;
    address?: string;
    coordinate?: Coordinate;
    maxCapacity?: number;
  }): Promise<Station | null> {
    // Validaciones de negocio si se actualiza capacidad
    if (updates.maxCapacity !== undefined) {
      if (updates.maxCapacity <= 0) {
        throw new Error('La capacidad máxima debe ser mayor a 0');
      }
      if (updates.maxCapacity > 100) {
        throw new Error('La capacidad máxima no puede exceder 100 transportes');
      }
    }

    return await this.stationRepository.update(id, updates);
  }
}