// src/presentation/http/controllers/loan.controller.ts
import { Request, Response } from 'express';
import {
  CreateLoanUseCase,
  CompleteLoanUseCase,
  CancelLoanUseCase,
  ExtendLoanUseCase,
  GetLoanUseCase,
  GetLoanWithDetailsUseCase,
  GetAllLoansUseCase,
  GetActiveLoansUseCase,
  GetUserLoanHistoryUseCase,
  GetLoanStatsUseCase,
  GetPeriodReportUseCase,
  CalculateFareUseCase
} from '../../../core/use-cases/loan';
import { 
  CreateLoanDto, 
  CompleteLoanDto, 
  ExtendLoanDto,
  LoanFiltersDto,
  LoanResponseDto,
  LoanWithDetailsDto,
  UserLoanHistoryDto,
  LoanStatsDto,
  PeriodReportDto,
  CalculateFareDto,
  FareCalculationDto
} from '../../../shared/interfaces/loan-dtos';
import { ApiResponse } from '../../../shared/interfaces/api-response';
import { Loan } from '../../../core/domain/entities/loan.entity';
import { LoanFilters, LoanWithDetails, UserLoanHistory } from '../../../core/domain/repositories/loan.repository';
import { LoanStatus } from '../../../shared/enums/loan.enums';
import { PaymentMethod } from '../../../shared/enums/payment.enums';

