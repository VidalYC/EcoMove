// src/presentation/http/validators/admin.validator.ts
const { param, query } = require('express-validator');
/**
 * Validador para operaciones administrativas
 * Responsabilidad única: Validar consultas y operaciones de administración
 */
export class AdminValidator {
  
  static validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
        .toInt()
    ];
  }

  static validateSearch() {
    return [
      query('term')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El término de búsqueda debe tener entre 2 y 50 caracteres')
        .escape(),

      ...this.validatePagination()
    ];
  }

  static validateUserId() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
        .toInt()
    ];
  }
}
