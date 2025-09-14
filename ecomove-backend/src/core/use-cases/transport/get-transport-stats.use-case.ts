import { TransportRepository } from '../../domain/entities/transport.entity';

export class GetTransportStatsUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(): Promise<{
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    byType: {
      bicycles: number;
      electricScooters: number;
      scooters: number;
      electricVehicles: number;
    };
  }> {
    return await this.transportRepository.getStats();
  }
}