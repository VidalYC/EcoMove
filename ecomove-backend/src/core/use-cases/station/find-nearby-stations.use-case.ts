import { StationRepository, Station, Coordinate } from '../../domain/entities/station.entity';

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
