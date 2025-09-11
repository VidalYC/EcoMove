import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PaginationParams, PaginationResult } from '../../../shared/interfaces/pagination';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: PaginationParams): Promise<PaginationResult<User>> {
    const result = await this.userRepository.findAll(params.page, params.limit);
    
    return {
      data: result.users,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  }
}