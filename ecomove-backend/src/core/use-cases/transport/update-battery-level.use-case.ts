import { TransportType } from '../../../shared/enums/transport.enums';
import { TransportRepository } from '../../domain/repositories/transport.repository';

export class UpdateBatteryLevelUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(transportId: number, batteryLevel: number): Promise<boolean> {
    if (transportId <= 0) {
      throw new Error('ID de transporte inválido');
    }

    if (batteryLevel < 0 || batteryLevel > 100) {
      throw new Error('El nivel de batería debe estar entre 0 y 100');
    }

    // Verify the transport exists and is electric
    const transport = await this.transportRepository.findById(transportId);
    if (!transport) {
      throw new Error('Transporte no encontrado');
    }

    if (transport.type !== TransportType.ELECTRIC_SCOOTER) {
      throw new Error('Solo los transportes eléctricos tienen batería');
    }

    return await this.transportRepository.updateBatteryLevel(transportId, batteryLevel);
  }
}