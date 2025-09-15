import { Request, Response, NextFunction } from 'express';
import { TransportType, TransportStatus } from '../../../shared/enums/transport.enums';
import { ApiResponse } from '../../../shared/interfaces/api-response';

// Import para express-validator 7.x
const { body, param, query, validationResult } = require('express-validator');

export class TransportValidator {
  // Validation for creating bicycle
  static validateCreateBicycle() {
    return [
      body('model')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('hourlyRate')
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('gearCount')
        .isInt({ min: 1, max: 30 })
        .withMessage('El número de marchas debe estar entre 1 y 30'),

      body('brakeType')
        .isIn(['Disco', 'V-Brake', 'Cantilever', 'Tambor'])
        .withMessage('Tipo de freno no válido'),

      body('stationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      body('acquisitionDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha de adquisición debe ser válida')
    ];
  }

  // Validation for creating electric scooter
  static validateCreateElectricScooter() {
    return [
      body('model')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('hourlyRate')
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('maxSpeed')
        .isFloat({ min: 10, max: 50 })
        .withMessage('La velocidad máxima debe estar entre 10 y 50 km/h'),

      body('range')
        .isFloat({ min: 10, max: 100 })
        .withMessage('La autonomía debe estar entre 10 y 100 km'),

      body('batteryLevel')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('El nivel de batería debe estar entre 0 y 100%'),

      body('stationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      body('acquisitionDate')
        .optional()
        .isISO8601()
        .withMessage('Fecha de adquisición debe ser válida')
    ];
  }

  // Validation for updating transport
  static validateUpdate() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('model')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('hourlyRate')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('status')
        .optional()
        .isIn(Object.values(TransportStatus))
        .withMessage(`Estado debe ser uno de: ${Object.values(TransportStatus).join(', ')}`),

      body('stationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido')
    ];
  }

  // Validation for changing status
  static validateChangeStatus() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('status')
        .isIn(Object.values(TransportStatus))
        .withMessage(`Estado debe ser uno de: ${Object.values(TransportStatus).join(', ')}`)
    ];
  }

  // Validation for moving to station
  static validateMoveToStation() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('stationId')
        .isInt({ min: 1 })
        .withMessage('ID de estación requerido y debe ser un número válido')
    ];
  }

  // Validation for updating battery level
  static validateUpdateBattery() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('batteryLevel')
        .isInt({ min: 0, max: 100 })
        .withMessage('El nivel de batería debe estar entre 0 y 100')
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

      query('type')
        .optional()
        .isIn(Object.values(TransportType))
        .withMessage(`Tipo debe ser uno de: ${Object.values(TransportType).join(', ')}`),

      query('status')
        .optional()
        .isIn(Object.values(TransportStatus))
        .withMessage(`Estado debe ser uno de: ${Object.values(TransportStatus).join(', ')}`),

      query('stationId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      query('minRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Tarifa mínima debe ser mayor o igual a 0'),

      query('maxRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Tarifa máxima debe ser mayor o igual a 0')
    ];
  }

  // Validation for finding available transports
  static validateFindAvailable() {
    return [
      query('stationId')
        .isInt({ min: 1 })
        .withMessage('ID de estación requerido y debe ser un número válido'),

      query('type')
        .optional()
        .isIn(Object.values(TransportType))
        .withMessage(`Tipo debe ser uno de: ${Object.values(TransportType).join(', ')}`)
    ];
  }

  // Validation for ID parameter
  static validateId() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido')
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
}