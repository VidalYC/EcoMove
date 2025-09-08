import { Router, Request, Response, NextFunction } from 'express';
import { TransporteController } from '../controllers/TransporteController';
import { TransporteValidator } from '../middleware/TransporteValidator';

const router = Router();

// ========== RUTAS PÚBLICAS DE CONSULTA ==========

// Obtener todos los transportes con filtros
router.get('/',
  TransporteValidator.validateFiltros(),
  TransporteValidator.handleValidationErrors,
  TransporteValidator.validateCoherenciaTarifas,
  TransporteController.getAll
);

// Buscar transportes por estación
router.get('/estacion/:estacionId',
  TransporteValidator.validateBusquedaPorEstacion(),
  TransporteValidator.handleValidationErrors,
  TransporteController.getByEstacion
);

// Buscar transportes disponibles para préstamo
router.get('/estacion/:estacionId/disponibles',
  TransporteValidator.validateBusquedaPorEstacion(),
  TransporteValidator.handleValidationErrors,
  TransporteController.buscarDisponibles
);

// Obtener estadísticas de transportes
router.get('/stats',
  TransporteController.getStats
);

// Obtener transporte específico por ID
router.get('/:id',
  TransporteValidator.validateTransporteExists,
  TransporteController.getById
);

// ========== RUTAS ADMINISTRATIVAS (requieren permisos admin) ==========

// Crear bicicleta
router.post('/bicicleta',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateCreateBicicleta(),
  TransporteValidator.handleValidationErrors,
  TransporteController.createBicicleta
);

// Crear patineta eléctrica
router.post('/patineta-electrica',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateCreatePatinetaElectrica(),
  TransporteValidator.handleValidationErrors,
  TransporteController.createPatinetaElectrica
);

// Actualizar transporte
router.put('/:id',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateTransporteExists,
  TransporteValidator.validateUpdateTransporte(),
  TransporteValidator.handleValidationErrors,
  TransporteController.update
);

// Cambiar estado de transporte
router.patch('/:id/estado',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateCambiarEstado(),
  TransporteValidator.handleValidationErrors,
  TransporteValidator.validateTransporteExists,
  TransporteController.cambiarEstado
);

// Mover transporte a otra estación
router.patch('/:id/mover',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateMoverTransporte(),
  TransporteValidator.handleValidationErrors,
  TransporteValidator.validateTransporteExists,
  TransporteValidator.validateTransporteDisponible,
  TransporteController.moverAEstacion
);

// Verificar mantenimiento
router.post('/:id/verificar-mantenimiento',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateTransporteExists,
  TransporteController.verificarMantenimiento
);

// ========== RUTAS ESPECÍFICAS PARA OPERACIONES ==========

// Marcar transporte como disponible (endpoint específico)
router.patch('/:id/disponible',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateTransporteExists,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.estado = 'disponible';
    next();
  },
  TransporteController.cambiarEstado
);

// Marcar transporte en mantenimiento (endpoint específico)
router.patch('/:id/mantenimiento',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateTransporteExists,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.estado = 'mantenimiento';
    next();
  },
  TransporteController.cambiarEstado
);

// Marcar transporte fuera de servicio (endpoint específico)
router.patch('/:id/fuera-servicio',
  // TransporteValidator.validateAdminRole,
  TransporteValidator.validateTransporteExists,
  (req: Request, res: Response, next: NextFunction) => {
    req.body.estado = 'fuera_de_servicio';
    next();
  },
  TransporteController.cambiarEstado
);

export default router;