// src/core/use-cases/user/change-password.use-case.ts
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {}

  async execute(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      currentPassword, 
      user.getPassword()
    );
    
    if (!isCurrentPasswordValid) {
      throw new ValidationException('Contraseña actual incorrecta');
    }

    const hashedNewPassword = await this.passwordService.hash(newPassword);
    user.changePassword(hashedNewPassword);
    
    await this.userRepository.update(user);
  }
}