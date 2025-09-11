import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';
import { BusinessException } from '../../../shared/exceptions/business-exception';
import { ChangePasswordDto } from './dtos/change-password.dto';

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verificar contraseña actual
    const isValidCurrentPassword = await user.verifyPassword(dto.currentPassword);
    if (!isValidCurrentPassword) {
      throw new BusinessException('Current password is incorrect');
    }

    // Cambiar contraseña
    await user.changePassword(dto.newPassword);

    // Guardar cambios
    await this.userRepository.update(user);
  }
}