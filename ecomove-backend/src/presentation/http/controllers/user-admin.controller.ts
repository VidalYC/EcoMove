import { Request, Response } from 'express';
import { GetAllUsersUseCase } from '../../../core/use-cases/user/get-all-users.use-case';
import { SearchUsersUseCase } from '../../../core/use-cases/user/search-users.use-case';
import { GetUserStatsUseCase } from '../../../core/use-cases/user/get-user-stats.use-case';
import { GetUserByIdUseCase } from '../../../core/use-cases/user/get-user-by-id.use-case';
import { ActivateUserUseCase } from '../../../core/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '../../../core/use-cases/user/deactivate-user.use-case';
import { UpdateUserByIdUseCase } from '../../../core/use-cases/user/update-user-by-id.use-case';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Controlador para administración de usuarios
 * Responsabilidad única: Operaciones administrativas sobre usuarios
 */
export class UserAdminController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly getUserStatsUseCase: GetUserStatsUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly updateUserByIdUseCase: UpdateUserByIdUseCase
  ) {}

  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.getAllUsersUseCase.execute(page, limit);

      res.json({
        success: true,
        data: {
          users: result.users.map(user => ({
            id: user.getId(),
            nombre: user.getName(),
            correo: user.getEmail().getValue(),
            documento: user.getDocumentNumber().getValue(),
            telefono: user.getPhone(),
            role: user.getRole(),
            estado: user.getStatus(),
            fechaRegistro: user.getRegistrationDate()
          })),
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            hasNext: result.currentPage < result.totalPages,
            hasPrev: result.currentPage > 1
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuarios',
        code: 'GET_USERS_ERROR'
      });
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const term = req.query.term as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.searchUsersUseCase.execute(term, page, limit);

      res.json({
        success: true,
        data: {
          users: result.users.map(user => ({
            id: user.getId(),
            nombre: user.getName(),
            correo: user.getEmail().getValue(),
            documento: user.getDocumentNumber().getValue(),
            telefono: user.getPhone(),
            role: user.getRole(),
            estado: user.getStatus(),
            fechaRegistro: user.getRegistrationDate()
          })),
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            hasNext: result.currentPage < result.totalPages,
            hasPrev: result.currentPage > 1
          },
          searchTerm: term
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar usuarios',
        code: 'SEARCH_USERS_ERROR'
      });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await this.getUserStatsUseCase.execute();

      res.json({
        success: true,
        data: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          admins: stats.admins,
          newUsersThisMonth: stats.newUsersThisMonth,
          inactiveUsers: stats.totalUsers - stats.activeUsers,
          userGrowth: {
            thisMonth: stats.newUsersThisMonth,
            percentage: stats.totalUsers > 0 
              ? Math.round((stats.newUsersThisMonth / stats.totalUsers) * 100) 
              : 0
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
        code: 'GET_STATS_ERROR'
      });
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.getUserByIdUseCase.execute(userId);

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

  async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.activateUserUseCase.execute(userId);

      res.json({
        success: true,
        message: 'Usuario activado exitosamente',
        data: {
          id: user.getId(),
          nombre: user.getName(),
          correo: user.getEmail().getValue(),
          estado: user.getStatus()
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al activar usuario',
        code: 'ACTIVATE_USER_ERROR'
      });
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.deactivateUserUseCase.execute(userId);

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: {
          id: user.getId(),
          nombre: user.getName(),
          correo: user.getEmail().getValue(),
          estado: user.getStatus()
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al desactivar usuario',
        code: 'DEACTIVATE_USER_ERROR'
      });
    }
  }

  async updateUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { nombre, telefono, role } = req.body;

      const user = await this.updateUserByIdUseCase.execute(userId, {
        nombre,
        telefono,
        role
      });

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente por administrador',
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
        message: error.message || 'Error al actualizar usuario',
        code: 'UPDATE_USER_ERROR'
      });
    }
  }
}