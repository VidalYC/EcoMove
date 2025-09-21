import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller';
import { DIContainer } from '../../../../config/container';

export class HealthRoutes {
  private router: Router;
  private healthController: HealthController;

  constructor() {
    this.router = Router();
    const container = DIContainer.getInstance();
    
    this.healthController = new HealthController(
      container.getHealthCheckUseCase(),
      container.getLogger()
    );
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check básico - muy rápido (para load balancers)
    this.router.get('/', (req, res) => this.healthController.basicHealth(req, res));

    this.router.get('/cache', (req, res) => this.healthController.cacheStats(req, res));
    
    // Health check básico alternativo
    this.router.get('/basic', (req, res) => this.healthController.basicHealth(req, res));
    
    // Health check detallado - completo con métricas
    this.router.get('/detailed', (req, res) => this.healthController.detailedHealth(req, res));
    
    // Health check de dependencias específicas
    this.router.get('/dependency/:dependency', (req, res) => this.healthController.dependencyHealth(req, res));
    
    // Alias comunes
    this.router.get('/status', (req, res) => this.healthController.detailedHealth(req, res));
    this.router.get('/ping', (req, res) => this.healthController.basicHealth(req, res));
  }

  getRouter(): Router {
    return this.router;
  }
}