import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PaginationParams, PaginationResult } from '../../../shared/interfaces/pagination';

export interface SearchUsersParams extends PaginationParams {
  searchTerm: string;
}

export class SearchUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(params: SearchUsersParams): Promise<PaginationResult<User>> {
    const result = await this.userRepository.search(params.searchTerm, params.page, params.limit);
    
    return {
      data: result.users,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  }
}