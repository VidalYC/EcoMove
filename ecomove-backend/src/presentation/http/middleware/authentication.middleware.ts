// src/presentation/http/middleware/authentication.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../../core/domain/services/token.service';
import { UserRepository } from '../../../core/domain/repositories/user.repository';
import { User, UserRole, UserStatus } from '../../../core/domain/entities/user/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    status: string;
    name: string;
  };
  userEntity?: User;
}

export class AuthenticationMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository
  ) {}

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Token de autorización requerido',
          code: 'MISSING_TOKEN'
        });
        return;
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token vacío',
          code: 'EMPTY_TOKEN'
        });
        return;
      }

      const decoded = await this.tokenService.verify(token);
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (user.getStatus() !== UserStatus.ACTIVE) {
        res.status(401).json({
          success: false,
          message: 'Usuario inactivo o suspendido',
          code: 'USER_INACTIVE'
        });
        return;
      }

      req.user = {
        id: user.getId()!,
        email: user.getEmail().getValue(),
        role: user.getRole(),
        status: user.getStatus(),
        name: user.getName()
      };

      req.userEntity = user;
      next();

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
  };

  requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Se requieren permisos de administrador',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
}