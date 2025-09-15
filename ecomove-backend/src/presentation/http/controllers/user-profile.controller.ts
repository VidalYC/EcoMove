import { Request, Response } from 'express';
import { GetUserProfileUseCase } from '../../../core/use-cases/user/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../../../core/use-cases/user/update-user-profile.use-case';
import { ChangePasswordUseCase } from '../../../core/use-cases/user/change-password.use-case';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Controlador para gestión de perfil de usuario
 * Responsabilidad única: Operaciones del perfil del usuario autenticado
 */
export class UserProfileController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase
  ) {}

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await this.getUserProfileUseCase.execute(userId);

      res.json({
        success: true,
        data: {
          id: user.getId(),
          nombre: user.getName(),
          correo: user.getEmail().getValue(),
          documento: user.getDocumentNumber().getValue(),
          telefono: user.getPhone(),
          role: user.getRole(),
          estado: user.getStatus(),
          fechaRegistro: user.getRegistrationDate()
        }
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { nombre, telefono } = req.body;

      const user = await this.updateUserProfileUseCase.execute(userId, {
        nombre,
        telefono
      });

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          id: user.getId(),
          nombre: user.getName(),
          correo: user.getEmail().getValue(),
          documento: user.getDocumentNumber().getValue(),
          telefono: user.getPhone(),
          role: user.getRole(),
          estado: user.getStatus()
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar perfil',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      await this.changePasswordUseCase.execute(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }
}