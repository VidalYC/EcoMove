import { Transport } from '../../domain/entities/transport/transport.entity';
import { TransportRepository } from '../../domain/repositories/transport.repository';

export class GetTransportUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(id: number): Promise<Transport | null> {
    if (id <= 0) {
      throw new Error('ID de transporte inválido');
    }

    return await this.transportRepository.findById(id);
  }
}