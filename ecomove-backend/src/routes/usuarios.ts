import { Router, Request, Response, NextFunction } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { UsuarioValidator } from '../middleware/UsuarioValidator';
import { IUsuario } from '../types/Usuario';
// import { AuthMiddleware } from '../middleware/auth';

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

// ========== RUTAS PROTEGIDAS ==========

// Obtener perfil del usuario autenticado
router.get('/profile',
  UsuarioController.getProfile
);

// Actualizar perfil del usuario autenticado
router.put('/profile',
  UsuarioValidator.validateUpdateProfile(),
  UsuarioValidator.handleValidationErrors,
  UsuarioController.updateProfile
);

// Cambiar contraseña
router.put('/change-password',
  UsuarioValidator.validateChangePassword(),
  UsuarioValidator.handleValidationErrors,
  UsuarioController.changePassword
);

// ========== RUTAS DE ADMINISTRACIÓN ==========

// Listar todos los usuarios (solo admin)
router.get('/',
  UsuarioController.getAllUsers
);

// Buscar usuarios (solo admin)
router.get('/search',
  UsuarioController.searchUsers
);

// Obtener estadísticas (solo admin)
router.get('/stats',
  UsuarioController.getStats
);

// Obtener usuario por ID (solo admin) - CON CASTING
router.get('/:id',
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
  UsuarioValidator.validateUserExists,
  UsuarioController.activateUser
);

// Desactivar usuario (solo admin)
router.put('/:id/deactivate',
  UsuarioValidator.validateUserExists,
  UsuarioController.deactivateUser
);

// Actualizar usuario específico (solo admin) - CON CASTING
router.put('/:id',
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