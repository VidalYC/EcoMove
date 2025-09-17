import { TransportStatus, TransportType } from "../../../../shared/enums/transport.enums";

export class Transport {
  [x: string]: any;
  constructor(
    public readonly id: number,
    public readonly type: TransportType,
    public readonly model: string,
    private _status: TransportStatus,
    private _currentStationId: number | null,
    public readonly hourlyRate: number,
    public readonly acquisitionDate: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  get status(): TransportStatus {
    return this._status;
  }

  get currentStationId(): number | null {
    return this._currentStationId;
  }

  isAvailable(): boolean {
    return this._status === TransportStatus.AVAILABLE;
  }

  isInUse(): boolean {
    return this._status === TransportStatus.IN_USE;
  }

  canBeRented(): boolean {
    return this._status === TransportStatus.AVAILABLE && this._currentStationId !== null;
  }

  startRental(): void {
    if (!this.canBeRented()) {
      throw new Error('Transport is not available for rental');
    }
    this._status = TransportStatus.IN_USE;
  }

  endRental(stationId: number): void {
    if (!this.isInUse()) {
      throw new Error('Transport is not currently in use');
    }
    this._status = TransportStatus.AVAILABLE;
    this._currentStationId = stationId;
  }

  putInMaintenance(): void {
    if (this._status === TransportStatus.IN_USE) {
      throw new Error('Cannot put transport in maintenance while in use');
    }
    this._status = TransportStatus.MAINTENANCE;
  }

  putBackInService(): void {
    if (this._status !== TransportStatus.MAINTENANCE) {
      throw new Error('Transport is not in maintenance');
    }
    this._status = TransportStatus.AVAILABLE;
  }

  putOutOfService(): void {
    if (this._status === TransportStatus.IN_USE) {
      throw new Error('Cannot put transport out of service while in use');
    }
    this._status = TransportStatus.OUT_OF_SERVICE;
  }

  moveToStation(stationId: number): void {
    if (this._status !== TransportStatus.AVAILABLE) {
      throw new Error('Can only move available transports');
    }
    this._currentStationId = stationId;
  }

  calculateRentalCost(minutes: number): number {
    const hours = minutes / 60;
    return Math.ceil(hours * this.hourlyRate);
  }
}
