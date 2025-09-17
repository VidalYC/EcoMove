import { UserRepository, PaginatedResponse } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user/user.entity';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    return await this.userRepository.findAll(page, limit);
  }
}