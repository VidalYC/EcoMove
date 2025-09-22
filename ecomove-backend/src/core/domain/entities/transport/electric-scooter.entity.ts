import { Transport } from './transport.entity';
import { TransportStatus, TransportType } from '../../../../shared/enums/transport.enums';

export class ElectricScooter extends Transport {
  constructor(
    id: number,
    model: string,
    status: TransportStatus,
    currentStationId: number | null,
    hourlyRate: number,
    acquisitionDate: Date,
    private _batteryLevel: number,
    public readonly maxSpeed: number,
    public readonly range: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(
      id,
      TransportType.ELECTRIC_SCOOTER,
      model,
      status,
      currentStationId,
      hourlyRate,
      acquisitionDate,
      createdAt,
      updatedAt
    );
  }

  get batteryLevel(): number {
    return this._batteryLevel;
  }

  updateBatteryLevel(level: number): void {
    if (level < 0 || level > 100) {
      throw new Error('Battery level must be between 0 and 100');
    }
    this._batteryLevel = level;
  }

  needsCharging(): boolean {
    return this._batteryLevel < 20;
  }

  override canBeRented(): boolean {
    return super.canBeRented() && this._batteryLevel > 10;
  }

  getSpecifications(): { batteryLevel: number; maxSpeed: number; range: number } {
    return {
      batteryLevel: this._batteryLevel,
      maxSpeed: this.maxSpeed,
      range: this.range
    };
  }
}
