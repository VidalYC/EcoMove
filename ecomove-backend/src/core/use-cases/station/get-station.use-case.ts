import { Station } from '../../domain/entities/station/station.entity';
import { StationRepository } from '../../domain/repositories/station.repository';

export class GetStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<Station | null> {
    return await this.stationRepository.findById(id);
  }
}
