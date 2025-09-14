import { Transport, TransportRepository } from '../../domain/entities/transport.entity';

export class GetTransportUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(id: number): Promise<Transport | null> {
    if (id <= 0) {
      throw new Error('ID de transporte inválido');
    }

    return await this.transportRepository.findById(id);
  }
}