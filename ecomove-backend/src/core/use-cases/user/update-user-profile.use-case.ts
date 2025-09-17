import { User } from '../../domain/entities/user/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';

export interface UpdateProfileRequest {
  nombre?: string;
  telefono?: string;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, data: UpdateProfileRequest): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (data.nombre) {
      user.updateName(data.nombre);
    }
    
    if (data.telefono) {
      user.updatePhone(data.telefono);
    }

    return await this.userRepository.update(user);
  }
}