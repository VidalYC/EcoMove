export { CreateLoanUseCase } from './create-loan.use-case';
export { CompleteLoanUseCase } from './complete-loan.use-case';
export { CancelLoanUseCase } from './cancel-loan.use-case';
export { ExtendLoanUseCase } from './extend-loan.use-case';
export { GetLoanUseCase } from './get-loan.use-case';
export { GetLoanWithDetailsUseCase } from './get-loan-with-details.use-case';
export { GetAllLoansUseCase } from './get-all-loans.use-case';
export { GetActiveLoansUseCase } from './get-active-loans.use-case';
export { GetUserLoanHistoryUseCase } from './get-user-loan-history.use-case';
export { GetLoanStatsUseCase } from './get-loan-stats.use-case';
export { GetPeriodReportUseCase } from './get-period-report.use-case';
export { CalculateFareUseCase } from './calculate-fare.use-case';

// Re-exportar tipos e interfaces
export type { CreateLoanRequest } from './create-loan.use-case';
export type { CompleteLoanRequest } from './complete-loan.use-case';
export type { ExtendLoanRequest } from './extend-loan.use-case';
export type { PeriodReportRequest, PeriodReportResponse } from './get-period-report.use-case';
export type { CalculateFareRequest, CalculateFareResponse } from './calculate-fare.use-case';