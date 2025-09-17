import { Transport } from '../entities/transport/transport.entity';
import { TransportStatus, TransportType } from '../../../shared/enums/transport.enums';
import { Bicycle } from '../entities/transport/bicycle.entity';
import { ElectricScooter } from '../entities/transport/electric-scooter.entity';
import { TransportFilters } from '../value-objects/transport-filters';

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
