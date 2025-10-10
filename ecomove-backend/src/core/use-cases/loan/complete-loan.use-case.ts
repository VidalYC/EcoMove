import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { StationRepository } from '../../domain/repositories/station.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotificationService } from '../../domain/services/notification.service';
import { PaymentService } from '../../domain/services/payment.service';
import { PaymentMethod } from '../../../shared/enums/payment.enums';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { UserHelper } from '../../helpers/user-helper';

export interface CompleteLoanRequest {
  loanId: number;
  destinationStationId: number;
  totalCost: number;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
}

export class CompleteLoanUseCase {
  private userHelper: UserHelper;

  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly transportRepository: TransportRepository,
    private readonly stationRepository: StationRepository,
    private readonly notificationService: NotificationService,
    private readonly paymentService: PaymentService,
    private readonly userRepository: UserRepository
  ) {
    this.userHelper = new UserHelper(userRepository);
  }

  async execute(request: CompleteLoanRequest): Promise<Loan> {
    // Buscar el préstamo
    const loan = await this.loanRepository.findById(request.loanId);
    if (!loan) {
      throw new ValidationException('Préstamo no encontrado');
    }

    // Validar que el préstamo puede ser completado
    if (!loan.canBeCompleted()) {
      throw new ValidationException('El préstamo no puede ser completado en su estado actual');
    }

    // Validar que la estación de destino existe
    const destinationStation = await this.stationRepository.findById(request.destinationStationId);
    if (!destinationStation) {
      throw new ValidationException('Estación de destino no encontrada');
    }

    // ✅ Procesar pago
    const paymentResult = await this.processPayment(request);

    if (!paymentResult.success) {
      throw new ValidationException(`Error al procesar el pago: ${paymentResult.message}`);
    }

    // Completar el préstamo
    loan.complete(request.destinationStationId, request.totalCost, request.paymentMethod);

    // Actualizar el préstamo
    const updatedLoan = await this.loanRepository.update(loan);

    // Obtener información del transporte
    const transport = await this.loanRepository.findTransportWithInheritance(loan.getTransportId());

    // Actualizar el transporte: mover a estación destino y cambiar estado
    await this.transportRepository.update(loan.getTransportId(), {
      currentStationId: request.destinationStationId,
      status: TransportStatus.AVAILABLE
    });

    // ✅ Enviar notificaciones de forma asíncrona
    this.sendLoanEndedNotification(loan, transport, destinationStation, request.totalCost)
      .catch(error => console.error('⚠️ Failed to send loan ended email:', error));

    this.sendPaymentConfirmation(loan, request.totalCost, request.paymentMethod, paymentResult)
      .catch(error => console.error('⚠️ Failed to send payment confirmation email:', error));

    return updatedLoan;
  }

  private async processPayment(request: CompleteLoanRequest): Promise<any> {
    // Verificar si viene stripe_payment_intent_id
    if (request.stripePaymentIntentId) {
      console.log('✅ Procesando pago con Stripe Payment Intent:', request.stripePaymentIntentId);
      return {
        success: true,
        transactionId: request.stripePaymentIntentId,
        message: 'Pago procesado con Stripe'
      };
    }

    if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
      throw new ValidationException('Se requiere Payment Intent ID para pagos con tarjeta');
    }
    
    if (request.paymentMethod === PaymentMethod.CASH) {
      return {
        success: true,
        transactionId: `cash_${Date.now()}`,
        message: 'Pago en efectivo registrado'
      };
    }
    
    return await this.paymentService.processPayment(
      request.totalCost,
      'COP',
      request.paymentMethod
    );
  }

  private async sendLoanEndedNotification(
    loan: Loan,
    transport: any,
    destinationStation: any,
    totalCost: number
  ): Promise<void> {
    try {
      const userInfo = await this.userHelper.getUserInfo(loan.getUserId());
      
      if (!userInfo) {
        console.warn('⚠️ User info not found for loan ended email');
        return;
      }

      if (!transport) {
        console.warn('⚠️ Transport not found for email notification');
        return;
      }

      const endDate = loan.getEndDate();
      if (!endDate) {
        console.warn('⚠️ Loan end date not set');
        return;
      }

      const originStation = await this.stationRepository.findById(loan.getOriginStationId());
      const duration = this.calculateDuration(loan.getStartDate(), endDate);

      const loanSummary = {
        userName: userInfo.name,
        loanId: loan.getId()!.toString(),
        transportType: this.getTransportTypeName(transport.tipo),
        transportCode: transport.codigo || `T-${transport.id}`,
        startStation: originStation?.name || 'Estación origen',
        endStation: destinationStation.name,
        startTime: loan.getStartDate(),
        endTime: endDate,
        duration: this.formatDuration(duration),
        totalCost: totalCost
      };

      await this.notificationService.sendLoanEndedEmail(userInfo.email, loanSummary);
      console.log('✅ Loan ended email sent successfully');
    } catch (error) {
      console.error('⚠️ Error in sendLoanEndedNotification:', error);
      throw error;
    }
  }

  private async sendPaymentConfirmation(
    loan: Loan,
    totalCost: number,
    paymentMethod: PaymentMethod,
    paymentResult: any
  ): Promise<void> {
    try {
      const userInfo = await this.userHelper.getUserInfo(loan.getUserId());
      
      if (!userInfo) {
        console.warn('⚠️ User info not found for payment email');
        return;
      }

      const paymentDetails = {
        userName: userInfo.name,
        loanId: loan.getId()!.toString(),
        amount: totalCost,
        paymentMethod: this.getPaymentMethodName(paymentMethod),
        transactionId: paymentResult.transactionId,
        timestamp: new Date()
      };

      await this.notificationService.sendPaymentConfirmation(userInfo.email, paymentDetails);
      console.log('✅ Payment confirmation email sent successfully');
    } catch (error) {
      console.error('⚠️ Error in sendPaymentConfirmation:', error);
      throw error;
    }
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

  private getPaymentMethodName(method: PaymentMethod): string {
    const methodMap: Record<string, string> = {
      [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
      [PaymentMethod.CASH]: 'Efectivo',
    };
    return methodMap[method] || method;
  }
}