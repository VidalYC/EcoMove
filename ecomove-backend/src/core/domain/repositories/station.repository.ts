import { Station } from '../entities/station.entity';
import { StationAvailability } from '../entities/station-availability.entity';
import { StationFilters } from '../value-objects/station-filters';
import { Coordinate } from '../../../shared/interfaces/coordinate.interface';

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
