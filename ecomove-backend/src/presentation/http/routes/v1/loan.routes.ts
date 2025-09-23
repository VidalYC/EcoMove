// src/presentation/http/routes/v1/loan.routes.ts
import { Router, Request, Response } from 'express';
import { LoanController } from '../../controllers/loan.controller';
import { LoanValidator } from '../../validators/loan.validator';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';
import { DIContainer } from '../../../../config/container';
import { createLimiter } from '../../middleware/rate-limiter.middleware';

export class LoanRoutes {
  static create(): Router {
    const router = Router();
    const container = DIContainer.getInstance();
    
    const loanController = container.getLoanController();
    const authMiddleware = container.getAuthMiddleware();

    // ========== RUTAS ESPECÍFICAS PRIMERO (ANTES DE /:id) ==========
    
    // Health check
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de préstamos funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          public: [
            'POST /api/v1/loans/calcular-tarifa - Calcular tarifa'
          ],
          user: [
            'GET /api/v1/loans - Listar préstamos',
            'POST /api/v1/loans - Crear préstamo',
            'GET /api/v1/loans/:id - Obtener préstamo por ID',
            'GET /api/v1/loans/:id/detalles - Obtener préstamo con detalles',
            'PUT /api/v1/loans/:id/completar - Completar préstamo',
            'PUT /api/v1/loans/:id/cancelar - Cancelar préstamo',
            'PUT /api/v1/loans/:id/extender - Extender préstamo',
            'GET /api/v1/loans/usuario/:usuarioId - Historial de usuario'
          ],
          admin: [
            'GET /api/v1/loans/admin/estadisticas - Estadísticas generales',
            'GET /api/v1/loans/admin/reporte - Reporte por período',
            'GET /api/v1/loans/admin/activos - Préstamos activos'
          ]
        }
      });
    });

    // ========== RUTAS PÚBLICAS ==========

    // Obtener préstamo activo del usuario actual
    router.get('/usuario/activo',
      authMiddleware.authenticate,
      (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        loanController.getUserActiveLoan(req, res, userId);
      }
    );

    // Obtener préstamos del usuario actual con límite
    router.get('/usuario/actual',
      authMiddleware.authenticate,
      LoanValidator.validateUserLoans(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        loanController.getCurrentUserLoans(req, res, userId);
      }
    );
    
    // Calcular tarifa de préstamo
    router.post('/calcular-tarifa',
      LoanValidator.validateCalculateFare(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.calculateFare(req, res)
    );

    // ========== RUTAS ADMINISTRATIVAS (ANTES de rutas con parámetros) ==========
    
    // Obtener estadísticas de préstamos
    router.get('/admin/estadisticas',
      authMiddleware.authenticate,
      LoanValidator.requireAdmin,
      (req: Request, res: Response) => loanController.getLoanStats(req, res)
    );

    // Obtener reporte de préstamos por período
    router.get('/admin/reporte',
      authMiddleware.authenticate,
      LoanValidator.requireAdmin,
      LoanValidator.validatePeriodReport(),
      LoanValidator.handleValidationErrors,
      LoanValidator.validateDateRange,
      (req: Request, res: Response) => loanController.getPeriodReport(req, res)
    );

    // Obtener todos los préstamos activos (admin)
    router.get('/admin/activos',
      authMiddleware.authenticate,
      LoanValidator.requireAdmin,
      LoanValidator.validateActiveLoans(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.getActiveLoans(req, res)
    );

    // ========== RUTAS DE USUARIO CON PARÁMETROS ESPECÍFICOS ==========
    
    // Obtener historial de préstamos de un usuario
    router.get('/usuario/:usuarioId',
      authMiddleware.authenticate,
      LoanValidator.validateUserHistory(),
      LoanValidator.handleValidationErrors,
      LoanValidator.requireOwnershipOrAdmin('usuarioId'),
      (req: Request, res: Response) => loanController.getUserLoanHistory(req, res)
    );

    // ========== RUTAS PROTEGIDAS CON AUTENTICACIÓN ==========
    
    // Listar todos los préstamos (con filtros)
    router.get('/',
      createLimiter,
      authMiddleware.authenticate,
      LoanValidator.validateLoanFilters(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.getAllLoans(req, res)
    );

    // Crear nuevo préstamo
    router.post('/',
      createLimiter,
      authMiddleware.authenticate,
      LoanValidator.validateCreateLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.createLoan(req, res)
    );

    // ========== RUTAS CON ACCIONES ESPECÍFICAS (ANTES de /:id genérico) ==========
    
    // Completar préstamo
    router.put('/:id/completar',
      authMiddleware.authenticate,
      LoanValidator.validateCompleteLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.completeLoan(req, res)
    );

    // Cancelar préstamo
    router.put('/:id/cancelar',
      authMiddleware.authenticate,
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.cancelLoan(req, res)
    );

    // Extender préstamo
    router.put('/:id/extender',
      authMiddleware.authenticate,
      LoanValidator.validateExtendLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.extendLoan(req, res)
    );

    // Obtener préstamo con detalles
    router.get('/:id/detalles',
      authMiddleware.authenticate,
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.getLoanWithDetailsById(req, res)
    );

    // ========== RUTAS DINÁMICAS AL FINAL (/:id) ==========
    
    // Obtener préstamo por ID (DEBE IR AL FINAL)
    router.get('/:id',
      authMiddleware.authenticate,
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => loanController.getLoanById(req, res)
    );

    return router;
  }
}