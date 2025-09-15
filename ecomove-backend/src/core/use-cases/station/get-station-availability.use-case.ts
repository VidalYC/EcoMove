import { StationAvailability } from '../../domain/entities/station-availability.entity';
import { StationRepository } from '../../domain/repositories/station.repository';

export class GetStationAvailabilityUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<StationAvailability | null> {
    return await this.stationRepository.getAvailability(id);
  }
}