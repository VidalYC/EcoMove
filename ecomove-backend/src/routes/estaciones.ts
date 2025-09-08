import { Router, Request, Response, NextFunction } from 'express';
import { EstacionController } from '../controllers/EstacionController';
import { EstacionValidator } from '../middleware/EstacionValidator';

const router = Router();

// ========== RUTAS PÚBLICAS DE CONSULTA ==========

// Obtener todas las estaciones con filtros
router.get('/',
  EstacionValidator.validateFiltros(),
  EstacionValidator.handleValidationErrors,
  EstacionValidator.validateCoherenciaCapacidades,
  EstacionController.getAll
);

// Buscar estaciones cercanas a una ubicación
router.get('/nearby',
  EstacionValidator.validateFindNearby(),
  EstacionValidator.handleValidationErrors,
  EstacionController.findNearby
);

// Obtener estaciones con transportes disponibles
router.get('/disponibles',
  EstacionController.getWithAvailableTransports
);

// Obtener estadísticas de estaciones
router.get('/stats',
  EstacionController.getStats
);

// Obtener ranking de ocupación
router.get('/ranking-ocupacion',
  EstacionController.getRankingOcupacion
);

// Calcular ruta entre estaciones
router.get('/ruta',
  EstacionValidator.validateCalcularRuta(),
  EstacionValidator.handleValidationErrors,
  EstacionValidator.validateEstacionesDiferentes,
  EstacionController.calcularRuta
);

// Obtener estación específica por ID
router.get('/:id',
  EstacionValidator.validateEstacionExists,
  EstacionController.getById
);

// Obtener disponibilidad de una estación específica
router.get('/:id/disponibilidad',
  EstacionValidator.validateEstacionExists,
  EstacionController.getDisponibilidad
);

// ========== RUTAS ADMINISTRATIVAS (requieren permisos admin) ==========

// Crear nueva estación
router.post('/',
  // EstacionValidator.validateAdminRole,
  EstacionValidator.validateCreateEstacion(),
  EstacionValidator.handleValidationErrors,
  // EstacionValidator.validateCoordenadasColombia, // Opcional para Colombia
  EstacionController.create
);

// Actualizar estación
router.put('/:id',
  // EstacionValidator.validateAdminRole,
  EstacionValidator.validateEstacionExists,
  EstacionValidator.validateUpdateEstacion(),
  EstacionValidator.handleValidationErrors,
  // EstacionValidator.validateCoordenadasColombia, // Opcional
  EstacionController.update
);

// Activar estación
router.patch('/:id/activate',
  // EstacionValidator.validateAdminRole,
  EstacionValidator.validateEstacionExists,
  EstacionController.activate
);

// Desactivar estación
router.patch('/:id/deactivate',
  // EstacionValidator.validateAdminRole,
  EstacionValidator.validateEstacionExists,
  EstacionController.deactivate
);

export default router;