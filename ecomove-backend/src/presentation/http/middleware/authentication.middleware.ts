import { Request, Response, NextFunction } from 'express';
import { JWTTokenService } from '../../../infrastructure/security/jwt.service';
import { PostgreSQLUserRepository } from '../../../infrastructure/database/repositories/postgresql-user.repository';
import { ApiResponse } from '../../../shared/interfaces/api-response';

export class AuthenticationMiddleware {
  constructor(
    private readonly tokenService: JWTTokenService,
    private readonly userRepository: PostgreSQLUserRepository
  ) {}

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: ApiResponse = {
          success: false,
          message: 'Access token required. Use: Authorization: Bearer <token>'
        };
        res.status(401).json(response);
        return;
      }

      const token = authHeader.substring(7);
      const decoded = this.tokenService.verifyToken(token);

      if (!decoded) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid or expired token'
        };
        res.status(401).json(response);
        return;
      }

      // Verificar que el usuario aún existe y está activo
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive()) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found or inactive'
        };
        res.status(401).json(response);
        return;
      }

      // Adjuntar información del usuario al request
      (req as any).user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication failed'
      };
      res.status(401).json(response);
    }
  };
}