import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { StationRepository } from '../../domain/repositories/station.repository';
import { NotificationService } from '../../domain/services/notification.service';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';
import { UserHelper } from '../../helpers/user-helper';

export interface CreateLoanRequest {
  userId: number;
  transportId: number;
  originStationId: number;
  estimatedDuration?: number;
}

export class CreateLoanUseCase {
  private userHelper: UserHelper;

  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly userRepository: UserRepository,
    private readonly transportRepository: TransportRepository,
    private readonly stationRepository: StationRepository,
    private readonly notificationService: NotificationService,
    private readonly logger: LoggerService 
  ) {
    this.userHelper = new UserHelper(userRepository);
  }

  async execute(request: CreateLoanRequest): Promise<Loan> {
    const startTime = Date.now();
    
    this.logger.info('Loan creation started', {
      userId: request.userId,
      transportId: request.transportId,
      originStationId: request.originStationId,
      estimatedDuration: request.estimatedDuration,
      timestamp: new Date().toISOString()
    });

    try {
      // Validar que el usuario existe y está activo
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        this.logger.warn('Loan creation failed - user not found', {
          userId: request.userId,
          transportId: request.transportId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('Usuario no encontrado');
      }
      
      if (!user.isActive()) {
        this.logger.warn('Loan creation failed - user inactive', {
          userId: request.userId,
          userStatus: user.getStatus(),
          transportId: request.transportId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('Usuario no está activo');
      }

      // Validar que el usuario no tenga préstamos activos
      const hasActiveLoans = await this.loanRepository.hasActiveLoans(request.userId);
      if (hasActiveLoans) {
        this.logger.warn('Loan creation failed - user has active loan', {
          userId: request.userId,
          transportId: request.transportId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('El usuario ya tiene un préstamo activo');
      }

      // Validar que el transporte existe y está disponible
      const transport = await this.loanRepository.findTransportWithInheritance(request.transportId);
      if (!transport) {
        this.logger.warn('Loan creation failed - transport not found', {
          userId: request.userId,
          transportId: request.transportId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('Transporte no encontrado');
      }
      
      if (transport.estado !== 'available') {
        this.logger.warn('Loan creation failed - transport not available', {
          userId: request.userId,
          transportId: request.transportId,
          transportStatus: transport.estado,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('Transporte no está disponible');
      }

      // Validar que la estación de origen existe
      const originStation = await this.stationRepository.findById(request.originStationId);
      if (!originStation) {
        this.logger.warn('Loan creation failed - origin station not found', {
          userId: request.userId,
          transportId: request.transportId,
          originStationId: request.originStationId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('Estación de origen no encontrada');
      }

      // Validar que el transporte está en la estación de origen
      if (transport.current_station_id !== request.originStationId) {
        this.logger.warn('Loan creation failed - transport not at origin station', {
          userId: request.userId,
          transportId: request.transportId,
          transportCurrentStation: transport.current_station_id,
          requestedOriginStation: request.originStationId,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('El transporte no está en la estación de origen especificada');
      }

      // Crear el préstamo
      const loan = Loan.create(
        request.userId,
        request.transportId,
        request.originStationId,
        request.estimatedDuration
      );

      // Guardar el préstamo
      const savedLoan = await this.loanRepository.save(loan);

      // Cambiar estado del transporte a 'in_use'
      await this.transportRepository.update(transport.id, { status: TransportStatus.IN_USE });

      // ✅ Enviar email de notificación de préstamo iniciado
      this.sendLoanStartedNotification(
        request.userId,
        savedLoan,
        transport,
        originStation
      ).catch(error => {
        this.logger.error('Failed to send loan started email', error);
      });

      this.logger.info('Loan creation successful', {
        loanId: savedLoan.getId(),
        userId: request.userId,
        transportId: request.transportId,
        originStationId: request.originStationId,
        transportType: transport.tipo,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });

      return savedLoan;

    } catch (error) {
      this.logger.error('Loan creation failed', {
        userId: request.userId,
        transportId: request.transportId,
        originStationId: request.originStationId,
        error: (error as Error).message,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private async sendLoanStartedNotification(
    userId: number,
    savedLoan: Loan,
    transport: any,
    originStation: any
  ): Promise<void> {
    try {
      const userInfo = await this.userHelper.getUserInfo(userId);
      
      if (!userInfo) {
        this.logger.warn('User info not found for email notification');
        return;
      }

      // Calcular tiempo estimado si está disponible
      const estimatedDuration = savedLoan.getEstimatedDuration?.();
      const estimatedEndTime = estimatedDuration 
        ? new Date(savedLoan.getStartDate().getTime() + estimatedDuration * 60000)
        : undefined;
      const estimatedCost = this.calculateEstimatedCost(
        transport.tipo, 
        estimatedDuration || 60
      );

      const loanDetails = {
        userName: userInfo.name,
        loanId: savedLoan.getId()!.toString(),
        transportType: this.getTransportTypeName(transport.tipo),
        transportCode: transport.codigo || `T-${transport.id}`,
        startStation: originStation.name,
        startTime: savedLoan.getStartDate(),
        estimatedEndTime,
        estimatedCost
      };

      await this.notificationService.sendLoanStartedEmail(userInfo.email, loanDetails);
      this.logger.info('Loan started email sent successfully', { 
        userId,
        loanId: savedLoan.getId() 
      });
    } catch (error) {
      this.logger.error('Error in sendLoanStartedNotification', error);
      throw error;
    }
  }

  private getTransportTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'bicycle': 'Bicicleta',
      'scooter': 'Scooter',
      'electric_scooter': 'Scooter Eléctrico'
    };
    return typeMap[type] || type;
  }

  private calculateEstimatedCost(transportType: string, durationMinutes: number): number {
    const rates: Record<string, number> = {
      'bicycle': 50,
      'scooter': 80,
      'electric_scooter': 120
    };
    const rate = rates[transportType] || 50;
    const baseRate = 3000;
    const calculatedCost = durationMinutes * rate;
    return Math.max(baseRate, calculatedCost);
  }
}