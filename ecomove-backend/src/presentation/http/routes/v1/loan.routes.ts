// src/presentation/http/routes/v1/loan.routes.ts
import { Router, Request, Response } from 'express';
import { LoanController } from '../../controllers/loan.controller';
import { LoanValidator } from '../../validators/loan.validator';
import { ValidationErrorHandler } from '../../middleware/validation-error-handler.middleware';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';

export class LoanRoutes {
  private router: Router;

  constructor(
    private readonly loanController: LoanController,
    private readonly authMiddleware: AuthenticationMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // ========== RUTAS PÚBLICAS DE CÁLCULO ==========
    
    // Calcular tarifa de préstamo
    this.router.post('/calcular-tarifa',
      LoanValidator.validateCalculateFare(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.calculateFare(req, res)
    );

    // ========== RUTAS QUE REQUIEREN AUTENTICACIÓN ==========
    
    // Middleware de autenticación para todas las rutas siguientes
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // Crear nuevo préstamo
    this.router.post('/',
      LoanValidator.validateCreateLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.createLoan(req, res)
    );

    // Obtener préstamo por ID
    this.router.get('/:id',
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.getLoanById(req, res)
    );

    // Obtener préstamo con detalles por ID
    this.router.get('/:id/detalles',
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.getLoanWithDetailsById(req, res)
    );

    // Completar préstamo
    this.router.put('/:id/completar',
      LoanValidator.validateCompleteLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.completeLoan(req, res)
    );

    // Cancelar préstamo
    this.router.put('/:id/cancelar',
      LoanValidator.validateLoanId(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.cancelLoan(req, res)
    );

    // Extender préstamo
    this.router.put('/:id/extender',
      LoanValidator.validateExtendLoan(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.extendLoan(req, res)
    );

    // Obtener todos los préstamos (con filtros)
    this.router.get('/',
      LoanValidator.validateLoanFilters(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.getAllLoans(req, res)
    );

    // ========== RUTAS DE USUARIO (requieren ser propietario o admin) ==========

    // Obtener historial de préstamos de un usuario
    this.router.get('/usuario/:usuarioId',
      LoanValidator.validateUserHistory(),
      LoanValidator.handleValidationErrors,
      LoanValidator.requireOwnershipOrAdmin('usuarioId'),
      (req: Request, res: Response) => this.loanController.getUserLoanHistory(req, res)
    );

    // ========== RUTAS ADMINISTRATIVAS (requieren permisos admin) ==========

    // Obtener estadísticas de préstamos
    this.router.get('/admin/estadisticas',
      LoanValidator.requireAdmin,
      (req: Request, res: Response) => this.loanController.getLoanStats(req, res)
    );

    // Obtener reporte de préstamos por período
    this.router.get('/admin/reporte',
      LoanValidator.requireAdmin,
      LoanValidator.validatePeriodReport(),
      LoanValidator.handleValidationErrors,
      LoanValidator.validateDateRange,
      (req: Request, res: Response) => this.loanController.getPeriodReport(req, res)
    );

    // Obtener todos los préstamos activos (admin)
    this.router.get('/admin/activos',
      LoanValidator.requireAdmin,
      LoanValidator.validateActiveLoans(),
      LoanValidator.handleValidationErrors,
      (req: Request, res: Response) => this.loanController.getActiveLoans(req, res)
    );

    // Health check del módulo
    this.router.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Módulo de préstamos funcionando correctamente',
        timestamp: new Date().toISOString(),
        endpoints: {
          public: {
            calculateFare: 'POST /api/v1/loans/calcular-tarifa'
          },
          user: {
            create: 'POST /api/v1/loans',
            getById: 'GET /api/v1/loans/:id',
            getDetails: 'GET /api/v1/loans/:id/detalles',
            complete: 'PUT /api/v1/loans/:id/completar',
            cancel: 'PUT /api/v1/loans/:id/cancelar',
            extend: 'PUT /api/v1/loans/:id/extender',
            getAll: 'GET /api/v1/loans',
            getUserHistory: 'GET /api/v1/loans/usuario/:usuarioId'
          },
          admin: {
            stats: 'GET /api/v1/loans/admin/estadisticas',
            report: 'GET /api/v1/loans/admin/reporte',
            activeLoans: 'GET /api/v1/loans/admin/activos'
          }
        }
      });
    });
  }

  getRouter(): Router {
    return this.router;
  }
}