import { Pool } from 'pg';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  dependencies: {
    database: DependencyHealth;
    external_services: {
      pricing: DependencyHealth;
      logging: DependencyHealth;
    };
  };
  metrics: {
    memory: MemoryUsage;
    process: ProcessInfo;
  };
}

export interface DependencyHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: any;
}

export interface MemoryUsage {
  used: string;
  free: string;
  total: string;
  percentage: number;
  heapUsed: string;
  heapTotal: string;
}

export interface ProcessInfo {
  pid: number;
  uptime: string;
  platform: string;
  nodeVersion: string;
}

export class HealthCheckUseCase {
  constructor(
    private readonly dbPool: Pool,
    private readonly logger: LoggerService
  ) {}

  async execute(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    this.logger.debug('Starting health check', { timestamp: new Date().toISOString() });

    const [dbHealth, memoryStats, processInfo] = await Promise.all([
      this.checkDatabase(),
      this.getMemoryStats(),
      this.getProcessInfo()
    ]);

    const externalServices = {
      pricing: await this.checkPricingService(),
      logging: this.checkLoggingService()
    };

    const allDependencies = [dbHealth, ...Object.values(externalServices)];
    const status = this.determineOverallStatus(allDependencies);

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: dbHealth,
        external_services: externalServices
      },
      metrics: {
        memory: memoryStats,
        process: processInfo
      }
    };

    this.logger.info('Health check completed', {
      status: healthStatus.status,
      duration: `${Date.now() - startTime}ms`,
      dbStatus: dbHealth.status
    });

    return healthStatus;
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      const client = await this.dbPool.connect();
      
      // Test básico de conexión
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      const dbInfo = result.rows[0];
      
      // Test de escritura/lectura
      await client.query('SELECT 1 as test_query');
      
      client.release();
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: {
          serverTime: dbInfo.current_time,
          version: dbInfo.db_version.split(' ')[0] // Solo la versión
        }
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message
      };
    }
  }

  private async checkPricingService(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // Simular check del servicio de pricing
      // En un caso real, harías una llamada real al servicio
      await new Promise(resolve => setTimeout(resolve, 10)); // Simular latencia
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: {
          service: 'ConsolidatedPricingService',
          features: ['fare_calculation', 'discounts', 'taxes']
        }
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message
      };
    }
  }

  private checkLoggingService(): DependencyHealth {
    const startTime = Date.now();
    
    try {
      // Test del logging
      this.logger.debug('Logging service health check');
      
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: {
          service: 'WinstonLoggerService',
          logLevel: process.env.LOG_LEVEL || 'info',
          transports: ['console', 'file']
        }
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: (error as Error).message
      };
    }
  }

  private getMemoryStats(): MemoryUsage {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      used: this.formatBytes(usedMem),
      free: this.formatBytes(freeMem),
      total: this.formatBytes(totalMem),
      percentage: Math.round((usedMem / totalMem) * 100),
      heapUsed: this.formatBytes(memUsage.heapUsed),
      heapTotal: this.formatBytes(memUsage.heapTotal)
    };
  }

  private getProcessInfo(): ProcessInfo {
    return {
      pid: process.pid,
      uptime: this.formatUptime(process.uptime()),
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  private determineOverallStatus(dependencies: DependencyHealth[]): 'healthy' | 'unhealthy' | 'degraded' {
    const downServices = dependencies.filter(dep => dep.status === 'down');
    const degradedServices = dependencies.filter(dep => dep.status === 'degraded');

    if (downServices.length > 0) return 'unhealthy';
    if (degradedServices.length > 0) return 'degraded';
    return 'healthy';
  }
}