import { LoanRepository, LoanStats } from '../../domain/repositories/loan.repository';

export class GetLoanStatsUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(): Promise<LoanStats> {
    return await this.loanRepository.getStats();
  }
}

