import { StationRepository, Station } from '../../domain/entities/station.entity';

export class CalculateRouteUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(originId: number, destinationId: number): Promise<{
    origin: Station;
    destination: Station;
    distance: number;
    estimatedTime: number;
  } | null> {
    if (originId === destinationId) {
      throw new Error('La estación de origen y destino no pueden ser la misma');
    }

    return await this.stationRepository.calculateRoute(originId, destinationId);
  }
}