import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';
import { BusinessException } from '../../../shared/exceptions/business-exception';
import { UpdateUserDto } from './dtos/update-user.dto';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si se cambia el email, verificar que no esté en uso
    if (dto.email && dto.email !== user.email.value) {
      const existingUser = await this.userRepository.findByEmail(new Email(dto.email));
      if (existingUser && existingUser.id !== userId) {
        throw new BusinessException('Email is already in use by another user');
      }
    }

    // Actualizar datos
    user.updateProfile(dto);

    // Guardar cambios
    return await this.userRepository.update(user);
  }
}