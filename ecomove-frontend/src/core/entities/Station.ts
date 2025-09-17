// 🏛️ STATION ENTITY
import { BaseEntity, ID, StationStatus } from '../../shared/types';
import { Coordinate } from '../value-objects/Coordinate';

export interface CreateStationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  maxCapacity: number;
}

export class Station implements BaseEntity {
  constructor(
    public readonly id: ID,
    public readonly name: string,
    public readonly address: string,
    public readonly coordinate: Coordinate,
    public readonly maxCapacity: number,
    public readonly status: StationStatus,
    public readonly currentTransports: number = 0,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Factory methods
  static create(data: CreateStationData): Omit<Station, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: data.name.trim(),
      address: data.address.trim(),
      coordinate: Coordinate.create(data.latitude, data.longitude),
      maxCapacity: data.maxCapacity,
      status: StationStatus.ACTIVE,
      currentTransports: 0,
    };
  }

  static fromApi(data: any): Station {
    return new Station(
      data.id,
      data.name,
      data.address,
      Coordinate.create(data.latitude, data.longitude),
      data.maxCapacity,
      data.status as StationStatus,
      data.currentTransports || 0,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  // Business methods
  isActive(): boolean {
    return this.status === StationStatus.ACTIVE;
  }

  activate(): void {
    if (this.status === StationStatus.ACTIVE) {
      throw new Error('Station is already active');
    }
  }

  deactivate(): void {
    if (this.status !== StationStatus.ACTIVE) {
      throw new Error('Station is not active');
    }
  }

  isFull(): boolean {
    return this.currentTransports >= this.maxCapacity;
  }

  isEmpty(): boolean {
    return this.currentTransports === 0;
  }

  hasAvailableSpace(): boolean {
    return !this.isFull();
  }

  hasAvailableTransports(): boolean {
    return this.currentTransports > 0;
  }

  getAvailableSpaces(): number {
    return this.maxCapacity - this.currentTransports;
  }

  getOccupancyPercentage(): number {
    return (this.currentTransports / this.maxCapacity) * 100;
  }

  getCoordinates(): [number, number] {
    return this.coordinate.getLatLng();
  }

  getLatitude(): number {
    return this.coordinate.getLatitude();
  }

  getLongitude(): number {
    return this.coordinate.getLongitude();
  }

  distanceTo(other: Station): number {
    return this.coordinate.distanceTo(other.coordinate);
  }

  distanceToCoordinate(coordinate: Coordinate): number {
    return this.coordinate.distanceTo(coordinate);
  }

  isWithinRadius(center: Coordinate, radiusKm: number): boolean {
    return this.coordinate.isWithinRadius(center, radiusKm);
  }

  canAcceptTransport(): boolean {
    return this.isActive() && this.hasAvailableSpace();
  }

  canProvideTransport(): boolean {
    return this.isActive() && this.hasAvailableTransports();
  }

  getStatusColor(): string {
    switch (this.status) {
      case StationStatus.ACTIVE:
        return '#10b981'; // green-500
      case StationStatus.INACTIVE:
        return '#6b7280'; // gray-500
      case StationStatus.MAINTENANCE:
        return '#f59e0b'; // yellow-500
      default:
        return '#6b7280';
    }
  }

  // Serialization
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      latitude: this.coordinate.getLatitude(),
      longitude: this.coordinate.getLongitude(),
      maxCapacity: this.maxCapacity,
      currentTransports: this.currentTransports,
      status: this.status,
      availableSpaces: this.getAvailableSpaces(),
      occupancyPercentage: this.getOccupancyPercentage(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}