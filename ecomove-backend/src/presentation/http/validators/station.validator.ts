import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/interfaces/api-response';

const { body, param, query, validationResult } = require('express-validator');

export class StationValidator {
  // Validation for creating station
  static validateCreate() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

      body('address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),

      body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180'),

      body('maxCapacity')
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe estar entre 1 y 100')
    ];
  }

  // Validation for updating station
  static validateUpdate() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

      body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),

      body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180'),

      body('maxCapacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe estar entre 1 y 100')
    ];
  }

  // Validation for nearby search
  static validateFindNearby() {
    return [
      query('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      query('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180'),

      query('radius')
        .isFloat({ min: 0.1, max: 50 })
        .withMessage('El radio debe estar entre 0.1 y 50 km'),

      query('limit')
        .optional()  // ← AGREGAR .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('El límite debe estar entre 1 y 50')
    ];
  }
  // Validation for route calculation
  static validateCalculateRoute() {
    return [
      query('origin')
        .isInt({ min: 1 })
        .withMessage('ID de estación origen requerido y debe ser un número válido'),

      query('destination')
        .isInt({ min: 1 })
        .withMessage('ID de estación destino requerido y debe ser un número válido')
    ];
  }

  // Validation for query filters
  static validateGetAll() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser mayor a 0'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),

      query('active')
        .optional()
        .isBoolean()
        .withMessage('El estado activo debe ser true o false'),

      query('minCapacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Capacidad mínima debe ser mayor a 0'),

      query('maxCapacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Capacidad máxima debe ser mayor a 0'),

      query('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      query('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180'),

      query('radiusKm')
        .optional()
        .isFloat({ min: 0.1, max: 50 })
        .withMessage('El radio debe estar entre 0.1 y 50 km')
    ];
  }

  // Validation for ID parameter
  static validateId() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido')
    ];
  }

  // Handle validation errors middleware
  static handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Errores de validación',
        errors: errors.array().map((error: any) => error.msg)
      };
      res.status(400).json(response);
      return;
    }
    next();
  }

  // Admin role validation middleware
  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;
    
    if (!user || user.role !== 'admin') {
      const response: ApiResponse = {
        success: false,
        message: 'Se requieren permisos de administrador'
      };
      res.status(403).json(response);
      return;
    }
    
    next();
  }

  // Validate different stations for route
  static validateDifferentStations(req: Request, res: Response, next: NextFunction): void {
    const { origin, destination } = req.query;
    
    if (origin === destination) {
      const response: ApiResponse = {
        success: false,
        message: 'La estación de origen y destino deben ser diferentes'
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  }
}

