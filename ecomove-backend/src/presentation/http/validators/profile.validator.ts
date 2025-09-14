// src/presentation/http/validators/profile.validator.ts
import { body, ValidationChain } from 'express-validator';

/**
 * Validador para operaciones de perfil de usuario
 * Responsabilidad única: Validar actualizaciones de perfil y cambio de contraseña
 */
export class ProfileValidator {
  
  static validateUpdateProfile(): ValidationChain[] {
    return [
      body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

      body('telefono')
        .optional()
        .trim()
        .isMobilePhone('es-CO')
        .withMessage('Debe ser un número de teléfono válido de Colombia'),

      body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('El rol debe ser user o admin')
    ];
  }

  static validateChangePassword(): ValidationChain[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),

      body('newPassword')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),

      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Las contraseñas no coinciden');
          }
          return true;
        })
    ];
  }
}