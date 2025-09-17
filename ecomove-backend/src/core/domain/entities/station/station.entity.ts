import { Coordinate } from '../../../../shared/interfaces/coordinate.interface';

export class Station {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly address: string,
    public readonly coordinate: Coordinate,
    public readonly maxCapacity: number,
    private _isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validateCoordinate(coordinate);
    this.validateCapacity(maxCapacity);
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Business logic methods
  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  canAcceptTransport(): boolean {
    return this._isActive;
  }

  // Calculate distance to another station in kilometers
  distanceTo(other: Station): number {
    return this.calculateDistance(this.coordinate, other.coordinate);
  }

  // Calculate distance to coordinates in kilometers
  distanceToCoordinate(coordinate: Coordinate): number {
    return this.calculateDistance(this.coordinate, coordinate);
  }

  private calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private validateCoordinate(coordinate: Coordinate): void {
    if (coordinate.latitude < -90 || coordinate.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (coordinate.longitude < -180 || coordinate.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  private validateCapacity(capacity: number): void {
    if (capacity <= 0) {
      throw new Error('Max capacity must be greater than 0');
    }
    if (capacity > 100) {
      throw new Error('Max capacity cannot exceed 100 transports');
    }
  }

  updateInfo(name?: string, address?: string, coordinate?: Coordinate, maxCapacity?: number): Station {
    if (coordinate) this.validateCoordinate(coordinate);
    if (maxCapacity) this.validateCapacity(maxCapacity);

    return new Station(
      this.id,
      name || this.name,
      address || this.address,
      coordinate || this.coordinate,
      maxCapacity || this.maxCapacity,
      this._isActive,
      this.createdAt,
      new Date()
    );
  }
}