export class LoanController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly completeLoanUseCase: CompleteLoanUseCase,
    private readonly cancelLoanUseCase: CancelLoanUseCase,
    private readonly extendLoanUseCase: ExtendLoanUseCase,
    private readonly getLoanUseCase: GetLoanUseCase,
    private readonly getLoanWithDetailsUseCase: GetLoanWithDetailsUseCase,
    private readonly getAllLoansUseCase: GetAllLoansUseCase,
    private readonly getActiveLoansUseCase: GetActiveLoansUseCase,
    private readonly getUserLoanHistoryUseCase: GetUserLoanHistoryUseCase,
    private readonly getLoanStatsUseCase: GetLoanStatsUseCase,
    private readonly getPeriodReportUseCase: GetPeriodReportUseCase,
    private readonly calculateFareUseCase: CalculateFareUseCase
  ) {}

  // Crear nuevo préstamo
  async createLoan(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateLoanDto = req.body;
      
      const loan = await this.createLoanUseCase.execute({
        userId: dto.usuario_id,
        transportId: dto.transporte_id,
        originStationId: dto.estacion_origen_id,
        estimatedDuration: dto.duracion_estimada
      });

      const response: ApiResponse<LoanResponseDto> = {
        success: true,
        message: 'Préstamo creado exitosamente',
        data: this.mapLoanToDto(loan)
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al crear préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Completar préstamo
  async completeLoan(req: Request, res: Response): Promise<void> {
    try {
      const loanId = parseInt(req.params.id);
      const dto: CompleteLoanDto = req.body;

      const loan = await this.completeLoanUseCase.execute({
        loanId,
        destinationStationId: dto.estacion_destino_id,
        totalCost: dto.costo_total,
        paymentMethod: dto.metodo_pago
      });

      const response: ApiResponse<LoanResponseDto> = {
        success: true,
        message: 'Préstamo completado exitosamente',
        data: this.mapLoanToDto(loan)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al completar préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Cancelar préstamo
  async cancelLoan(req: Request, res: Response): Promise<void> {
    try {
      const loanId = parseInt(req.params.id);

      const loan = await this.cancelLoanUseCase.execute(loanId);

      const response: ApiResponse<LoanResponseDto> = {
        success: true,
        message: 'Préstamo cancelado exitosamente',
        data: this.mapLoanToDto(loan)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al cancelar préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Extender préstamo
  async extendLoan(req: Request, res: Response): Promise<void> {
    try {
      const loanId = parseInt(req.params.id);
      const dto: ExtendLoanDto = req.body;

      const loan = await this.extendLoanUseCase.execute({
        loanId,
        additionalMinutes: dto.minutos_adicionales,
        additionalCost: dto.costo_adicional
      });

      const response: ApiResponse<LoanResponseDto> = {
        success: true,
        message: `Préstamo extendido por ${dto.minutos_adicionales} minutos`,
        data: this.mapLoanToDto(loan)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al extender préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Obtener préstamo por ID
  async getLoanById(req: Request, res: Response): Promise<void> {
    try {
      const loanId = parseInt(req.params.id);

      const loan = await this.getLoanUseCase.execute(loanId);

      if (!loan) {
        const response: ApiResponse = {
          success: false,
          message: 'Préstamo no encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<LoanResponseDto> = {
        success: true,
        message: 'Préstamo obtenido exitosamente',
        data: this.mapLoanToDto(loan)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Obtener préstamo con detalles por ID
  async getLoanWithDetailsById(req: Request, res: Response): Promise<void> {
    try {
      const loanId = parseInt(req.params.id);

      const loan = await this.getLoanWithDetailsUseCase.execute(loanId);

      if (!loan) {
        const response: ApiResponse = {
          success: false,
          message: 'Préstamo no encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<LoanWithDetailsDto> = {
        success: true,
        message: 'Préstamo obtenido exitosamente',
        data: this.mapLoanWithDetailsToDto(loan)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener préstamo'
      };
      res.status(400).json(response);
    }
  }

  // Obtener todos los préstamos con filtros
  async getAllLoans(req: Request, res: Response): Promise<void> {
    try {
      // CORREGIDO: Usar nombres en inglés consistentes con LoanFilters interface
      const filters: LoanFilters = {
        userId: req.query.usuario_id ? parseInt(req.query.usuario_id as string) : undefined,
        transportId: req.query.transporte_id ? parseInt(req.query.transporte_id as string) : undefined,
        originStationId: req.query.estacion_origen_id ? parseInt(req.query.estacion_origen_id as string) : undefined,
        destinationStationId: req.query.estacion_destino_id ? parseInt(req.query.estacion_destino_id as string) : undefined,
        status: req.query.estado as LoanStatus,
        startDate: req.query.fecha_inicio ? new Date(req.query.fecha_inicio as string) : undefined,
        endDate: req.query.fecha_fin ? new Date(req.query.fecha_fin as string) : undefined,
        paymentMethod: req.query.metodo_pago as PaymentMethod,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      console.log('🔍 Filters being sent to use case:', filters); // Debug

      const result = await this.getAllLoansUseCase.execute(filters);

      const response: ApiResponse = {
        success: true,
        message: 'Préstamos obtenidos exitosamente',
        data: {
          prestamos: result.loans.map(loan => this.mapLoanWithDetailsToDto(loan)),
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage
        }
      };

      res.json(response);
    } catch (error) {
      console.error('❌ Error in getAllLoans:', error); // Debug adicional
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener préstamos'
      };
      res.status(400).json(response);
    }
  }

  // Obtener préstamos activos
  async getActiveLoans(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.getActiveLoansUseCase.execute(page, limit);

      const response: ApiResponse = {
        success: true,
        message: 'Préstamos activos obtenidos exitosamente',
        data: {
          prestamos: result.loans.map(loan => this.mapLoanToDto(loan)),
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener préstamos activos'
      };
      res.status(400).json(response);
    }
  }

  // Obtener historial de préstamos de un usuario
  async getUserLoanHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.usuarioId);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.getUserLoanHistoryUseCase.execute(userId, page, limit);

      const response: ApiResponse<UserLoanHistoryDto> = {
        success: true,
        message: 'Historial de préstamos obtenido exitosamente',
        data: this.mapUserLoanHistoryToDto(result)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener historial de préstamos'
      };
      res.status(400).json(response);
    }
  }

  // Obtener estadísticas de préstamos
  async getLoanStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getLoanStatsUseCase.execute();

      const response: ApiResponse<LoanStatsDto> = {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: this.mapLoanStatsToDto(stats)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener estadísticas'
      };
      res.status(500).json(response);
    }
  }

  // Obtener reporte de período
  async getPeriodReport(req: Request, res: Response): Promise<void> {
    try {
      const startDate = new Date(req.query.fecha_inicio as string);
      const endDate = new Date(req.query.fecha_fin as string);

      const result = await this.getPeriodReportUseCase.execute({
        startDate,
        endDate
      });

      const response: ApiResponse<PeriodReportDto> = {
        success: true,
        message: 'Reporte de período obtenido exitosamente',
        data: {
          resumen: this.mapLoanStatsToDto(result.summary),
          prestamos_por_dia: result.loansByDay,
          transportes_mas_usados: result.mostUsedTransports.map(transport => ({
            tipo_transporte: transport.transportType,
            modelo_transporte: transport.transportModel,
            total_prestamos: transport.totalLoans,
            ingresos_generados: transport.totalRevenue
          })),
          estaciones_mas_activas: result.mostActiveStations.map((station: {
            stationName: string;
            totalLoans: number;
            loansAsOrigin: number;
            loansAsDestination: number;
          }) => ({
            nombre_estacion: station.stationName,
            total_prestamos: station.totalLoans,
            prestamos_origen: station.loansAsOrigin,
            prestamos_destino: station.loansAsDestination
          }))
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener reporte de período'
      };
      res.status(400).json(response);
    }
  }

  // Calcular tarifa
  async calculateFare(req: Request, res: Response): Promise<void> {
    try {
      const dto: CalculateFareDto = req.body;

      const result = await this.calculateFareUseCase.execute({
        transportId: dto.transporte_id,
        durationMinutes: dto.duracion_minutos
      });

      const response: ApiResponse<FareCalculationDto> = {
        success: true,
        message: 'Tarifa calculada exitosamente',
        data: {
          tarifa_base: result.baseFare,
          duracion_minutos: result.durationMinutes,
          costo_total: result.totalCost,
          descuentos_aplicados: result.appliedDiscounts,
          impuestos: result.taxes
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al calcular tarifa'
      };
      res.status(400).json(response);
    }
  }

  // ========== MÉTODOS AUXILIARES DE MAPEO ==========

  private mapLoanToDto(loan: Loan): LoanResponseDto {
    return {
      id: loan.getId()!,
      usuario_id: loan.getUserId(),
      transporte_id: loan.getTransportId(),
      estacion_origen_id: loan.getOriginStationId(),
      estacion_destino_id: loan.getDestinationStationId(),
      fecha_inicio: loan.getStartDate().toISOString(),
      fecha_fin: loan.getEndDate()?.toISOString() || null,
      duracion_estimada: loan.getEstimatedDuration(),
      costo_total: loan.getTotalCost(),
      estado: loan.getStatus(),
      metodo_pago: loan.getPaymentMethod(),
      created_at: loan.getCreatedAt().toISOString(),
      updated_at: loan.getUpdatedAt().toISOString()
    };
  }

  private mapLoanWithDetailsToDto(loan: LoanWithDetails): LoanWithDetailsDto {
    return {
      id: loan.id,
      usuario_id: loan.userId,
      transporte_id: loan.transportId,
      estacion_origen_id: loan.originStationId,
      estacion_destino_id: loan.destinationStationId,
      fecha_inicio: loan.startDate.toISOString(),
      fecha_fin: loan.endDate?.toISOString() || null,
      duracion_estimada: loan.estimatedDuration,
      costo_total: loan.totalCost,
      estado: loan.status,
      metodo_pago: loan.paymentMethod,
      created_at: loan.createdAt.toISOString(),
      updated_at: loan.updatedAt.toISOString(),
      usuario_nombre: loan.userName,
      usuario_correo: loan.userEmail,
      usuario_documento: loan.userDocument,
      transporte_tipo: loan.transportType,
      transporte_modelo: loan.transportModel,
      estacion_origen_nombre: loan.originStationName,
      estacion_destino_nombre: loan.destinationStationName
    };
  }

  private mapUserLoanHistoryToDto(history: UserLoanHistory): UserLoanHistoryDto {
    return {
      prestamos: history.loans.map(loan => this.mapLoanWithDetailsToDto(loan)),
      total: history.total,
      totalPages: history.totalPages,
      currentPage: history.currentPage,
      estadisticas_usuario: {
        total_prestamos: history.userStats.totalLoans,
        tiempo_total_uso: history.userStats.totalTimeUsed,
        gasto_total: history.userStats.totalSpent,
        transporte_favorito: history.userStats.favoriteTransport
      }
    };
  }

  private mapLoanStatsToDto(stats: any): LoanStatsDto {
    return {
      total_prestamos: stats.totalLoans,
      prestamos_activos: stats.activeLoans,
      prestamos_completados: stats.completedLoans,
      prestamos_cancelados: stats.cancelledLoans,
      ingresos_totales: stats.totalRevenue,
      duracion_promedio: stats.averageDuration,
      transporte_mas_usado: stats.mostUsedTransportType
    };
  }
}