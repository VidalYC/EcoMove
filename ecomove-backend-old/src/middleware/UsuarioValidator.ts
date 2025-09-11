import { Request, Response, NextFunction } from 'express';
const { body, validationResult } = require('express-validator');
import { UsuarioModel } from '../models/UsuarioModel';
import { IUsuario } from '../types/Usuario';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  user?: {
    id: number;
    correo: string;
    role: string;
  };
  targetUser?: IUsuario;
}

export class UsuarioValidator {
  // Validaciones para registro
  static validateRegister() {
    return [
      body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

      body('correo')
        .trim()
        .isEmail()
        .withMessage('Debe ser un correo válido')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('El correo no puede exceder 255 caracteres'),

      body('documento')
        .trim()
        .isLength({ min: 7, max: 10 })
        .withMessage('El documento debe tener entre 7 y 10 dígitos')
        .isNumeric()
        .withMessage('El documento solo puede contener números'),

      body('telefono')
        .optional()
        .trim()
        .isMobilePhone('es-CO')
        .withMessage('Debe ser un teléfono válido de Colombia'),

      body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número'),

      body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('El rol debe ser "user" o "admin"')
    ];
  }

  // Validaciones para login
  static validateLogin() {
    return [
      body('correo')
        .trim()
        .isEmail()
        .withMessage('Debe ser un correo válido')
        .normalizeEmail(),

      body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
    ];
  }

  // Validaciones para actualizar perfil
  static validateUpdateProfile() {
    return [
      body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

      body('correo')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Debe ser un correo válido')
        .normalizeEmail(),

      body('telefono')
        .optional()
        .trim()
        .isMobilePhone('es-CO')
        .withMessage('Debe ser un teléfono válido de Colombia'),

      body('estado')
        .optional()
        .isIn(['active', 'inactive', 'suspended'])
        .withMessage('El estado debe ser válido'),

      body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('El rol debe ser "user" o "admin"')
    ];
  }

  // Validaciones para cambio de contraseña
  static validateChangePassword() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),

      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('La nueva contraseña debe tener mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número'),

      body('confirmPassword')
        .custom((value: any, { req }: { req: any }) => {
            if (value !== req.body.newPassword) {
            throw new Error('Las contraseñas no coinciden');
            }
            return true;
        })
    ];
  }

  // Validaciones para búsqueda
  static validateSearch() {
    return [
      body('q')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('El término de búsqueda debe tener mínimo 2 caracteres'),

      body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número mayor a 0'),

      body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100')
    ];
  }

  // Middleware para manejar errores de validación
  static handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array().map((error: any) => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg
        }))
        });
        return;
    }
    
    next();
    }

  // Validar que el usuario no exista (para registro)
  static async validateUniqueUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, documento } = req.body;

      // Verificar correo único
      const existingEmail = await UsuarioModel.findByEmail(correo);
      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este correo electrónico'
        });
        return;
      }

      // Verificar documento único
      const existingDoc = await UsuarioModel.findByDocumento(documento);
      if (existingDoc) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este documento'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error en validateUniqueUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

    // Validar que el usuario exista
  static async validateUserExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      const user = await UsuarioModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      // Agregar usuario al request para uso posterior
      const extReq = req as ExtendedRequest;
      extReq.targetUser = user; // ← CAMBIO AQUÍ
      next();
    } catch (error) {
      console.error('Error en validateUserExists:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Validar permisos de administrador
  static validateAdminRole(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    if (!extReq.user || extReq.user.role !== 'admin') { // ← CAMBIO AQUÍ
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }
    
    next();
  }

  // Validar que el usuario pueda modificar solo su propio perfil (o sea admin)
  static validateOwnershipOrAdmin(req: Request, res: Response, next: NextFunction): void {
    const { id } = req.params;
    const userId = parseInt(id);
    const extReq = req as ExtendedRequest;
    const currentUser = extReq.user; // ← CAMBIO AQUÍ

    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Permitir si es admin o si está modificando su propio perfil
    if (currentUser.role === 'admin' || currentUser.id === userId) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción'
    });
  }
}
