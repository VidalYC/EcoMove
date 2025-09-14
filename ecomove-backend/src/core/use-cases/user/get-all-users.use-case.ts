// src/core/use-cases/user/get-all-users.use-case.ts
import { UserRepository, PaginatedResponse } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    return await this.userRepository.findAll(page, limit);
  }
}