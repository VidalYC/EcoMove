import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface ExtendLoanRequest {
  loanId: number;
  additionalMinutes: number;
  additionalCost: number;
}

export class ExtendLoanUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(request: ExtendLoanRequest): Promise<Loan> {
    // Buscar el préstamo
    const loan = await this.loanRepository.findById(request.loanId);
    if (!loan) {
      throw new ValidationException('Préstamo no encontrado');
    }

    // Validar que el préstamo puede ser extendido
    if (!loan.canBeExtended()) {
      throw new ValidationException('El préstamo no puede ser extendido en su estado actual');
    }

    // Extender el préstamo
    loan.extend(request.additionalMinutes, request.additionalCost);

    // Actualizar el préstamo
    return await this.loanRepository.update(loan);
  }
}