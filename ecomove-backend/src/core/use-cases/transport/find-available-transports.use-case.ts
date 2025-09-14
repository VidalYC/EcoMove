import { Transport, TransportRepository, TransportType } from '../../domain/entities/transport.entity';

export class FindAvailableTransportsUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(stationId: number, type?: TransportType): Promise<Transport[]> {
    if (stationId <= 0) {
      throw new Error('ID de estación inválido');
    }

    return await this.transportRepository.findAvailableByStation(stationId, type);
  }
}