import { Transport, TransportRepository, TransportStatus } from '../../domain/entities/transport.entity';
import { UpdateTransportDto } from '../../../shared/interfaces/transport-dtos';

export class UpdateTransportUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(id: number, dto: UpdateTransportDto): Promise<Transport | null> {
    if (id <= 0) {
      throw new Error('ID de transporte inválido');
    }

    // Validate the transport exists
    const existingTransport = await this.transportRepository.findById(id);
    if (!existingTransport) {
      throw new Error('Transporte no encontrado');
    }

    // Validate hourly rate if provided
    if (dto.hourlyRate !== undefined && dto.hourlyRate <= 0) {
      throw new Error('La tarifa por hora debe ser mayor a 0');
    }

    // Validate status transitions if status is being changed
    if (dto.status && dto.status !== existingTransport.status) {
      this.validateStatusTransition(existingTransport.status, dto.status);
    }

    return await this.transportRepository.update(id, dto);
  }

  private validateStatusTransition(currentStatus: TransportStatus, newStatus: TransportStatus): void {
    const validTransitions: Record<TransportStatus, TransportStatus[]> = {
      [TransportStatus.AVAILABLE]: [TransportStatus.IN_USE, TransportStatus.MAINTENANCE, TransportStatus.OUT_OF_SERVICE],
      [TransportStatus.IN_USE]: [TransportStatus.AVAILABLE, TransportStatus.MAINTENANCE],
      [TransportStatus.MAINTENANCE]: [TransportStatus.AVAILABLE, TransportStatus.OUT_OF_SERVICE],
      [TransportStatus.OUT_OF_SERVICE]: [TransportStatus.MAINTENANCE]
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`No se puede cambiar de ${currentStatus} a ${newStatus}`);
    }
  }
}