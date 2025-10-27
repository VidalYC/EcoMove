// src/core/helpers/user-helper.ts
import { UserRepository } from '../domain/repositories/user.repository';

export class UserHelper {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserName(userId: number): Promise<string> {
    try {
      const user = await this.userRepository.findById(userId);
      return user?.getName() || 'Usuario';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Usuario';
    }
  }

  async getUserEmail(userId: number): Promise<string> {
    try {
      const user = await this.userRepository.findById(userId);
      return user?.getEmail().getValue() || '';
    } catch (error) {
      console.error('Error fetching user email:', error);
      throw new Error('No se pudo obtener el email del usuario');
    }
  }

  async getUserInfo(userId: number): Promise<{
    name: string;
    email: string;
    phone?: string;
  }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return {
        name: user.getName(),
        email: user.getEmail().getValue(),
        phone: user.getPhone()
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}