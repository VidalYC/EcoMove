import { StationRepository } from '../../domain/repositories/station.repository';

export class DeactivateStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(id: number): Promise<boolean> {
    return await this.stationRepository.deactivate(id);
  }
}