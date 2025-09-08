import { Request, Response, NextFunction } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { EstacionModel } from '../models/EstacionModel';
import { pool } from '../config/database';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  targetEstacion?: any;
}

export class EstacionValidator {
  // Validaciones para crear estación
  static validateCreateEstacion() {
    return [
      body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

      body('direccion')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),

      body('capacidad_maxima')
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe estar entre 1 y 100'),

      body('latitud')
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      body('longitud')
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180')
    ];
  }

  // Validaciones para actualizar estación
  static validateUpdateEstacion() {
    return [
      body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

      body('direccion')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('La dirección debe tener entre 5 y 200 caracteres'),

      body('capacidad_maxima')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La capacidad máxima debe estar entre 1 y 100'),

      body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active debe ser true o false'),

      body('latitud')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      body('longitud')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180')
    ];
  }

  // Validaciones para búsqueda cercana
  static validateFindNearby() {
    return [
      query('latitud')
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitud debe estar entre -90 y 90'),

      query('longitud')
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitud debe estar entre -180 y 180'),

      query('radio')
        .optional()
        .isFloat({ min: 0.1, max: 50 })
        .withMessage('El radio debe estar entre 0.1 y 50 km')
    ];
  }

  // Validaciones para filtros de búsqueda
  static validateFiltros() {
    return [
      query('activa')
        .optional()
        .isBoolean()
        .withMessage('activa debe ser true o false'),

      query('capacidad_min')
        .optional()
        .isInt({ min: 1 })
        .withMessage('capacidad_min debe ser un número mayor a 0'),

      query('capacidad_max')
        .optional()
        .isInt({ min: 1 })
        .withMessage('capacidad_max debe ser un número mayor a 0'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número mayor a 0'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100')
    ];
  }

  // Validaciones para cálculo de ruta
  static validateCalcularRuta() {
    return [
      query('origen')
        .isInt({ min: 1 })
        .withMessage('ID de estación origen debe ser un número válido'),

      query('destino')
        .isInt({ min: 1 })
        .withMessage('ID de estación destino debe ser un número válido')
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

  // Validar que la estación exista
  static async validateEstacionExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const estacion = await EstacionModel.findById(estacionId);
      if (!estacion) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      // Agregar estación al request para uso posterior
      const extReq = req as ExtendedRequest;
      extReq.targetEstacion = estacion;
      next();
    } catch (error) {
      console.error('Error en validateEstacionExists:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Validar que la estación esté activa
  static validateEstacionActiva(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    const estacion = extReq.targetEstacion;

    if (!estacion) {
      res.status(400).json({
        success: false,
        message: 'Estación no encontrada'
      });
      return;
    }

    if (!estacion.is_active) {
      res.status(400).json({
        success: false,
        message: 'La estación no está activa'
      });
      return;
    }

    next();
  }

  // Validar coherencia de capacidades (min <= max)
  static validateCoherenciaCapacidades(req: Request, res: Response, next: NextFunction): void {
    const capacidadMin = parseInt(req.query.capacidad_min as string);
    const capacidadMax = parseInt(req.query.capacidad_max as string);

    if (!isNaN(capacidadMin) && !isNaN(capacidadMax) && capacidadMin > capacidadMax) {
      res.status(400).json({
        success: false,
        message: 'La capacidad mínima no puede ser mayor que la máxima'
      });
      return;
    }

    next();
  }

  // Validar permisos para operaciones administrativas
  static validateAdminRole(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as any;
    if (!extReq.user || extReq.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }
    
    next();
  }

  // Validar que las coordenadas sean válidas para Colombia (opcional)
  static validateCoordenadasColombia(req: Request, res: Response, next: NextFunction): void {
    const latitud = parseFloat(req.body.latitud || req.query.latitud);
    const longitud = parseFloat(req.body.longitud || req.query.longitud);

    // Coordenadas aproximadas de Colombia
    const COLOMBIA_BOUNDS = {
      lat_min: -4.5,
      lat_max: 15.5,
      lng_min: -82,
      lng_max: -66
    };

    if (!isNaN(latitud) && !isNaN(longitud)) {
      if (latitud < COLOMBIA_BOUNDS.lat_min || latitud > COLOMBIA_BOUNDS.lat_max ||
          longitud < COLOMBIA_BOUNDS.lng_min || longitud > COLOMBIA_BOUNDS.lng_max) {
        
        res.status(400).json({
          success: false,
          message: 'Las coordenadas están fuera del territorio colombiano'
        });
        return;
      }
    }

    next();
  }

  // Validar que las estaciones origen y destino sean diferentes
  static validateEstacionesDiferentes(req: Request, res: Response, next: NextFunction): void {
    const origen = parseInt(req.query.origen as string);
    const destino = parseInt(req.query.destino as string);

    if (!isNaN(origen) && !isNaN(destino) && origen === destino) {
      res.status(400).json({
        success: false,
        message: 'Las estaciones origen y destino deben ser diferentes'
      });
      return;
    }

    next();
  }

  // Validar que la estación tenga capacidad disponible
  static async validateCapacidadDisponible(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const extReq = req as ExtendedRequest;
      const estacion = extReq.targetEstacion;

      if (!estacion) {
        res.status(400).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      // Verificar ocupación actual
      const ocupacionQuery = `
        SELECT COUNT(*) as transportes_actuales
        FROM transporte 
        WHERE estacion_actual_id = $1
      `;

      const result = await pool.query(ocupacionQuery, [estacion.id]);
      const transportesActuales = parseInt(result?.rows[0]?.transportes_actuales || 0);

      if (transportesActuales >= estacion.capacidad_maxima) {
        res.status(400).json({
          success: false,
          message: 'La estación está a capacidad máxima'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error en validateCapacidadDisponible:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}