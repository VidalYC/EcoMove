import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class GetLoanUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(id: number): Promise<Loan | null> {
    if (id <= 0) {
      throw new ValidationException('ID de préstamo inválido');
    }

    return await this.loanRepository.findById(id);
  }
}