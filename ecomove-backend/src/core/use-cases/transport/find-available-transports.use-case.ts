import { Transport } from '../../domain/entities/transport.entity';
import { TransportType } from '../../../shared/enums/transport.enums';
import { TransportRepository } from '../../domain/repositories/transport.repository';

export class FindAvailableTransportsUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(stationId: number, type?: TransportType): Promise<Transport[]> {
    if (stationId <= 0) {
      throw new Error('ID de estación inválido');
    }

    return await this.transportRepository.findAvailableByStation(stationId, type);
  }
}