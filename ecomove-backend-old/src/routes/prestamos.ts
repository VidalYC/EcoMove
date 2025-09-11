import { Router } from 'express';
import { PrestamoController } from '../controllers/PrestamoController';
import { PrestamoValidator } from '../middleware/PrestamoValidator';
import { AuthMiddleware } from '../middleware/Auth'; // NUEVO IMPORT

const router = Router();

// ========== RUTAS PÚBLICAS DE CONSULTA ==========

// Obtener disponibilidad de transportes en una estación
router.get('/estacion/:estacionId/disponibilidad',
  PrestamoValidator.validateDisponibilidadEstacion(),
  PrestamoValidator.handleValidationErrors,
  PrestamoController.obtenerDisponibilidadEstacion
);

// Calcular tarifa estimada
router.post('/calcular-tarifa',
  PrestamoValidator.validateCalcularTarifa(),
  PrestamoValidator.handleValidationErrors,
  PrestamoController.calcularTarifaEstimada
);

// ========== RUTAS DE USUARIO (requieren autenticación) ==========

// Iniciar nuevo préstamo
router.post('/',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  PrestamoValidator.validateCreatePrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validateUsuarioActivo,
  PrestamoValidator.validateTransporteDisponible,
  PrestamoValidator.validateEstacionesExisten,
  PrestamoValidator.validateUsuarioSinPrestamosActivos,
  PrestamoValidator.validateTransporteEnEstacion,
  PrestamoController.iniciarPrestamo
);

// Finalizar préstamo
router.put('/:id/finalizar',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  PrestamoValidator.validateFinalizarPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoValidator.validateEstadoPrestamoParaFinalizacion,
  PrestamoValidator.validateEstacionesExisten,
  PrestamoController.finalizarPrestamo
);

// Cancelar préstamo
router.put('/:id/cancelar',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  PrestamoValidator.validateCancelarPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoController.cancelarPrestamo
);

// Extender tiempo de préstamo
router.put('/:id/extender',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  PrestamoValidator.validateExtenderPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoController.extenderPrestamo
);

// Obtener historial de préstamos de un usuario
router.get('/usuario/:usuarioId',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireOwnershipOrAdmin('usuarioId'), // NUEVO MIDDLEWARE
  PrestamoValidator.validateHistorialUsuario(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validateUsuarioActivo,
  PrestamoController.obtenerHistorialUsuario
);

// ========== RUTAS ADMINISTRATIVAS (requieren permisos admin) ==========

// Obtener reporte de préstamos por período
router.get('/reporte',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE - DESCOMENTADO
  PrestamoValidator.validateReportePeriodo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validateRangoFechas,
  PrestamoController.obtenerReportePeriodo
);

// Obtener todos los préstamos activos
router.get('/activos',
  AuthMiddleware.authenticate, // NUEVO MIDDLEWARE
  AuthMiddleware.requireAdmin, // NUEVO MIDDLEWARE - DESCOMENTADO
  PrestamoValidator.validatePrestamosActivos(),
  PrestamoValidator.handleValidationErrors,
  PrestamoController.obtenerPrestamosActivos
);

export default router;