import { Router, Request, Response } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { AuthValidator } from '../../validators/auth.validator';
import { ValidationErrorHandler } from '../../middleware/validation-error-handler.middleware';

/**
 * Rutas de autenticación
 * Responsabilidad única: Definir endpoints para registro y login
 */
export class AuthRoutes {
  private router: Router;

  constructor(private readonly authController: AuthController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Registro de usuario
    this.router.post('/register',
      AuthValidator.validateRegister(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.authController.register(req, res)
    );

    // Login de usuario
    this.router.post('/login', 
      AuthValidator.validateLogin(),
      ValidationErrorHandler.handle,
      (req: Request, res: Response) => this.authController.login(req, res)
    );

    // Health check de autenticación
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de autenticación funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          register: 'POST /api/v1/auth/register',
          login: 'POST /api/v1/auth/login'
        }
      });
    });
  }

  getRouter(): Router {
    return this.router;
  }
}