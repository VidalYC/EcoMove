import { UserRepository, PaginatedResponse } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

export class SearchUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(term: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    if (!term || term.trim().length < 2) {
      return {
        users: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      };
    }
    return await this.userRepository.search(term.trim(), page, limit);
  }
}