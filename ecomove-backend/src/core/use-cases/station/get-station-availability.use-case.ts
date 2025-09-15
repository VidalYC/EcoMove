import { StationRepository, StationAvailability } from '../../domain/entities/station.entity';

export class GetStationAvailabilityUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<StationAvailability | null> {
    return await this.stationRepository.getAvailability(id);
  }
}