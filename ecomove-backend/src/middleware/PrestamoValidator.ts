import { Request, Response, NextFunction } from 'express';
const { body, param, query, validationResult } = require('express-validator');
import { PrestamoModel } from '../models/PrestamoModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { TransporteModel } from '../models/TransporteModel';
import { EstacionModel } from '../models/EstacionModel';
import { EstadoPrestamo, MetodoPago } from '../types/Prestamo';
import { EstadoTransporte } from '../types/Transporte';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  targetPrestamo?: any;
  targetUsuario?: any;
  targetTransporte?: any;
  targetEstacionOrigen?: any;
  targetEstacionDestino?: any;
}

export class PrestamoValidator {

  // Validaciones para crear préstamo
  static validateCreatePrestamo() {
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
        .isInt({ min: 15, max: 1440 })
        .withMessage('duracion_estimada debe estar entre 15 y 1440 minutos (24 horas)')
    ];
  }

  // Validaciones para finalizar préstamo
  static validateFinalizarPrestamo() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID del préstamo debe ser un número entero positivo'),
      
      body('estacion_destino_id')
        .isInt({ min: 1 })
        .withMessage('estacion_destino_id debe ser un número entero positivo'),
      
      body('metodo_pago')
        .optional()
        .isIn(Object.values(MetodoPago))
        .withMessage(`metodo_pago debe ser uno de: ${Object.values(MetodoPago).join(', ')}`)
    ];
  }

  // Validaciones para cancelar préstamo
  static validateCancelarPrestamo() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID del préstamo debe ser un número entero positivo'),
      
      body('razon')
        .optional()
        .isLength({ min: 3, max: 255 })
        .withMessage('La razón debe tener entre 3 y 255 caracteres')
    ];
  }

  // Validaciones para extender préstamo
  static validateExtenderPrestamo() {
    return [
      param('id')
        .isInt({ min: 1 })
        .withMessage('ID del préstamo debe ser un número entero positivo'),
      
      body('minutos_adicionales')
        .isInt({ min: 15, max: 480 })
        .withMessage('minutos_adicionales debe estar entre 15 y 480 minutos (8 horas)')
    ];
  }

  // Validaciones para historial de usuario
  static validateHistorialUsuario() {
    return [
      param('usuarioId')
        .isInt({ min: 1 })
        .withMessage('usuarioId debe ser un número entero positivo'),
      
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

  // Validaciones para disponibilidad de estación
  static validateDisponibilidadEstacion() {
    return [
      param('estacionId')
        .isInt({ min: 1 })
        .withMessage('estacionId debe ser un número entero positivo')
    ];
  }

  // Validaciones para reporte por período
  static validateReportePeriodo() {
    return [
      query('fecha_inicio')
        .isISO8601()
        .withMessage('fecha_inicio debe tener formato YYYY-MM-DD'),
      
      query('fecha_fin')
        .isISO8601()
        .withMessage('fecha_fin debe tener formato YYYY-MM-DD'),
      
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

  // Validaciones para cálculo de tarifa
  static validateCalcularTarifa() {
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
  static validatePrestamosActivos() {
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

  // Middleware: Verificar que el préstamo existe
  static async validatePrestamoExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prestamoId = parseInt(id);

      if (isNaN(prestamoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de préstamo inválido'
        });
        return;
      }

      const prestamo = await PrestamoModel.findById(prestamoId);
      if (!prestamo) {
        res.status(404).json({
          success: false,
          message: 'Préstamo no encontrado'
        });
        return;
      }

      // Agregar préstamo al request para uso posterior
      const extReq = req as ExtendedRequest;
      extReq.targetPrestamo = prestamo;
      next();

    } catch (error) {
      console.error('Error en validatePrestamoExists:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware: Verificar que el usuario existe y está activo
  static async validateUsuarioActivo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.body.usuario_id || parseInt(req.params.usuarioId);
      
      if (!usuarioId || isNaN(usuarioId)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      const usuario = await UsuarioModel.findById(usuarioId);
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      if (usuario.estado !== 'active') {
        res.status(400).json({
          success: false,
          message: 'Usuario inactivo'
        });
        return;
      }

      // Agregar usuario al request
      const extReq = req as ExtendedRequest;
      extReq.targetUsuario = usuario;
      next();

    } catch (error) {
      console.error('Error en validateUsuarioActivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware: Verificar que el transporte existe y está disponible
  static async validateTransporteDisponible(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transporteId = req.body.transporte_id;
      
      if (!transporteId || isNaN(transporteId)) {
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

      if (transporte.estado !== EstadoTransporte.DISPONIBLE) {
        res.status(400).json({
          success: false,
          message: `Transporte no disponible. Estado actual: ${transporte.estado}`
        });
        return;
      }

      // Agregar transporte al request
      const extReq = req as ExtendedRequest;
      extReq.targetTransporte = transporte;
      next();

    } catch (error) {
      console.error('Error en validateTransporteDisponible:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware: Verificar que las estaciones existen
  static async validateEstacionesExisten(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const estacionOrigenId = req.body.estacion_origen_id;
      const estacionDestinoId = req.body.estacion_destino_id;
      const extReq = req as ExtendedRequest;
      
      // Validar estación origen
      if (estacionOrigenId) {
        const estacionOrigen = await EstacionModel.findById(estacionOrigenId);
        if (!estacionOrigen) {
          res.status(404).json({
            success: false,
            message: 'Estación de origen no encontrada'
          });
          return;
        }
        extReq.targetEstacionOrigen = estacionOrigen;
      }

      // Validar estación destino (si se proporciona)
      if (estacionDestinoId) {
        const estacionDestino = await EstacionModel.findById(estacionDestinoId);
        if (!estacionDestino) {
          res.status(404).json({
            success: false,
            message: 'Estación de destino no encontrada'
          });
          return;
        }
        extReq.targetEstacionDestino = estacionDestino;
      }

      next();

    } catch (error) {
      console.error('Error en validateEstacionesExisten:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware: Verificar que el usuario no tiene préstamos activos
  static async validateUsuarioSinPrestamosActivos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.body.usuario_id;
      
      const prestamoActivo = await PrestamoModel.findActivoByUsuario(usuarioId);
      if (prestamoActivo) {
        res.status(400).json({
          success: false,
          message: 'El usuario ya tiene un préstamo activo',
          prestamo_activo_id: prestamoActivo.id
        });
        return;
      }

      next();

    } catch (error) {
      console.error('Error en validateUsuarioSinPrestamosActivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware: Verificar que el préstamo está en estado válido para la operación
  static validateEstadoPrestamoParaFinalizacion(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    const prestamo = extReq.targetPrestamo;
    
    if (!prestamo) {
      res.status(500).json({
        success: false,
        message: 'Error: préstamo no encontrado en request'
      });
      return;
    }

    if (prestamo.estado !== EstadoPrestamo.ACTIVO && prestamo.estado !== EstadoPrestamo.EXTENDIDO) {
      res.status(400).json({
        success: false,
        message: `No se puede finalizar un préstamo en estado: ${prestamo.estado}`
      });
      return;
    }

    next();
  }

  // Middleware: Validar rango de fechas coherente
  static validateRangoFechas(req: Request, res: Response, next: NextFunction): void {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      next();
      return;
    }

    const fechaInicio = new Date(fecha_inicio as string);
    const fechaFin = new Date(fecha_fin as string);

    if (fechaInicio > fechaFin) {
      res.status(400).json({
        success: false,
        message: 'fecha_inicio no puede ser mayor que fecha_fin'
      });
      return;
    }

    // Validar que el rango no sea mayor a 1 año
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      res.status(400).json({
        success: false,
        message: 'El rango de fechas no puede ser mayor a 1 año'
      });
      return;
    }

    next();
  }

  // Middleware: Verificar que el transporte está en la estación especificada
  static validateTransporteEnEstacion(req: Request, res: Response, next: NextFunction): void {
    const extReq = req as ExtendedRequest;
    const transporte = extReq.targetTransporte;
    const estacionOrigenId = req.body.estacion_origen_id;
    
    if (!transporte) {
      res.status(500).json({
        success: false,
        message: 'Error: transporte no encontrado en request'
      });
      return;
    }

    if (transporte.estacion_actual_id !== estacionOrigenId) {
      res.status(400).json({
        success: false,
        message: 'El transporte no se encuentra en la estación especificada'
      });
      return;
    }

    next();
  }

  // Middleware: Validar permisos para operaciones administrativas
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
}