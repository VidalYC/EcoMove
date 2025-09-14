// src/presentation/http/validators/auth.validator.ts
const { body } = require('express-validator');

/**
 * Validador para operaciones de autenticación
 * Responsabilidad única: Validar datos de registro y login
 */
export class AuthValidator {
  
  static validateRegister() {
    return [
      body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

      body('correo')
        .trim()
        .isEmail()
        .withMessage('Debe ser un correo electrónico válido')
        .normalizeEmail(),

      body('documento')
        .trim()
        .isLength({ min: 8, max: 15 })
        .withMessage('El documento debe tener entre 8 y 15 caracteres')
        .matches(/^[0-9]+$/)
        .withMessage('El documento solo puede contener números'),

      body('telefono')
        .trim()
        .isMobilePhone('es-CO')
        .withMessage('Debe ser un número de teléfono válido de Colombia'),

      body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    ];
  }

  static validateLogin() {
    return [
      body('correo')
        .trim()
        .isEmail()
        .withMessage('Debe ser un correo electrónico válido')
        .normalizeEmail(),

      body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
    ];
  }
}