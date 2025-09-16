import { LoanRepository, LoanStats, LoanWithDetails } from '../../domain/repositories/loan.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface PeriodReportRequest {
  startDate: Date;
  endDate: Date;
}

export interface PeriodReportResponse {
  summary: LoanStats;
  loansByDay: any[];
  mostUsedTransports: any[];
  mostActiveStations: any[];
}

export class GetPeriodReportUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(request: PeriodReportRequest): Promise<PeriodReportResponse> {
    const { startDate, endDate } = request;

    // Validar fechas
    if (startDate >= endDate) {
      throw new ValidationException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const maxDays = 90; // Máximo 90 días de diferencia
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      throw new ValidationException(`El rango de fechas no puede exceder ${maxDays} días`);
    }

    // Obtener datos
    const [summary, loans, mostUsedTransports, mostActiveStations] = await Promise.all([
      this.loanRepository.getStats(),
      this.loanRepository.findByDateRange(startDate, endDate),
      this.loanRepository.getMostUsedTransports(startDate, endDate, 10),
      this.loanRepository.getMostActiveStations(startDate, endDate, 10)
    ]);

    // Agrupar préstamos por día
    const loansByDay = this.groupLoansByDay(loans);

    return {
      summary,
      loansByDay,
      mostUsedTransports,
      mostActiveStations
    };
  }

  private groupLoansByDay(loans: LoanWithDetails[]): any[] {
    const grouped: { [key: string]: any } = {};

    loans.forEach(loan => {
      const date = loan.startDate.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          date,
          totalLoans: 0,
          revenue: 0,
          completedLoans: 0,
          cancelledLoans: 0
        };
      }

      grouped[date].totalLoans++;
      grouped[date].revenue += loan.totalCost || 0;

      if (loan.status === 'completed') {
        grouped[date].completedLoans++;
      } else if (loan.status === 'cancelled') {
        grouped[date].cancelledLoans++;
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }
}