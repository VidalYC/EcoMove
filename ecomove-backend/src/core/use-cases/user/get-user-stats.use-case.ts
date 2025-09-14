// src/core/use-cases/user/get-user-stats.use-case.ts
import { UserRepository, UserStats } from '../../domain/repositories/user.repository';

export class GetUserStatsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<UserStats> {
    return await this.userRepository.getStats();
  }
}