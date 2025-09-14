// src/presentation/http/routes/v1/user-profile.routes.ts
import { Router, Request, Response } from 'express';
import { UserProfileController } from '../../controllers/user-profile.controller';
import { ProfileValidator } from '../../validators/profile.validator';
import { ValidationErrorHandler } from '../../middleware/validation-error-handler.middleware';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';

/**
 * Rutas de perfil de usuario
 * Responsabilidad única: Definir endpoints para gestión de perfil
 */
export class UserProfileRoutes {
  private router: Router;

  constructor(
    private readonly userProfileController: UserProfileController,
    private readonly authMiddleware: AuthenticationMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // Obtener perfil del usuario autenticado
    this.router.get('/profile',
      (req: Request, res: Response) => this.userProfileController.getProfile(req, res)
    );

    // Actualizar perfil del usuario autenticado
    this.router.put('/profile',
      ProfileValidator.validateUpdateProfile(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userProfileController.updateProfile(req, res)
    );

    // Cambiar contraseña
    this.router.put('/change-password',
      ProfileValidator.validateChangePassword(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.userProfileController.changePassword(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}