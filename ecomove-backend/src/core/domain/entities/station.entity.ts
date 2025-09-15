export interface Coordinate {
  latitude: number;
  longitude: number;
}

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

export class StationFilters {
  constructor(
    public readonly active?: boolean,
    public readonly minCapacity?: number,
    public readonly maxCapacity?: number,
    public readonly nearLocation?: {
      coordinate: Coordinate;
      radiusKm: number;
    }
  ) {}

  static create(data: {
    active?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }): StationFilters {
    let nearLocation;
    if (data.latitude !== undefined && data.longitude !== undefined && data.radiusKm !== undefined) {
      nearLocation = {
        coordinate: { latitude: data.latitude, longitude: data.longitude },
        radiusKm: data.radiusKm
      };
    }

    return new StationFilters(
      data.active,
      data.minCapacity,
      data.maxCapacity,
      nearLocation
    );
  }

  hasFilters(): boolean {
    return !!(this.active !== undefined || this.minCapacity || this.maxCapacity || this.nearLocation);
  }
}

export interface StationRepository {
  // Basic CRUD
  create(data: {
    name: string;
    address: string;
    coordinate: Coordinate;
    maxCapacity: number;
  }): Promise<Station>;
  
  findById(id: number): Promise<Station | null>;
  
  findAll(page: number, limit: number, filters?: StationFilters): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
  
  update(id: number, updates: {
    name?: string;
    address?: string;
    coordinate?: Coordinate;
    maxCapacity?: number;
  }): Promise<Station | null>;
  
  delete(id: number): Promise<boolean>;
  
  // Station-specific operations
  activate(id: number): Promise<boolean>;
  deactivate(id: number): Promise<boolean>;
  
  // Geographic operations
  findNearby(coordinate: Coordinate, radiusKm: number, limit?: number): Promise<Station[]>;
  findWithAvailableTransports(transportType?: string): Promise<Station[]>;
  
  // Availability operations
  getAvailability(id: number): Promise<StationAvailability | null>;
  getRankingByOccupancy(limit?: number): Promise<{
    station: Station;
    occupancyPercentage: number;
    totalTransports: number;
  }[]>;
  
  // Route calculation
  calculateRoute(originId: number, destinationId: number): Promise<{
    origin: Station;
    destination: Station;
    distance: number;
    estimatedTime: number; // in minutes
  } | null>;
  
  // Analytics
  getStats(): Promise<{
    totalStations: number;
    activeStations: number;
    inactiveStations: number;
    totalCapacity: number;
    averageOccupancy: number;
  }>;
}