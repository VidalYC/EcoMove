import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { StationRepository } from '../../domain/repositories/station.repository';
import { PaymentMethod } from '../../../shared/enums/payment.enums';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface CompleteLoanRequest {
  loanId: number;
  destinationStationId: number;
  totalCost: number;
  paymentMethod: PaymentMethod;
}

export class CompleteLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly transportRepository: TransportRepository,
    private readonly stationRepository: StationRepository
  ) {}

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

    // Completar el préstamo
    loan.complete(request.destinationStationId, request.totalCost, request.paymentMethod);

    // Actualizar el préstamo
    const updatedLoan = await this.loanRepository.update(loan);

    // Actualizar el transporte: mover a estación destino y cambiar estado
    await this.transportRepository.update(loan.getTransportId(), {
      currentStationId: request.destinationStationId,
      status: TransportStatus.AVAILABLE
    });

    return updatedLoan;
  }
}