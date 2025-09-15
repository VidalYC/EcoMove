import { StationRepository } from '../../domain/entities/station.entity';

export class DeactivateStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<boolean> {
    return await this.stationRepository.deactivate(id);
  }
}