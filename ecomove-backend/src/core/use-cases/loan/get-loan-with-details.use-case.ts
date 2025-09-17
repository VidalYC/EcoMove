import { LoanRepository, LoanWithDetails } from '../../domain/repositories/loan.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class GetLoanWithDetailsUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(id: number): Promise<LoanWithDetails | null> {
    if (id <= 0) {
      throw new ValidationException('ID de préstamo inválido');
    }

    return await this.loanRepository.findByIdWithDetails(id);
  }
}
