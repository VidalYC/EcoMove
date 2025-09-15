import { Router, Request, Response } from 'express';
import { StationController } from '../../controllers/station.controller';
import { StationValidator } from '../../validators/station.validator';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';
import { DIContainer } from '../../../../config/container';

export class StationRoutes {
  static create(): Router {
    const router = Router();
    const container = DIContainer.getInstance();
    
    const stationController = container.getStationController();
    const authMiddleware = container.getAuthMiddleware();
    // ========== RUTAS ESPECÍFICAS PRIMERO ==========
    // Health check
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de estaciones funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          public: [
            'GET /api/v1/stations - Listar estaciones',
            'GET /api/v1/stations/stats - Estadísticas de estaciones',
            'GET /api/v1/stations/nearby - Buscar estaciones cercanas',
            'GET /api/v1/stations/with-transports - Estaciones con transportes',
            'GET /api/v1/stations/ranking - Ranking por ocupación',
            'GET /api/v1/stations/route - Calcular ruta',
            'GET /api/v1/stations/:id - Obtener estación por ID',
            'GET /api/v1/stations/:id/availability - Disponibilidad de estación'
          ],
          admin: [
            'POST /api/v1/stations - Crear estación',
            'PUT /api/v1/stations/:id - Actualizar estación',
            'PATCH /api/v1/stations/:id/activate - Activar estación',
            'PATCH /api/v1/stations/:id/deactivate - Desactivar estación'
          ]
        }
      });
    });

    // Estadísticas de estaciones
    router.get('/stats',
      (req: Request, res: Response) => stationController.getStats(req, res)
    );

    // Buscar estaciones cercanas
    router.get('/nearby',
      StationValidator.validateFindNearby(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.findNearby(req, res)
    );

    // Estaciones con transportes disponibles
    router.get('/with-transports',
      (req: Request, res: Response) => stationController.findWithTransports(req, res)
    );

    // Ranking por ocupación
    router.get('/ranking',
      (req: Request, res: Response) => stationController.getOccupancyRanking(req, res)
    );

    // Calcular ruta entre estaciones
    router.get('/route',
      StationValidator.validateCalculateRoute(),
      StationValidator.handleValidationErrors,
      StationValidator.validateDifferentStations,
      (req: Request, res: Response) => stationController.calculateRoute(req, res)
    );

    // Listar todas las estaciones con filtros
    router.get('/',
      StationValidator.validateGetAll(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.getAll(req, res)
    );

    // ========== RUTAS PROTEGIDAS (ADMIN) ==========

    // Crear nueva estación
    router.post('/',
      authMiddleware.authenticate,
      StationValidator.requireAdmin,
      StationValidator.validateCreate(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.create(req, res)
    );

    // ========== RUTAS DINÁMICAS AL FINAL ==========

    // Obtener estación específica por ID
    router.get('/:id',
      StationValidator.validateId(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.getById(req, res)
    );

    // Obtener disponibilidad de una estación específica
    router.get('/:id/availability',
      StationValidator.validateId(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.getAvailability(req, res)
    );

    // Actualizar estación
    router.put('/:id',
      authMiddleware.authenticate,
      StationValidator.requireAdmin,
      StationValidator.validateUpdate(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.update(req, res)
    );

    // Activar estación
    router.patch('/:id/activate',
      authMiddleware.authenticate,
      StationValidator.requireAdmin,
      StationValidator.validateId(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.activate(req, res)
    );

    // Desactivar estación
    router.patch('/:id/deactivate',
      authMiddleware.authenticate,
      StationValidator.requireAdmin,
      StationValidator.validateId(),
      StationValidator.handleValidationErrors,
      (req: Request, res: Response) => stationController.deactivate(req, res)
    );

    return router;
  }
}