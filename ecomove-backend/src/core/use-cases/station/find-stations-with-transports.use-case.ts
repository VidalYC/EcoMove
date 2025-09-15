import { StationRepository, Station } from '../../domain/entities/station.entity';

export class FindStationsWithTransportsUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(transportType?: string): Promise<Station[]> {
    return await this.stationRepository.findWithAvailableTransports(transportType);
  }
}