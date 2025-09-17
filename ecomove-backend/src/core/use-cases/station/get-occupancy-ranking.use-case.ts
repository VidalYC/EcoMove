import { Station } from '../../domain/entities/station/station.entity';
import { StationRepository } from '../../domain/repositories/station.repository';

export class GetOccupancyRankingUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(limit: number = 10): Promise<{
    station: Station;
    occupancyPercentage: number;
    totalTransports: number;
  }[]> {
    if (limit < 1 || limit > 50) limit = 10;
    
    return await this.stationRepository.getRankingByOccupancy(limit);
  }
}