import { StationRepository } from '../../domain/repositories/station.repository';

export class GetStationStatsUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(): Promise<{
    totalStations: number;
    activeStations: number;
    inactiveStations: number;
    totalCapacity: number;
    averageOccupancy: number;
  }> {
    return await this.stationRepository.getStats();
  }
}