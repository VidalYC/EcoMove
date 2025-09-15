import { Router, Request, Response } from 'express';
import { AuthRoutes } from './auth.routes';
import { UserProfileRoutes } from './user-profile.routes';
import { UserAdminRoutes } from './user-admin.routes';
import { DIContainer } from '../../../../config/container';

/**
 * Enrutador principal de usuarios
 * Responsabilidad única: Combinar todas las rutas relacionadas con usuarios
 */
export class UserRoutes {
  private router: Router;
  private container: DIContainer;

  constructor() {
    this.router = Router();
    this.container = DIContainer.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Rutas de autenticación (públicas)
    const authRoutes = new AuthRoutes(this.container.getAuthController());
    this.router.use('/auth', authRoutes.getRouter());

    // Rutas de perfil (requieren autenticación)
    const profileRoutes = new UserProfileRoutes(
      this.container.getUserProfileController(),
      this.container.getAuthMiddleware()
    );
    this.router.use('/', profileRoutes.getRouter());

    // Rutas de administración (requieren admin)
    const adminRoutes = new UserAdminRoutes(
      this.container.getUserAdminController(),
      this.container.getAuthMiddleware()
    );
    this.router.use('/admin', adminRoutes.getRouter());

    // Health check general
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de usuarios funcionando correctamente',
        timestamp: new Date().toISOString(),
        modules: {
          auth: 'active',
          profile: 'active', 
          admin: 'active'
        },
        endpoints: {
          auth: {
            register: 'POST /api/v1/users/auth/register',
            login: 'POST /api/v1/users/auth/login'
          },
          profile: {
            getProfile: 'GET /api/v1/users/profile',
            updateProfile: 'PUT /api/v1/users/profile',
            changePassword: 'PUT /api/v1/users/change-password'
          },
          admin: {
            list: 'GET /api/v1/users/admin',
            search: 'GET /api/v1/users/admin/search',
            stats: 'GET /api/v1/users/admin/stats',
            getById: 'GET /api/v1/users/admin/:id',
            activate: 'PUT /api/v1/users/admin/:id/activate',
            deactivate: 'PUT /api/v1/users/admin/:id/deactivate',
            update: 'PUT /api/v1/users/admin/:id'
          }
        }
      });
    });
  }

  getRouter(): Router {
    return this.router;
  }
}