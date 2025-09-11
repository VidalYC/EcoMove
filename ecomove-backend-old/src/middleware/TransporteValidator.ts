import { Request, Response, NextFunction } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { TransporteModel } from '../models/TransporteModel';
import { TipoTransporte, EstadoTransporte } from '../types/Transporte';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  targetTransporte?: any;
}

export class TransporteValidator {
  // Validaciones para crear bicicleta
  static validateCreateBicicleta() {
    return [
      body('modelo')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('tarifa_por_hora')
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('num_marchas')
        .isInt({ min: 1, max: 30 })
        .withMessage('El número de marchas debe estar entre 1 y 30'),

      body('tipo_freno')
        .trim()
        .isIn(['Disco', 'V-Brake', 'Cantilever', 'Tambor'])
        .withMessage('Tipo de freno no válido'),

      body('estacion_actual_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      body('fecha_adquisicion')
        .optional()
        .isISO8601()
        .withMessage('Fecha de adquisición debe ser válida')
    ];
  }

  // Validaciones para crear patineta eléctrica
  static validateCreatePatinetaElectrica() {
    return [
      body('modelo')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('tarifa_por_hora')
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('velocidad_maxima')
        .isFloat({ min: 10, max: 50 })
        .withMessage('La velocidad máxima debe estar entre 10 y 50 km/h'),

      body('autonomia')
        .isFloat({ min: 10, max: 100 })
        .withMessage('La autonomía debe estar entre 10 y 100 km'),

      body('nivel_bateria')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('El nivel de batería debe estar entre 0 y 100%'),

      body('estacion_actual_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido')
    ];
  }

  // Validaciones para actualizar transporte
  static validateUpdateTransporte() {
    return [
      body('modelo')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El modelo debe tener entre 2 y 100 caracteres'),

      body('estado')
        .optional()
        .isIn(Object.values(EstadoTransporte))
        .withMessage('Estado de transporte inválido'),

      body('estacion_actual_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      body('tarifa_por_hora')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa por hora debe ser mayor a 0'),

      body('kilometraje')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El kilometraje debe ser mayor o igual a 0')
    ];
  }

  // Validaciones para cambio de estado
  static validateCambiarEstado() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('estado')
        .isIn(Object.values(EstadoTransporte))
        .withMessage('Estado de transporte inválido')
    ];
  }

  // Validaciones para mover transporte
  static validateMoverTransporte() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID de transporte debe ser un número válido'),

      body('nuevaEstacionId')
        .isInt({ min: 1 })
        .withMessage('ID de nueva estación debe ser un número válido')
    ];
  }

  // Validaciones para filtros de búsqueda
  static validateFiltros() {
    return [
      query('tipo')
        .optional()
        .isIn(Object.values(TipoTransporte))
        .withMessage('Tipo de transporte inválido'),

      query('estado')
        .optional()
        .isIn(Object.values(EstadoTransporte))
        .withMessage('Estado de transporte inválido'),

      query('estacion_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      query('tarifa_min')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Tarifa mínima debe ser mayor o igual a 0'),

      query('tarifa_max')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Tarifa máxima debe ser mayor o igual a 0'),

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

  // Validaciones para búsqueda por estación
  static validateBusquedaPorEstacion() {
    return [
      param('estacionId')
        .isInt({ min: 1 })
        .withMessage('ID de estación debe ser un número válido'),

      query('tipo')
        .optional()
        .isIn(Object.values(TipoTransporte))
        .withMessage('Tipo de transporte inválido'),

      query('disponibles')
        .optional()
        .isBoolean()
        .withMessage('Parámetro disponibles debe ser true o false')
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

  // Validar que el transporte exista
  static async validateTransporteExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transporteId = parseInt(id);

      if (isNaN(transporteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de transporte inválido'
        });
        return;
      }

      const transporte = await TransporteModel.findById(transporteId);
      if (!transporte) {
        res.status(404).json({
          success: false,
          message: 'Transporte no encontrado'
        });
        return;
      }

      // Agregar transporte al request para uso posterior
      const extReq = req as ExtendedRequest;
      extReq.targetTransporte = transporte;
      next();
    } catch (error) {
      console.error('Error en validateTransporteExists:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Validar que el transporte esté disponible
  static validateTransporteDisponible(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    const transporte = extReq.targetTransporte;

    if (!transporte) {
      res.status(400).json({
        success: false,
        message: 'Transporte no encontrado'
      });
      return;
    }

    if (transporte.estado !== EstadoTransporte.DISPONIBLE) {
      res.status(400).json({
        success: false,
        message: 'El transporte no está disponible'
      });
      return;
    }

    next();
  }

  // Validar que el transporte esté en uso
  static validateTransporteEnUso(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    const transporte = extReq.targetTransporte;

    if (!transporte) {
      res.status(400).json({
        success: false,
        message: 'Transporte no encontrado'
      });
      return;
    }

    if (transporte.estado !== EstadoTransporte.EN_USO) {
      res.status(400).json({
        success: false,
        message: 'El transporte no está en uso'
      });
      return;
    }

    next();
  }

  // Validar coherencia de tarifas (min <= max)
  static validateCoherenciaTarifas(req: Request, res: Response, next: NextFunction): void {
    const tarifaMin = parseFloat(req.query.tarifa_min as string);
    const tarifaMax = parseFloat(req.query.tarifa_max as string);

    if (!isNaN(tarifaMin) && !isNaN(tarifaMax) && tarifaMin > tarifaMax) {
      res.status(400).json({
        success: false,
        message: 'La tarifa mínima no puede ser mayor que la máxima'
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

  // Validar datos específicos según tipo de transporte
  static validateTipoEspecifico(req: Request, res: Response, next: NextFunction): void {
    const { tipo } = req.body;

    switch (tipo) {
      case TipoTransporte.BICICLETA:
        if (!req.body.num_marchas || !req.body.tipo_freno) {
          res.status(400).json({
            success: false,
            message: 'Para bicicletas se requiere num_marchas y tipo_freno'
          });
          return;
        }
        break;

      case TipoTransporte.PATINETA_ELECTRICA:
        if (!req.body.velocidad_maxima || !req.body.autonomia) {
          res.status(400).json({
            success: false,
            message: 'Para patinetas eléctricas se requiere velocidad_maxima y autonomia'
          });
          return;
        }
        break;

      case TipoTransporte.SCOOTER:
        if (!req.body.velocidad_maxima || !req.body.autonomia || !req.body.peso_maximo) {
          res.status(400).json({
            success: false,
            message: 'Para scooters se requiere velocidad_maxima, autonomia y peso_maximo'
          });
          return;
        }
        break;

      case TipoTransporte.VEHICULO_ELECTRICO:
        if (!req.body.autonomia || !req.body.capacidad_pasajeros || !req.body.placa) {
          res.status(400).json({
            success: false,
            message: 'Para vehículos eléctricos se requiere autonomia, capacidad_pasajeros y placa'
          });
          return;
        }
        break;
    }

    next();
  }
}