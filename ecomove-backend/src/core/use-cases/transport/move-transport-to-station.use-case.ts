import { TransportRepository } from '../../domain/entities/transport.entity';

export class MoveTransportToStationUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(transportId: number, stationId: number): Promise<boolean> {
    if (transportId <= 0) {
      throw new Error('ID de transporte inválido');
    }

    if (stationId <= 0) {
      throw new Error('ID de estación inválido');
    }

    // Validate the transport exists and can be moved
    const transport = await this.transportRepository.findById(transportId);
    if (!transport) {
      throw new Error('Transporte no encontrado');
    }

    // Use domain entity to validate the move
    try {
      transport.moveToStation(stationId);
    } catch (error) {
      throw new Error(`Error al mover transporte: ${(error as Error).message}`);
    }

    return await this.transportRepository.updateStation(transportId, stationId);
  }
}