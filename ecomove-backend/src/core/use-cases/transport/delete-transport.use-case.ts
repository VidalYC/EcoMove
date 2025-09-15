import { TransportStatus } from '../../../shared/enums/transport.enums';
import { TransportRepository } from '../../domain/repositories/transport.repository';

export class DeleteTransportUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(id: number): Promise<boolean> {
    if (id <= 0) {
      throw new Error('ID de transporte inválido');
    }

    // Validate the transport exists and can be deleted
    const transport = await this.transportRepository.findById(id);
    if (!transport) {
      throw new Error('Transporte no encontrado');
    }

    // Don't allow deletion if transport is in use
    if (transport.status === TransportStatus.IN_USE) {
      throw new Error('No se puede eliminar un transporte que está en uso');
    }

    return await this.transportRepository.delete(id);
  }
}