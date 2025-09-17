import { LoanRepository, LoanFilters, PaginatedLoanResponse, LoanWithDetails } from '../../domain/repositories/loan.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class GetAllLoansUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(filters: LoanFilters): Promise<PaginatedLoanResponse<LoanWithDetails>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    if (page <= 0) {
      throw new ValidationException('La página debe ser mayor a 0');
    }

    if (limit <= 0 || limit > 100) {
      throw new ValidationException('El límite debe estar entre 1 y 100');
    }

    return await this.loanRepository.findByFilters(filters);
  }
}
