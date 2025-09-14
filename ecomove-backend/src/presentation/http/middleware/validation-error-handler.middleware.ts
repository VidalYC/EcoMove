// src/presentation/http/middleware/validation-error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware para manejo de errores de validación
 * Responsabilidad única: Procesar y formatear errores de validación
 */
export class ValidationErrorHandler {
  
  static handle = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : error.type,
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }));

      res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: formattedErrors,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    next();
  };
}