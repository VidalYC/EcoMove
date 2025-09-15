import { TransportStatus } from '../../../shared/enums/transport.enums';
import { TransportRepository } from '../../domain/repositories/transport.repository';

export class ChangeTransportStatusUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(id: number, newStatus: TransportStatus): Promise<boolean> {
    if (id <= 0) {
      throw new Error('ID de transporte inválido');
    }

    // Validate the transport exists
    const transport = await this.transportRepository.findById(id);
    if (!transport) {
      throw new Error('Transporte no encontrado');
    }

    // Use the domain entity to validate the status change
    try {
      switch (newStatus) {
        case TransportStatus.IN_USE:
          transport.startRental();
          break;
        case TransportStatus.AVAILABLE:
          if (transport.status === TransportStatus.IN_USE) {
            throw new Error('Para finalizar un préstamo, usar el caso de uso correspondiente');
          } else if (transport.status === TransportStatus.MAINTENANCE) {
            transport.putBackInService();
          }
          break;
        case TransportStatus.MAINTENANCE:
          transport.putInMaintenance();
          break;
        case TransportStatus.OUT_OF_SERVICE:
          transport.putOutOfService();
          break;
      }
    } catch (error) {
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    }

    return await this.transportRepository.updateStatus(id, newStatus);
  }
}