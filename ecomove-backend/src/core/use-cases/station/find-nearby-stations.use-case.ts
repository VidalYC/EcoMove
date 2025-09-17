import { Station } from '../../domain/entities/station/station.entity';
import { Coordinate } from '../../../shared/interfaces/coordinate.interface';
import { StationRepository } from '../../domain/repositories/station.repository';

export class FindNearbyStationsUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(
    coordinate: Coordinate, 
    radiusKm: number, 
    limit: number = 10
  ): Promise<Station[]> {
    if (radiusKm <= 0) {
      throw new Error('El radio debe ser mayor a 0');
    }
    if (radiusKm > 50) {
      throw new Error('El radio no puede exceder 50 km');
    }

    return await this.stationRepository.findNearby(coordinate, radiusKm, limit);
  }
}
