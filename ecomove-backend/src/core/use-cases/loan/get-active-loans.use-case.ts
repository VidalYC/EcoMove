import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository, PaginatedLoanResponse } from '../../domain/repositories/loan.repository';
import { LoanStatus } from '../../../shared/enums/loan.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class GetActiveLoansUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(page: number = 1, limit: number = 10): Promise<PaginatedLoanResponse<Loan>> {
    if (page <= 0) {
      throw new ValidationException('La página debe ser mayor a 0');
    }

    if (limit <= 0 || limit > 100) {
      throw new ValidationException('El límite debe estar entre 1 y 100');
    }

    return await this.loanRepository.findByStatus(LoanStatus.ACTIVE, page, limit);
  }
}
