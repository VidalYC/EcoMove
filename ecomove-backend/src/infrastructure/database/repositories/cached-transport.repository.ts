import { TransportRepository } from '../../../core/domain/repositories/transport.repository';
import { Transport } from '../../../core/domain/entities/transport.entity';
import { TransportFilters } from '../../../core/domain/value-objects/transport-filters';
import { TransportStatus, TransportType } from '../../../shared/enums/transport.enums';
import { Bicycle } from '../../../core/domain/entities/bicycle.entity';
import { ElectricScooter } from '../../../core/domain/entities/electric-scooter.entity';
import { CacheService, MemoryCacheService } from '../../services/memory-cache.service';
import { LoggerService } from '../../services/winston-logger.service';

export class CachedTransportRepository implements TransportRepository {
  private readonly CACHE_TTL = {
    SINGLE_TRANSPORT: 300,     // 5 minutos
    TRANSPORT_LIST: 120,       // 2 minutos  
    AVAILABLE_TRANSPORTS: 60,  // 1 minuto
    STATS: 180                 // 3 minutos
  };

  constructor(
    private readonly baseRepository: TransportRepository,
    private readonly cache: CacheService,
    private readonly logger: LoggerService
  ) {}

  // CRUD básico con cache
  async findById(id: number): Promise<Transport | null> {
    const cacheKey = MemoryCacheService.generateKey('transport', 'id', id);
    
    const cached = this.cache.get<Transport>(cacheKey);
    if (cached) {
      this.logger.debug('Transport cache hit', { id });
      return cached;
    }

    const transport = await this.baseRepository.findById(id);
    
    if (transport) {
      this.cache.set(cacheKey, transport, this.CACHE_TTL.SINGLE_TRANSPORT);
      this.logger.debug('Transport cached', { id });
    }

    return transport;
  }

  async findAll(page: number, limit: number, filters?: TransportFilters): Promise<{
    transports: Transport[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const filterHash = filters ? this.hashFilters(filters) : 'none';
    const cacheKey = MemoryCacheService.generateKey('transport', 'list', page, limit, filterHash);

    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug('Transport list cache hit', { page, limit, filterHash });
      return cached;
    }

    this.logger.debug('Transport list cache miss', { page, limit, filterHash });
    const result = await this.baseRepository.findAll(page, limit, filters);
    this.cache.set(cacheKey, result, this.CACHE_TTL.TRANSPORT_LIST);

    return result;
  }

  async findAvailableByStation(stationId: number, type?: TransportType): Promise<Transport[]> {
    const cacheKey = MemoryCacheService.generateKey('transport', 'available-station', stationId, type || 'all');

    const cached = this.cache.get<Transport[]>(cacheKey);
    if (cached) {
      this.logger.debug('Available transports by station cache hit', { stationId, type });
      return cached;
    }

    this.logger.debug('Available transports by station cache miss', { stationId, type });
    const transports = await this.baseRepository.findAvailableByStation(stationId, type);
    this.cache.set(cacheKey, transports, this.CACHE_TTL.AVAILABLE_TRANSPORTS);

    return transports;
  }

  async getStats(): Promise<{
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
  }> {
    const cacheKey = MemoryCacheService.generateKey('transport', 'stats');

    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug('Transport stats cache hit');
      return cached;
    }

    this.logger.debug('Transport stats cache miss');
    const stats = await this.baseRepository.getStats();
    this.cache.set(cacheKey, stats, this.CACHE_TTL.STATS);

    return stats;
  }

  // Métodos que invalidan cache
  async create(transport: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transport> {
    const result = await this.baseRepository.create(transport);
    this.invalidateListCaches();
    return result;
  }

  async update(id: number, updates: Partial<Transport>): Promise<Transport | null> {
    const result = await this.baseRepository.update(id, updates);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.baseRepository.delete(id);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  async updateStatus(id: number, status: TransportStatus): Promise<boolean> {
    const result = await this.baseRepository.updateStatus(id, status);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  async updateStation(id: number, stationId: number): Promise<boolean> {
    const result = await this.baseRepository.updateStation(id, stationId);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  async updateBatteryLevel(id: number, level: number): Promise<boolean> {
    const result = await this.baseRepository.updateBatteryLevel(id, level);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  // Delegación directa de métodos especializados
  async createBicycle(data: {
    model: string;
    hourlyRate: number;
    gearCount: number;
    brakeType: string;
    stationId?: number;
  }): Promise<Bicycle> {
    const result = await this.baseRepository.createBicycle(data);
    this.invalidateListCaches();
    return result;
  }

  async createElectricScooter(data: {
    model: string;
    hourlyRate: number;
    maxSpeed: number;
    range: number;
    stationId?: number;
  }): Promise<ElectricScooter> {
    const result = await this.baseRepository.createElectricScooter(data);
    this.invalidateListCaches();
    return result;
  }

  // Métodos de invalidación de cache
  private invalidateTransportCaches(id: number): void {
    // Invalidar cache del transporte específico
    const transportKey = MemoryCacheService.generateKey('transport', 'id', id);
    this.cache.del(transportKey);
    
    // Invalidar listas y estadísticas
    this.invalidateListCaches();
    this.invalidateStatsCaches();
    
    this.logger.debug('Transport caches invalidated', { transportId: id });
  }

  private invalidateListCaches(): void {
    // Las listas expiran por TTL - podríamos implementar un sistema más sofisticado
    const statsKey = MemoryCacheService.generateKey('transport', 'stats');
    this.cache.del(statsKey);
    this.logger.debug('Transport list caches invalidated');
  }

  private invalidateStatsCaches(): void {
    const statsKey = MemoryCacheService.generateKey('transport', 'stats');
    this.cache.del(statsKey);
    this.logger.debug('Transport stats cache invalidated');
  }

  private hashFilters(filters: TransportFilters): string {
    return Buffer.from(JSON.stringify(filters)).toString('base64').substring(0, 8);
  }
}