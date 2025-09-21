// src/infrastructure/services/memory-cache.service.ts
import { LoggerService } from './winston-logger.service';

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  del(key: string): void;
  exists(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
}

interface CacheEntry<T> {
  value: T;
  expireAt: number;
  createdAt: number;
}

export interface CacheStats {
  totalKeys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: string;
}

export class MemoryCacheService implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly logger: LoggerService,
    private readonly defaultTTL = 300, // 5 minutos
    private readonly maxKeys = 10000 // Máximo 10k keys
  ) {
    // Limpiar cache expirado cada minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    
    this.logger.info('Memory cache initialized', {
      defaultTTL: this.defaultTTL,
      maxKeys: this.maxKeys
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      this.logger.debug('Cache miss', { key });
      return null;
    }

    // Verificar si expiró
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      this.misses++;
      this.logger.debug('Cache expired', { key });
      return null;
    }

    this.hits++;
    this.logger.debug('Cache hit', { key, age: `${Date.now() - entry.createdAt}ms` });
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = this.defaultTTL): void {
    // Si llegamos al límite, remover entradas más antiguas
    if (this.cache.size >= this.maxKeys) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      value,
      expireAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now()
    };

    this.cache.set(key, entry);
    
    this.logger.debug('Cache set', { 
      key, 
      ttl: ttlSeconds,
      size: this.formatSize(JSON.stringify(value).length)
    });
  }

  del(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache deleted', { key });
    }
  }

  exists(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    const keysCleared = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    this.logger.info('Cache cleared', { keysCleared });
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      totalKeys: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expireAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug('Cache cleanup completed', { expiredKeys: expiredCount });
    }
  }

  private evictOldest(): void {
    const oldest = Array.from(this.cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    
    if (oldest) {
      this.cache.delete(oldest[0]);
      this.logger.debug('Cache evicted oldest key', { key: oldest[0] });
    }
  }

  private estimateMemoryUsage(): string {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 32; // Overhead aproximado
    }
    
    return this.formatSize(totalSize);
  }

  private formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Método para generar claves consistentes
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.clear();
  }
}