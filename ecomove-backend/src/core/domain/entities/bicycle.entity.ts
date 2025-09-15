import { Transport } from './transport.entity';
import { TransportStatus, TransportType } from '../../../shared/enums/transport.enums';

export class Bicycle extends Transport {
  constructor(
    id: number,
    model: string,
    status: TransportStatus,
    currentStationId: number | null,
    hourlyRate: number,
    acquisitionDate: Date,
    public readonly gearCount: number,
    public readonly brakeType: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(
      id,
      TransportType.BICYCLE,
      model,
      status,
      currentStationId,
      hourlyRate,
      acquisitionDate,
      createdAt,
      updatedAt
    );
  }

  getSpecifications(): { gearCount: number; brakeType: string } {
    return {
      gearCount: this.gearCount,
      brakeType: this.brakeType
    };
  }
}
