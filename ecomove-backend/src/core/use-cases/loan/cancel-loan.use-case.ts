import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class CancelLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly transportRepository: TransportRepository
  ) {}

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

    return updatedLoan;
  }
}