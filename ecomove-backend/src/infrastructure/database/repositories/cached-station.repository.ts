import { StationRepository } from '../../../core/domain/repositories/station.repository';
import { Station } from '../../../core/domain/entities/station.entity';
import { StationAvailability } from '../../../core/domain/entities/station-availability.entity';
import { StationFilters } from '../../../core/domain/value-objects/station-filters';
import { Coordinate } from '../../../shared/interfaces/coordinate.interface';
import { CacheService, MemoryCacheService } from '../../services/memory-cache.service';
import { LoggerService } from '../../services/winston-logger.service';

export class CachedStationRepository implements StationRepository {
  private readonly CACHE_TTL = {
    SINGLE_STATION: 600,       // 10 minutos (estaciones cambian poco)
    STATION_LIST: 300,         // 5 minutos
    NEARBY_STATIONS: 180,      // 3 minutos (consulta frecuente)
    AVAILABILITY: 60,          // 1 minuto (cambia frecuentemente)
    STATS: 300                 // 5 minutos
  };

  constructor(
    private readonly baseRepository: StationRepository,
    private readonly cache: CacheService,
    private readonly logger: LoggerService
  ) {}

  async findById(id: number): Promise<Station | null> {
    const cacheKey = MemoryCacheService.generateKey('station', 'id', id);
    
    const cached = this.cache.get<Station>(cacheKey);
    if (cached) {
      this.logger.debug('Station cache hit', { id });
      return cached;
    }

    this.logger.debug('Station cache miss', { id });
    const station = await this.baseRepository.findById(id);
    
    if (station) {
      this.cache.set(cacheKey, station, this.CACHE_TTL.SINGLE_STATION);
      this.logger.debug('Station cached', { id });
    }

    return station;
  }

  async findAll(page: number, limit: number, filters?: StationFilters): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const filterHash = filters ? this.hashFilters(filters) : 'none';
    const cacheKey = MemoryCacheService.generateKey('station', 'list', page, limit, filterHash);

    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug('Station list cache hit', { page, limit });
      return cached;
    }

    this.logger.debug('Station list cache miss', { page, limit });
    const result = await this.baseRepository.findAll(page, limit, filters);
    this.cache.set(cacheKey, result, this.CACHE_TTL.STATION_LIST);

    return result;
  }

  async findNearby(coordinate: Coordinate, radiusKm: number, limit?: number): Promise<Station[]> {
    const cacheKey = MemoryCacheService.generateKey(
      'station', 
      'nearby', 
      `${coordinate.latitude}-${coordinate.longitude}`, 
      radiusKm, 
      limit || 10
    );

    const cached = this.cache.get<Station[]>(cacheKey);
    if (cached) {
      this.logger.debug('Nearby stations cache hit', { coordinate, radiusKm, limit });
      return cached;
    }

    this.logger.debug('Nearby stations cache miss', { coordinate, radiusKm, limit });
    const stations = await this.baseRepository.findNearby(coordinate, radiusKm, limit);
    this.cache.set(cacheKey, stations, this.CACHE_TTL.NEARBY_STATIONS);

    return stations;
  }

  async getAvailability(id: number): Promise<StationAvailability | null> {
    const cacheKey = MemoryCacheService.generateKey('station', 'availability', id);

    const cached = this.cache.get<StationAvailability>(cacheKey);
    if (cached) {
      this.logger.debug('Station availability cache hit', { id });
      return cached;
    }

    this.logger.debug('Station availability cache miss', { id });
    const availability = await this.baseRepository.getAvailability(id);
    
    if (availability) {
      this.cache.set(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
    }

    return availability;
  }

  async getStats(): Promise<{
    totalStations: number;
    activeStations: number;
    inactiveStations: number;
    totalCapacity: number;
    averageOccupancy: number;
  }> {
    const cacheKey = MemoryCacheService.generateKey('station', 'stats');

    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug('Station stats cache hit');
      return cached;
    }

    this.logger.debug('Station stats cache miss');
    const stats = await this.baseRepository.getStats();
    this.cache.set(cacheKey, stats, this.CACHE_TTL.STATS);

    return stats;
  }

  // Métodos que invalidan cache
  async create(data: {
    name: string;
    address: string;
    coordinate: Coordinate;
    maxCapacity: number;
  }): Promise<Station> {
    const result = await this.baseRepository.create(data);
    this.invalidateListCaches();
    return result;
  }

  async update(id: number, updates: {
    name?: string;
    address?: string;
    coordinate?: Coordinate;
    maxCapacity?: number;
  }): Promise<Station | null> {
    const result = await this.baseRepository.update(id, updates);
    if (result) {
      this.invalidateStationCaches(id);
    }
    return result;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.baseRepository.delete(id);
    if (result) {
      this.invalidateStationCaches(id);
    }
    return result;
  }

  // Delegación directa de otros métodos
  async activate(id: number): Promise<boolean> {
    const result = await this.baseRepository.activate(id);
    this.invalidateStationCaches(id);
    return result;
  }

  async deactivate(id: number): Promise<boolean> {
    const result = await this.baseRepository.deactivate(id);
    this.invalidateStationCaches(id);
    return result;
  }

  async findWithAvailableTransports(transportType?: string): Promise<Station[]> {
    return this.baseRepository.findWithAvailableTransports(transportType);
  }

  async getRankingByOccupancy(limit?: number): Promise<{
    station: Station;
    occupancyPercentage: number;
    totalTransports: number;
  }[]> {
    return this.baseRepository.getRankingByOccupancy(limit);
  }

  async calculateRoute(originId: number, destinationId: number): Promise<{
    origin: Station;
    destination: Station;
    distance: number;
    estimatedTime: number;
  } | null> {
    return this.baseRepository.calculateRoute(originId, destinationId);
  }

  // Métodos de invalidación
  private invalidateStationCaches(id: number): void {
    const stationKey = MemoryCacheService.generateKey('station', 'id', id);
    this.cache.del(stationKey);
    this.invalidateListCaches();
    this.logger.debug('Station caches invalidated', { stationId: id });
  }

  private invalidateListCaches(): void {
    const statsKey = MemoryCacheService.generateKey('station', 'stats');
    this.cache.del(statsKey);
    this.logger.debug('Station list caches invalidated');
  }

  private hashFilters(filters: StationFilters): string {
    return Buffer.from(JSON.stringify(filters)).toString('base64').substring(0, 8);
  }
}