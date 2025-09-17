// 🏛️ TRANSPORT ENTITY
import { BaseEntity, ID, TransportType, TransportStatus } from '../../shared/types';
import { BatteryLevel } from '../value-objects/BatteryLevel';
import { Money } from '../value-objects/Money';

export interface TransportSpecifications {
  [key: string]: string | number;
}

export abstract class Transport implements BaseEntity {
  constructor(
    public readonly id: ID,
    public readonly type: TransportType,
    public readonly model: string,
    public readonly status: TransportStatus,
    public readonly currentStationId: ID,
    public readonly hourlyRate: Money,
    public readonly batteryLevel: BatteryLevel,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Abstract methods
  abstract isValidStatusTransition(newStatus: TransportStatus): boolean;
  abstract getSpecifications(): TransportSpecifications;

  // Business methods
  isAvailable(): boolean {
    return this.status === TransportStatus.AVAILABLE && this.batteryLevel.canBeRented();
  }

  canBeRented(): boolean {
    return this.isAvailable();
  }

  updateStatus(newStatus: TransportStatus): void {
    if (!this.isValidStatusTransition(newStatus)) {
      throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
    }
  }

  calculateCost(durationMinutes: number): Money {
    const hours = Math.ceil(durationMinutes / 60); // Round up to next hour
    return this.hourlyRate.multiply(hours);
  }

  needsMaintenance(): boolean {
    return this.status === TransportStatus.MAINTENANCE || this.batteryLevel.isCritical();
  }

  getBatteryPercentage(): number {
    return this.batteryLevel.getPercentage();
  }

  getBatteryStatus(): string {
    return this.batteryLevel.getStatus();
  }

  // Factory method
  static fromApi(data: any): Transport {
    const batteryLevel = BatteryLevel.create(data.batteryLevel || 100);
    const hourlyRate = Money.create(data.hourlyRate);

    if (data.type === TransportType.BICYCLE) {
      return new Bicycle(
        data.id,
        data.model,
        data.status,
        data.currentStationId,
        hourlyRate,
        batteryLevel,
        new Date(data.createdAt),
        new Date(data.updatedAt),
        data.gearCount || 1,
        data.brakeType || 'rim'
      );
    } else if (data.type === TransportType.ELECTRIC_SCOOTER) {
      return new ElectricScooter(
        data.id,
        data.model,
        data.status,
        data.currentStationId,
        hourlyRate,
        batteryLevel,
        new Date(data.createdAt),
        new Date(data.updatedAt),
        data.maxSpeed || 25,
        data.range || 30
      );
    }

    throw new Error(`Unknown transport type: ${data.type}`);
  }

  // Serialization
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      model: this.model,
      status: this.status,
      currentStationId: this.currentStationId,
      hourlyRate: this.hourlyRate.getAmount(),
      batteryLevel: this.batteryLevel.getPercentage(),
      specifications: this.getSpecifications(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

// Concrete implementations
export class Bicycle extends Transport {
  constructor(
    id: ID,
    model: string,
    status: TransportStatus,
    currentStationId: ID,
    hourlyRate: Money,
    batteryLevel: BatteryLevel,
    createdAt: Date,
    updatedAt: Date,
    public readonly gearCount: number,
    public readonly brakeType: string
  ) {
    super(id, TransportType.BICYCLE, model, status, currentStationId, hourlyRate, batteryLevel, createdAt, updatedAt);
  }

  isValidStatusTransition(newStatus: TransportStatus): boolean {
    const transitions = {
      [TransportStatus.AVAILABLE]: [TransportStatus.IN_USE, TransportStatus.MAINTENANCE],
      [TransportStatus.IN_USE]: [TransportStatus.AVAILABLE, TransportStatus.MAINTENANCE],
      [TransportStatus.MAINTENANCE]: [TransportStatus.AVAILABLE],
    };

    return transitions[this.status]?.includes(newStatus) ?? false;
  }

  getSpecifications(): TransportSpecifications {
    return {
      type: 'Bicicleta',
      model: this.model,
      gears: this.gearCount,
      brakes: this.brakeType,
      batteryLevel: this.batteryLevel.getPercentage(),
    };
  }
}

export class ElectricScooter extends Transport {
  constructor(
    id: ID,
    model: string,
    status: TransportStatus,
    currentStationId: ID,
    hourlyRate: Money,
    batteryLevel: BatteryLevel,
    createdAt: Date,
    updatedAt: Date,
    public readonly maxSpeed: number,
    public readonly range: number
  ) {
    super(id, TransportType.ELECTRIC_SCOOTER, model, status, currentStationId, hourlyRate, batteryLevel, createdAt, updatedAt);
  }

  isValidStatusTransition(newStatus: TransportStatus): boolean {
    const transitions = {
      [TransportStatus.AVAILABLE]: [TransportStatus.IN_USE, TransportStatus.MAINTENANCE],
      [TransportStatus.IN_USE]: [TransportStatus.AVAILABLE, TransportStatus.MAINTENANCE],
      [TransportStatus.MAINTENANCE]: [TransportStatus.AVAILABLE],
    };

    return transitions[this.status]?.includes(newStatus) ?? false;
  }

  needsCharging(): boolean {
    return this.batteryLevel.isLow() || this.batteryLevel.isCritical();
  }

  getSpecifications(): TransportSpecifications {
    return {
      type: 'Scooter Eléctrico',
      model: this.model,
      maxSpeed: `${this.maxSpeed} km/h`,
      range: `${this.range} km`,
      batteryLevel: this.batteryLevel.getPercentage(),
    };
  }
}

export { Transport }