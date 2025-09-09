import { Router, Request, Response, NextFunction } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { UsuarioValidator } from '../middleware/UsuarioValidator';
import { AuthMiddleware } from '../middleware/Auth'; // NUEVO IMPORT
import { IUsuario } from '../types/Usuario';

const router = Router();

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  targetUser?: IUsuario;
  user?: {
    id: number;
    correo: string;
    role: string;
  };
}

// ========== RUTAS PÚBLICAS ==========

// Registro de usuario
router.post('/register',
  UsuarioValidator.validateRegister(),
  UsuarioValidator.handleValidationErrors,
  UsuarioValidator.validateUniqueUser,
  UsuarioController.register
);

// Login de usuario
router.post('/login',
  UsuarioValidator.validateLogin(),
  UsuarioValidator.handleValidationErrors,
  UsuarioController.login
);

// ========== RUTAS PROTEGIDAS (requieren autenticación) ==========

// Obtener perfil del usuario autenticado
router.get('/profile',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  UsuarioController.getProfile
);

// Actualizar perfil del usuario autenticado
router.put('/profile',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  UsuarioValidator.validateUpdateProfile(),
  UsuarioValidator.handleValidationErrors,
  UsuarioController.updateProfile
);

// Cambiar contraseña
router.put('/change-password',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  UsuarioValidator.validateChangePassword(),
  UsuarioValidator.handleValidationErrors,
  UsuarioController.changePassword
);

// ========== RUTAS DE ADMINISTRACIÓN (requieren rol admin) ==========

// Listar todos los usuarios (solo admin)
router.get('/',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioController.getAllUsers
);

// Buscar usuarios (solo admin)
router.get('/search',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioController.searchUsers
);

// Obtener estadísticas (solo admin)
router.get('/stats',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioController.getStats
);

// Obtener usuario por ID (solo admin)
router.get('/:id',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioValidator.validateUserExists,
  (req: Request, res: Response) => {
    const extReq = req as ExtendedRequest;
    res.json({
      success: true,
      data: extReq.targetUser
    });
  }
);

// Activar usuario (solo admin)
router.put('/:id/activate',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioValidator.validateUserExists,
  UsuarioController.activateUser
);

// Desactivar usuario (solo admin)
router.put('/:id/deactivate',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioValidator.validateUserExists,
  UsuarioController.deactivateUser
);

// Actualizar usuario específico (solo admin)
router.put('/:id',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE
  UsuarioValidator.validateUserExists,
  UsuarioValidator.validateUpdateProfile(),
  UsuarioValidator.handleValidationErrors,
  (req: Request, res: Response, next: NextFunction) => {
    const extReq = req as ExtendedRequest;
    req.params.id = extReq.targetUser!.id!.toString();
    next();
  },
  UsuarioController.updateProfile
);

export default router;