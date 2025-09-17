// 💎 BATTERY LEVEL VALUE OBJECT

export enum BatteryStatus {
  CRITICAL = 'critical', // 0-10%
  LOW = 'low',          // 11-25%
  GOOD = 'good',        // 26-75%
  EXCELLENT = 'excellent' // 76-100%
}

export class BatteryLevel {
  constructor(private readonly percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Battery level must be between 0 and 100');
    }
  }

  getPercentage(): number {
    return this.percentage;
  }

  getStatus(): BatteryStatus {
    if (this.percentage <= 10) return BatteryStatus.CRITICAL;
    if (this.percentage <= 25) return BatteryStatus.LOW;
    if (this.percentage <= 75) return BatteryStatus.GOOD;
    return BatteryStatus.EXCELLENT;
  }

  isCritical(): boolean {
    return this.getStatus() === BatteryStatus.CRITICAL;
  }

  isLow(): boolean {
    return this.getStatus() === BatteryStatus.LOW;
  }

  isGood(): boolean {
    return this.getStatus() === BatteryStatus.GOOD;
  }

  isExcellent(): boolean {
    return this.getStatus() === BatteryStatus.EXCELLENT;
  }

  canBeRented(): boolean {
    return this.percentage > 10; // Must have more than 10% battery
  }

  getColor(): string {
    switch (this.getStatus()) {
      case BatteryStatus.CRITICAL:
        return '#ef4444'; // red-500
      case BatteryStatus.LOW:
        return '#f59e0b'; // yellow-500
      case BatteryStatus.GOOD:
        return '#3b82f6'; // blue-500
      case BatteryStatus.EXCELLENT:
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  }

  equals(other: BatteryLevel): boolean {
    return this.percentage === other.percentage;
  }

  toString(): string {
    return `${this.percentage}% (${this.getStatus()})`;
  }

  static create(percentage: number): BatteryLevel {
    return new BatteryLevel(percentage);
  }

  static full(): BatteryLevel {
    return new BatteryLevel(100);
  }

  static empty(): BatteryLevel {
    return new BatteryLevel(0);
  }
}