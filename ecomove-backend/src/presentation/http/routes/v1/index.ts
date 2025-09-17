import { Router, Request, Response } from 'express';
import { UserRoutes } from './user.routes';
import { LoanRoutes } from './loan.routes';
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

    // Rutas de préstamos
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
            loans: 'active'
          },
          dependencies: healthCheck.dependencies,
          endpoints: {
            users: 'GET /api/v1/users/health',
            loans: 'GET /api/v1/loans/health'
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

// REEMPLAZA completamente el contenido de tu archivo index.ts con este código
// Esto elimina las referencias a TransportRoutes y StationRoutes que están causando problemas