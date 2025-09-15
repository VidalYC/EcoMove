import { Station } from '../../domain/entities/station.entity';
import { StationRepository } from '../../domain/repositories/station.repository';

export class FindStationsWithTransportsUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(transportType?: string): Promise<Station[]> {
    return await this.stationRepository.findWithAvailableTransports(transportType);
  }
}