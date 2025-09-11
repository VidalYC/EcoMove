import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { UserValidator } from '../../validators/user.validator';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';
import { DIContainer } from '../../../../config/container';

export class UserRoutes {
  static create(): Router {
    const router = Router();
    const container = DIContainer.getInstance();
    
    // Obtener controller del container
    const userController = container.getUserController();
    const authMiddleware = container.getAuthMiddleware();

    // ========== RUTAS PÚBLICAS - FORMATO ORIGINAL ==========

    // Registro de usuario (formato original: nombre, correo, documento, telefono, password)
    router.post('/register',
      UserValidator.validateRegister(),
      UserValidator.handleValidationErrors,
      (req, res) => userController.register(req, res)
    );

    // Login de usuario (formato original: correo, password)
    router.post('/login', 
      UserValidator.validateLogin(),
      UserValidator.handleValidationErrors,
      (req, res) => userController.login(req, res)
    );

    // ========== RUTAS PROTEGIDAS ==========

    // Obtener perfil del usuario autenticado
    router.get('/profile',
      authMiddleware.authenticate.bind(authMiddleware),
      (req, res) => userController.getProfile(req, res)
    );

    // Health check específico para usuarios
    router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Módulo de usuarios funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          register: 'POST /api/v1/users/register',
          login: 'POST /api/v1/users/login', 
          profile: 'GET /api/v1/users/profile'
        }
      });
    });

    return router;
  }
}