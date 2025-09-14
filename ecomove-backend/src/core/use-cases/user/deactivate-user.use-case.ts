// src/core/use-cases/user/deactivate-user.use-case.ts
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';

export class DeactivateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.deactivate();
    return await this.userRepository.update(user);
  }
}
