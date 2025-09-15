import { StationRepository, Station } from '../../domain/entities/station.entity';

export class GetStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<Station | null> {
    return await this.stationRepository.findById(id);
  }
}
