import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../shared/enums/user-roles';
import { ApiResponse } from '../../../shared/interfaces/api-response';

export class AuthorizationMiddleware {
  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated'
      };
      res.status(401).json(response);
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied. Admin privileges required'
      };
      res.status(403).json(response);
      return;
    }

    next();
  }

  static requireOwnershipOrAdmin(userIdParam: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;
      
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const targetUserId = parseInt(req.params[userIdParam]);
      
      if (isNaN(targetUserId)) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid user ID'
        };
        res.status(400).json(response);
        return;
      }

      // Permitir si es admin o si es el propio usuario
      if (user.role === UserRole.ADMIN || user.id === targetUserId) {
        next();
        return;
      }

      const response: ApiResponse = {
        success: false,
        message: 'Access denied. You can only access your own resources'
      };
      res.status(403).json(response);
    };
  }
}