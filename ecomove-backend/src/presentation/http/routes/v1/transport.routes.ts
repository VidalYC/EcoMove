import { Router, Request, Response } from 'express';
import { TransportController } from '../../controllers/transport.controller';
import { TransportValidator } from '../../validators/transport.validator';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';
import { DIContainer } from '../../../../config/container';

export class TransportRoutes {
  static create(): Router {
    const router = Router();
    const container = DIContainer.getInstance();
    
    const transportController = container.getTransportController();
    const authMiddleware = container.getAuthMiddleware();

    // ========== RUTAS ESPECÍFICAS PRIMERO (ANTES DE /:id) ==========

    // Health check
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de transportes funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          public: [
            'GET /api/v1/transports - Listar transportes',
            'GET /api/v1/transports/stats - Estadísticas de transportes',
            'GET /api/v1/transports/available - Buscar transportes disponibles',
            'GET /api/v1/transports/:id - Obtener transporte por ID'
          ],
          admin: [
            'POST /api/v1/transports/bicycles - Crear bicicleta',
            'POST /api/v1/transports/electric-scooters - Crear patineta eléctrica',
            'PUT /api/v1/transports/:id - Actualizar transporte',
            'DELETE /api/v1/transports/:id - Eliminar transporte'
          ]
        }
      });
    });

    // Get transport statistics (ANTES de /:id)
    router.get('/stats',
      (req: Request, res: Response) => transportController.getStats(req, res)
    );

    // Find available transports by station (ANTES de /:id)
    router.get('/available',
      TransportValidator.validateFindAvailable(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.findAvailableByStation(req, res)
    );

    // Get all transports (ANTES de /:id)
    router.get('/',
      TransportValidator.validateGetAll(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.getAll(req, res)
    );

    // ========== RUTAS PROTEGIDAS (ADMIN) - ESPECÍFICAS ==========

    // Create bicycle
    router.post('/bicycles',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateCreateBicycle(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.createBicycle(req, res)
    );

    // Create electric scooter
    router.post('/electric-scooters',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateCreateElectricScooter(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.createElectricScooter(req, res)
    );

    // ========== RUTAS DINÁMICAS AL FINAL (/:id) ==========

    // Get transport by ID (DESPUÉS de todas las rutas específicas)
    router.get('/:id',
      TransportValidator.validateId(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.getById(req, res)
    );

    // Update transport
    router.put('/:id',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateUpdate(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.update(req, res)
    );

    // Change transport status
    router.patch('/:id/status',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateChangeStatus(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.changeStatus(req, res)
    );

    // Move transport to station
    router.patch('/:id/move',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateMoveToStation(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.moveToStation(req, res)
    );

    // Update battery level (electric scooters only)
    router.patch('/:id/battery',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateUpdateBattery(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.updateBatteryLevel(req, res)
    );

    // Delete transport
    router.delete('/:id',
      authMiddleware.authenticate,
      TransportValidator.requireAdmin,
      TransportValidator.validateId(),
      TransportValidator.handleValidationErrors,
      (req: Request, res: Response) => transportController.delete(req, res)
    );

    return router;
  }
}