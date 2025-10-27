import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { NotificationService } from '../../domain/services/notification.service';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';

export interface UpdateProfileRequest {
  nombre?: string;
  telefono?: string;
}

export class UpdateUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService?: NotificationService
  ) {}

  async execute(userId: number, data: UpdateProfileRequest): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // ✅ CORRECTO: Rastrear cambios con estructura old/new
    const changes: Record<string, { old: string; new: string }> = {};

    // Actualizar nombre si se proporcionó
    if (data.nombre && data.nombre !== user.getName()) {
      changes.name = {
        old: user.getName(),
        new: data.nombre
      };
      user.updateName(data.nombre);
    }
    
    // Actualizar teléfono si se proporcionó
    if (data.telefono && data.telefono !== user.getPhone()) {
      changes.phone = {
        old: user.getPhone() || 'No establecido',
        new: data.telefono
      };
      user.updatePhone(data.telefono);
    }

    // Guardar cambios en la base de datos
    const updatedUser = await this.userRepository.update(user);

    // ✅ Enviar correo de notificación si hubo cambios
    if (Object.keys(changes).length > 0 && this.notificationService) {
      try {
        await (this.notificationService as any).sendProfileUpdatedEmail(
          updatedUser.getEmail().getValue(),
          updatedUser.getName(),
          changes  // ← Ahora es un objeto { name: { old, new }, phone: { old, new } }
        );
        console.log('✅ Profile update email sent successfully');
      } catch (error) {
        console.error('⚠️ Failed to send profile update email:', error);
      }
    }

    return updatedUser;
  }
}