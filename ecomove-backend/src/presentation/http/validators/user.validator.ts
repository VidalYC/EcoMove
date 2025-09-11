import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class UserValidator {
  // Validaciones para registro
  static validateRegister() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

      body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email cannot exceed 255 characters'),

      body('document')
        .trim()
        .isLength({ min: 7, max: 12 })
        .withMessage('Document must be between 7 and 12 digits')
        .isNumeric()
        .withMessage('Document can only contain numbers'),

      body('phone')
        .optional()
        .trim()
        .matches(/^(\+57)?[3][0-9]{9}$/)
        .withMessage('Must be a valid Colombian phone number'),

      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least: 1 lowercase, 1 uppercase and 1 number'),

      body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be "user" or "admin"')
    ];
  }

  // Validaciones para login
  static validateLogin() {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),

      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  // Validaciones para actualizar perfil
  static validateUpdateProfile() {
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

      body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),

      body('phone')
        .optional()
        .trim()
        .matches(/^(\+57)?[3][0-9]{9}$/)
        .withMessage('Must be a valid Colombian phone number')
    ];
  }

  // Validaciones para cambio de contraseña
  static validateChangePassword() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least: 1 lowercase, 1 uppercase and 1 number')
    ];
  }

  // Validaciones para búsqueda
  static validateSearch() {
    return [
      query('q')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters long'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive number'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ];
  }

  // Validaciones para parámetros de ID
  static validateUserId() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive number')
    ];
  }

  // Middleware para manejar errores de validación
  static handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error: any) => error.msg);
      throw new ValidationException('Validation failed', errorMessages);
    }
    
    next();
  }
}