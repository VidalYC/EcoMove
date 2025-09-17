import { Station } from './station.entity';

export class StationAvailability {
  constructor(
    public readonly station: Station,
    public readonly totalTransports: number,
    public readonly availableTransports: number,
    public readonly availabilityByType: {
      bicycles: number;
      electricScooters: number;
      scooters: number;
      electricVehicles: number;
    }
  ) {}

  get occupancyPercentage(): number {
    if (this.station.maxCapacity === 0) return 0;
    return (this.totalTransports / this.station.maxCapacity) * 100;
  }

  get availableSpaces(): number {
    return Math.max(0, this.station.maxCapacity - this.totalTransports);
  }

  get isFull(): boolean {
    return this.totalTransports >= this.station.maxCapacity;
  }

  get isEmpty(): boolean {
    return this.totalTransports === 0;
  }

  hasAvailableTransports(type?: string): boolean {
    if (!type) return this.availableTransports > 0;
    
    switch (type) {
      case 'bicycle':
        return this.availabilityByType.bicycles > 0;
      case 'electric-scooter':
        return this.availabilityByType.electricScooters > 0;
      case 'scooter':
        return this.availabilityByType.scooters > 0;
      case 'electric-vehicle':
        return this.availabilityByType.electricVehicles > 0;
      default:
        return false;
    }
  }
}
