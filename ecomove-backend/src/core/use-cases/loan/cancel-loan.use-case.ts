import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotificationService } from '../../domain/services/notification.service';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { UserHelper } from '../../helpers/user-helper';

export class CancelLoanUseCase {
  private userHelper: UserHelper;

  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly transportRepository: TransportRepository,
    private readonly notificationService: NotificationService,
    private readonly userRepository: UserRepository
  ) {
    this.userHelper = new UserHelper(userRepository);
  }

  async execute(loanId: number): Promise<Loan> {
    // Buscar el préstamo
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new ValidationException('Préstamo no encontrado');
    }

    // Validar que el préstamo puede ser cancelado
    if (!loan.canBeCancelled()) {
      throw new ValidationException('El préstamo no puede ser cancelado en su estado actual');
    }

    // Cancelar el préstamo
    loan.cancel();

    // Actualizar el préstamo
    const updatedLoan = await this.loanRepository.update(loan);

    // Cambiar estado del transporte de vuelta a 'available'
    await this.transportRepository.update(loan.getTransportId(), { status: TransportStatus.AVAILABLE });

    // ✅ Enviar email de notificación de cancelación de forma asíncrona
    this.sendCancellationNotification(loan)
      .catch(error => console.error('⚠️ Failed to send loan cancellation email:', error));

    return updatedLoan;
  }

  private async sendCancellationNotification(loan: Loan): Promise<void> {
    try {
      const userInfo = await this.userHelper.getUserInfo(loan.getUserId());
      
      if (!userInfo) {
        console.warn('⚠️ User info not found for cancellation email');
        return;
      }

      const transport = await this.loanRepository.findTransportWithInheritance(loan.getTransportId());
      
      if (!transport) {
        console.warn('⚠️ Transport not found for cancellation email');
        return;
      }

      const duration = this.calculateDuration(loan.getStartDate(), new Date());
      const cancellationFee = this.calculateCancellationFee(loan);

      const reminderInfo = {
        userName: userInfo.name,
        loanId: loan.getId()!.toString(),
        transportType: this.getTransportTypeName(transport.tipo),
        transportCode: transport.codigo || `T-${transport.id}`,
        startTime: loan.getStartDate(),
        currentDuration: this.formatDuration(duration),
        reminderType: 'cost' as const,
        message: `Tu préstamo ha sido cancelado. Tarifa de cancelación: ${cancellationFee.toLocaleString('es-CO')}`
      };

      await this.notificationService.sendLoanReminder(userInfo.email, reminderInfo);
      console.log('✅ Loan cancellation email sent successfully');
    } catch (error) {
      console.error('⚠️ Error in sendCancellationNotification:', error);
      throw error;
    }
  }

  private calculateCancellationFee(loan: Loan): number {
    const now = new Date();
    const startTime = loan.getStartDate();
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    const baseRate = 3000;
    const ratePerMinute = 50;
    const baseCost = minutesElapsed < 1 ? baseRate : baseRate + (minutesElapsed * ratePerMinute);
    
    // Tarifa de cancelación es el 40% del costo base
    return Math.round(baseCost * 0.4);
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} horas ${mins} minutos` : `${hours} horas`;
  }

  private getTransportTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'bicycle': 'Bicicleta',
      'scooter': 'Scooter',
      'electric_scooter': 'Scooter Eléctrico'
    };
    return typeMap[type] || type;
  }
}