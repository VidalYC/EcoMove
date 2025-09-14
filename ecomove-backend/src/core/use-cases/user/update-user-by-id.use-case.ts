// src/core/use-cases/user/update-user-by-id.use-case.ts
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';

export interface UpdateUserByIdRequest {
  nombre?: string;
  telefono?: string;
  role?: string;
}

export class UpdateUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, data: UpdateUserByIdRequest): Promise<User> {
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

    if (data.role) {
      user.updateRole(data.role);
    }

    return await this.userRepository.update(user);
  }
}