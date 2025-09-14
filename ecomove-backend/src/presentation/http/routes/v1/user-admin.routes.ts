// src/presentation/http/routes/v1/user-admin.routes.ts
import { Router, Request, Response } from 'express';
import { UserAdminController } from '../../controllers/user-admin.controller';
import { AdminValidator } from '../../validators/admin.validator';
import { ProfileValidator } from '../../validators/profile.validator';
import { ValidationErrorHandler } from '../../middleware/validation-error-handler.middleware';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';

/**
 * Rutas administrativas de usuarios
 * Responsabilidad única: Definir endpoints para administración de usuarios
 */
export class UserAdminRoutes {
  private router: Router;

  constructor(
    private readonly userAdminController: UserAdminController,
    private readonly authMiddleware: AuthenticationMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Todas las rutas requieren autenticación y permisos de admin
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));
    this.router.use(this.authMiddleware.requireAdmin.bind(this.authMiddleware));

    // Listar todos los usuarios
    this.router.get('/',
      AdminValidator.validatePagination(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.getAllUsers(req, res)
    );

    // Buscar usuarios
    this.router.get('/search',
      AdminValidator.validateSearch(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.searchUsers(req, res)
    );

    // Obtener estadísticas
    this.router.get('/stats',
      (req: Request, res: Response) => this.userAdminController.getStats(req, res)
    );

    // Obtener usuario por ID
    this.router.get('/:id',
      AdminValidator.validateUserId(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.getUserById(req, res)
    );

    // Activar usuario
    this.router.put('/:id/activate',
      AdminValidator.validateUserId(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.activateUser(req, res)
    );

    // Desactivar usuario
    this.router.put('/:id/deactivate',
      AdminValidator.validateUserId(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.deactivateUser(req, res)
    );

    // Actualizar usuario específico
    this.router.put('/:id',
      AdminValidator.validateUserId(),
      ProfileValidator.validateUpdateProfile(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userAdminController.updateUserById(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}