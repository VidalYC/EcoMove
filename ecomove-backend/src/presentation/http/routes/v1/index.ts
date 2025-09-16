import { Router, Request, Response } from 'express';
import { UserRoutes } from './user.routes';
import { TransportRoutes } from './transport.routes';
import { StationRoutes } from './station.routes';
import { LoanRoutes } from './loan.routes'; // NUEVO
import { DIContainer } from '../../../../config/container';

export class MainRoutes {
  private router: Router;
  private container: DIContainer;

  constructor() {
    this.router = Router();
    this.container = DIContainer.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Rutas de usuarios
    const userRoutes = new UserRoutes();
    this.router.use('/users', userRoutes.getRouter());

    // Rutas de transportes
    const transportRoutes = new TransportRoutes(
      this.container.getTransportController(),
      this.container.getAuthMiddleware()
    );
    this.router.use('/transports', transportRoutes.getRouter());

    // Rutas de estaciones
    const stationRoutes = new StationRoutes(
      this.container.getStationController(),
      this.container.getAuthMiddleware()
    );
    this.router.use('/stations', stationRoutes.getRouter());

    // Rutas de préstamos (NUEVO)
    const loanRoutes = new LoanRoutes(
      this.container.getLoanController(),
      this.container.getAuthMiddleware()
    );
    this.router.use('/loans', loanRoutes.getRouter());

    // Health check general del API
    this.router.get('/health', async (req: Request, res: Response) => {
      try {
        const healthCheck = await this.container.healthCheck();
        
        res.json({
          success: true,
          message: 'EcoMove API funcionando correctamente',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          architecture: 'Clean Architecture + SOLID Principles',
          status: healthCheck.status,
          modules: {
            users: 'active',
            transports: 'active',
            stations: 'active',
            loans: 'active' // NUEVO
          },
          dependencies: healthCheck.dependencies,
          endpoints: {
            users: 'GET /api/v1/users/health',
            transports: 'GET /api/v1/transports/health',
            stations: 'GET /api/v1/stations/health',
            loans: 'GET /api/v1/loans/health' // NUEVO
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error en el health check',
          timestamp: new Date().toISOString(),
          error: (error as Error).message
        });
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }
}

;