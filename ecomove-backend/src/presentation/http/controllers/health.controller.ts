import { Request, Response } from 'express';
import { HealthCheckUseCase } from '../../../core/use-cases/system/health-check.use-case';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';

export class HealthController {
  constructor(
    private readonly healthCheckUseCase: HealthCheckUseCase,
    private readonly logger: LoggerService
  ) {}

  // Health check básico (rápido)
  async basicHealth(req: Request, res: Response): Promise<void> {
    try {
      const requestId = (req as any).requestId;
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        message: 'EcoMove API is running',
        requestId
      });
    } catch (error) {
      this.logger.error('Basic health check failed', error);
      
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Service temporarily unavailable'
      });
    }
  }

  // Health check detallado (completo)
  async detailedHealth(req: Request, res: Response): Promise<void> {
    try {
      const requestId = (req as any).requestId;
      const startTime = Date.now();
      
      this.logger.info('Detailed health check requested', { requestId });
      
      const healthStatus = await this.healthCheckUseCase.execute();
      
      const responseTime = Date.now() - startTime;
      
      this.logger.info('Detailed health check completed', {
        requestId,
        status: healthStatus.status,
        responseTime: `${responseTime}ms`
      });

      // Código de respuesta basado en el estado
      const statusCode = this.getStatusCode(healthStatus.status);
      
      res.status(statusCode).json({
        success: healthStatus.status !== 'unhealthy',
        ...healthStatus,
        requestId,
        responseTime: `${responseTime}ms`
      });

    } catch (error) {
      this.logger.error('Detailed health check failed', error);
      
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Health check de dependencias específicas
  async dependencyHealth(req: Request, res: Response): Promise<void> {
    try {
      const { dependency } = req.params;
      const requestId = (req as any).requestId;
      
      this.logger.info('Dependency health check requested', { 
        requestId, 
        dependency 
      });
      
      const healthStatus = await this.healthCheckUseCase.execute();
      
      let dependencyStatus;
      
      switch (dependency) {
        case 'database':
          dependencyStatus = healthStatus.dependencies.database;
          break;
        case 'pricing':
          dependencyStatus = healthStatus.dependencies.external_services.pricing;
          break;
        case 'logging':
          dependencyStatus = healthStatus.dependencies.external_services.logging;
          break;
        default:
          res.status(400).json({
            success: false,
            message: `Unknown dependency: ${dependency}`,
            availableDependencies: ['database', 'pricing', 'logging']
          });
          return;
      }

      const statusCode = dependencyStatus.status === 'up' ? 200 : 503;
      
      res.status(statusCode).json({
        success: dependencyStatus.status === 'up',
        dependency,
        ...dependencyStatus,
        requestId
      });

    } catch (error) {
      this.logger.error('Dependency health check failed', error);
      
      res.status(503).json({
        success: false,
        message: 'Dependency health check failed'
      });
    }
  }

  private getStatusCode(status: string): number {
    switch (status) {
      case 'healthy': return 200;
      case 'degraded': return 200; // Aún funcional
      case 'unhealthy': return 503;
      default: return 503;
    }
  }
}