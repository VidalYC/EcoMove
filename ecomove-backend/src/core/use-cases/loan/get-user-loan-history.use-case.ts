import { LoanRepository, UserLoanHistory } from '../../domain/repositories/loan.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class GetUserLoanHistoryUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(userId: number, page: number = 1, limit: number = 10): Promise<UserLoanHistory> {
    if (userId <= 0) {
      throw new ValidationException('ID de usuario inválido');
    }

    if (page <= 0) {
      throw new ValidationException('La página debe ser mayor a 0');
    }

    if (limit <= 0 || limit > 100) {
      throw new ValidationException('El límite debe estar entre 1 y 100');
    }

    // Validar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ValidationException('Usuario no encontrado');
    }

    // CAMBIAR ESTA LÍNEA - separar la llamada del return
    const result = await this.loanRepository.findUserLoanHistory(userId, page, limit);
    
    // LOG TEMPORAL PARA DEBUG
    console.log('🔍 [USE CASE] Raw repository result:', {
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      loansLength: result.loans?.length || 0,
      firstLoan: result.loans?.[0] ? 'loan exists' : 'no loans in array'
    });

    return result;
  }
}
