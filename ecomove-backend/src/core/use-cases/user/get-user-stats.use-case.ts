import { UserRepository } from '../../domain/repositories/user.repository';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  newUsersThisMonth: number;
}

export class GetUserStatsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<UserStats> {
    return await this.userRepository.getStats();
  }
}