import { Request, Response, NextFunction } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { LoanStatus } from '../../../shared/enums/loan.enums';
import { PaymentMethod } from '../../../shared/enums/payment.enums';
import { ApiResponse } from '../../../shared/interfaces/api-response';

export class LoanValidator {
  
  // Validaciones para crear préstamo
  static validateCreateLoan() {
    return [
      body('usuario_id')
        .isInt({ min: 1 })
        .withMessage('usuario_id debe ser un número entero positivo'),
      
      body('transporte_id')
        .isInt({ min: 1 })
        .withMessage('transporte_id debe ser un número entero positivo'),
      
      body('estacion_origen_id')
        .isInt({ min: 1 })
        .withMessage('estacion_origen_id debe ser un número entero positivo'),
      
      body('duracion_estimada')
        .optional()
        .isInt({ min: 1, max: 1440 })
        .withMessage('duracion_estimada debe estar entre 1 y 1440 minutos (24 horas)')
    ];
  }

  // Validaciones para completar préstamo
  static validateCompleteLoan() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de préstamo debe ser un número válido'),
        
      body('estacion_destino_id')
        .isInt({ min: 1 })
        .withMessage('estacion_destino_id debe ser un número entero positivo'),
      
      body('costo_total')
        .isFloat({ min: 0 })
        .withMessage('costo_total debe ser un número mayor o igual a 0'),
      
      body('metodo_pago')
        .isIn(Object.values(PaymentMethod))
        .withMessage(`metodo_pago debe ser uno de: ${Object.values(PaymentMethod).join(', ')}`)
    ];
  }

  // Validaciones para extender préstamo
  static validateExtendLoan() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de préstamo debe ser un número válido'),
        
      body('minutos_adicionales')
        .isInt({ min: 1, max: 720 })
        .withMessage('minutos_adicionales debe estar entre 1 y 720 minutos (12 horas)'),
      
      body('costo_adicional')
        .isFloat({ min: 0 })
        .withMessage('costo_adicional debe ser un número mayor o igual a 0')
    ];
  }

  // Validaciones para obtener préstamo por ID
  static validateLoanId() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de préstamo debe ser un número válido')
    ];
  }

  // Validaciones para filtros de préstamos
  static validateLoanFilters() {
    return [
      query('usuario_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('usuario_id debe ser un número entero positivo'),
      
      query('transporte_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('transporte_id debe ser un número entero positivo'),
      
      query('estacion_origen_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('estacion_origen_id debe ser un número entero positivo'),
      
      query('estacion_destino_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('estacion_destino_id debe ser un número entero positivo'),
      
      query('estado')
        .optional()
        .isIn(Object.values(LoanStatus))
        .withMessage(`estado debe ser uno de: ${Object.values(LoanStatus).join(', ')}`),
      
      query('fecha_inicio')
        .optional()
        .isISO8601()
        .withMessage('fecha_inicio debe tener formato ISO 8601'),
      
      query('fecha_fin')
        .optional()
        .isISO8601()
        .withMessage('fecha_fin debe tener formato ISO 8601'),
      
      query('metodo_pago')
        .optional()
        .isIn(Object.values(PaymentMethod))
        .withMessage(`metodo_pago debe ser uno de: ${Object.values(PaymentMethod).join(', ')}`),
      
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe estar entre 1 y 100')
    ];
  }

  // Validaciones para historial de usuario
  static validateUserHistory() {
    return [
      param('usuarioId')
        .isInt({ min: 1 })
        .withMessage('ID de usuario debe ser un número válido'),
      
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe estar entre 1 y 100')
    ];
  }

  // Validaciones para reporte de período
  static validatePeriodReport() {
    return [
      query('fecha_inicio')
        .isISO8601()
        .withMessage('fecha_inicio es requerida y debe tener formato ISO 8601'),
      
      query('fecha_fin')
        .isISO8601()
        .withMessage('fecha_fin es requerida y debe tener formato ISO 8601'),
      
      query('fecha_inicio')
        .custom((value: string, { req }: { req: any }) => {
          const startDate = new Date(value);
          const endDate = new Date((req.query?.fecha_fin as string) || '');
          
          if (startDate >= endDate) {
            throw new Error('fecha_inicio debe ser anterior a fecha_fin');
          }
          
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 90) {
            throw new Error('El rango de fechas no puede exceder 90 días');
          }
          
          return true;
        })
    ];
  }

  // Validaciones para cálculo de tarifa
  static validateCalculateFare() {
    return [
      body('transporte_id')
        .isInt({ min: 1 })
        .withMessage('transporte_id debe ser un número entero positivo'),
      
      body('duracion_minutos')
        .isInt({ min: 1, max: 1440 })
        .withMessage('duracion_minutos debe estar entre 1 y 1440 minutos (24 horas)')
    ];
  }

  // Validaciones para préstamos activos
  static validateActiveLoans() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe estar entre 1 y 100')
    ];
  }

  // Middleware para manejar errores de validación
  static handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error: any) => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }));

      const response: ApiResponse = {
        success: false,
        message: 'Errores de validación',
        errors: formattedErrors
      };

      res.status(400).json(response);
      return;
    }
    
    next();
  }

  // Middleware: Validar que las fechas sean coherentes
  static validateDateRange(req: Request, res: Response, next: NextFunction): void {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      const response: ApiResponse = {
        success: false,
        message: 'fecha_inicio y fecha_fin son requeridas'
      };
      res.status(400).json(response);
      return;
    }

    const startDate = new Date(fecha_inicio as string);
    const endDate = new Date(fecha_fin as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        message: 'Formato de fecha inválido'
      };
      res.status(400).json(response);
      return;
    }

    if (startDate >= endDate) {
      const response: ApiResponse = {
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      };
      res.status(400).json(response);
      return;
    }

    // Máximo 90 días de diferencia
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      const response: ApiResponse = {
        success: false,
        message: 'El rango de fechas no puede exceder 90 días'
      };
      res.status(400).json(response);
      return;
    }

    next();
  }

  // Middleware: Validar permisos de administrador
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

  // Middleware: Validar que el usuario sea el propietario o admin
  static requireOwnershipOrAdmin(userIdParam: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authenticatedUser = (req as any).user;
      const targetUserId = parseInt(req.params[userIdParam]);
      
      if (!authenticatedUser) {
        const response: ApiResponse = {
          success: false,
          message: 'Usuario no autenticado'
        };
        res.status(401).json(response);
        return;
      }

      // Permitir si es admin o si es el mismo usuario
      if (authenticatedUser.role === 'admin' || authenticatedUser.id === targetUserId) {
        next();
        return;
      }

      const response: ApiResponse = {
        success: false,
        message: 'No tiene permisos para acceder a este recurso'
      };
      res.status(403).json(response);
    };
  }
}