import { Router } from 'express';
import { PrestamoController } from '../controllers/PrestamoController';
import { PrestamoValidator } from '../middleware/PrestamoValidator';

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
  PrestamoValidator.validateFinalizarPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoValidator.validateEstadoPrestamoParaFinalizacion,
  PrestamoValidator.validateEstacionesExisten,
  PrestamoController.finalizarPrestamo
);

// Cancelar préstamo
router.put('/:id/cancelar',
  PrestamoValidator.validateCancelarPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoController.cancelarPrestamo
);

// Extender tiempo de préstamo
router.put('/:id/extender',
  PrestamoValidator.validateExtenderPrestamo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validatePrestamoExists,
  PrestamoController.extenderPrestamo
);

// Obtener historial de préstamos de un usuario
router.get('/usuario/:usuarioId',
  PrestamoValidator.validateHistorialUsuario(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validateUsuarioActivo,
  PrestamoController.obtenerHistorialUsuario
);

// ========== RUTAS ADMINISTRATIVAS (requieren permisos admin) ==========

// Obtener reporte de préstamos por período
router.get('/reporte',
  // PrestamoValidator.validateAdminRole, // Comentado por ahora
  PrestamoValidator.validateReportePeriodo(),
  PrestamoValidator.handleValidationErrors,
  PrestamoValidator.validateRangoFechas,
  PrestamoController.obtenerReportePeriodo
);

// Obtener todos los préstamos activos
router.get('/activos',
  // PrestamoValidator.validateAdminRole, // Comentado por ahora
  PrestamoValidator.validatePrestamosActivos(),
  PrestamoValidator.handleValidationErrors,
  PrestamoController.obtenerPrestamosActivos
);

export default router;