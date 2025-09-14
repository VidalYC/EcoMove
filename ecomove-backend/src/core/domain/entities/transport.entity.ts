export enum TransportType {
  BICYCLE = 'bicycle',
  ELECTRIC_SCOOTER = 'electric-scooter', 
  SCOOTER = 'scooter',
  ELECTRIC_VEHICLE = 'electric-vehicle'
}

export enum TransportStatus {
  AVAILABLE = 'available',
  IN_USE = 'in-use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out-of-service'
}

export class Transport {
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

  // Business logic methods
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

  canBeRented(): boolean {
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

export class TransportFilters {
  constructor(
    public readonly type?: TransportType,
    public readonly status?: TransportStatus,
    public readonly stationId?: number,
    public readonly minRate?: number,
    public readonly maxRate?: number
  ) {}

  static create(data: {
    type?: string;
    status?: string;
    stationId?: number;
    minRate?: number;
    maxRate?: number;
  }): TransportFilters {
    return new TransportFilters(
      data.type as TransportType,
      data.status as TransportStatus,
      data.stationId,
      data.minRate,
      data.maxRate
    );
  }

  hasFilters(): boolean {
    return !!(this.type || this.status || this.stationId || this.minRate || this.maxRate);
  }
}

export interface TransportRepository {
  // Basic CRUD
  create(transport: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transport>;
  findById(id: number): Promise<Transport | null>;
  findAll(page: number, limit: number, filters?: TransportFilters): Promise<{
    transports: Transport[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
  update(id: number, updates: Partial<Transport>): Promise<Transport | null>;
  delete(id: number): Promise<boolean>;
  
  // Specialized operations
  createBicycle(data: {
    model: string;
    hourlyRate: number;
    gearCount: number;
    brakeType: string;
    stationId?: number;
  }): Promise<Bicycle>;
  
  createElectricScooter(data: {
    model: string;
    hourlyRate: number;
    maxSpeed: number;
    range: number;
    stationId?: number;
  }): Promise<ElectricScooter>;
  
  findAvailableByStation(stationId: number, type?: TransportType): Promise<Transport[]>;
  updateStatus(id: number, status: TransportStatus): Promise<boolean>;
  updateStation(id: number, stationId: number): Promise<boolean>;
  updateBatteryLevel(id: number, level: number): Promise<boolean>;
  
  // Analytics
  getStats(): Promise<{
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    byType: {
      bicycles: number;
      electricScooters: number;
      scooters: number;
      electricVehicles: number;
    };
  }>;
}