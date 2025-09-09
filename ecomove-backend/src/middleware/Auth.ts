import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/UsuarioModel';

interface JWTPayload {
  userId: number;
  correo: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthMiddleware {
  
  /**
   * Generar token JWT para usuario autenticado
   */
  static generateToken(user: any): string {
    const payload: JWTPayload = {
      userId: user.id,
      correo: user.correo,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'ecomove-secret-key-development';
    
    return jwt.sign(payload, secret, {
      expiresIn: '24h',
      issuer: 'ecomove-api'
    });
  }

  /**
   * Middleware de autenticación - Verificar token JWT
   */
  static authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Token de acceso requerido. Use: Authorization: Bearer <token>'
        });
        return;
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      // Verificar token
      const secret = process.env.JWT_SECRET || 'ecomove-secret-key-development';
      const decoded = jwt.verify(token, secret) as JWTPayload;

      // Verificar que el usuario aún existe y está activo
      const usuario = await UsuarioModel.findById(decoded.userId);
      if (!usuario) {
        res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      if (usuario.estado !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
        return;
      }

      // Adjuntar información del usuario al request
      (req as any).user = {
        id: decoded.userId,
        correo: decoded.correo,
        role: decoded.role
      };

      next();

    } catch (error) {
      console.error('Error en autenticación:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  /**
   * Middleware de autorización - Verificar rol de administrador
   */
  static requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }

    next();
  };

  /**
   * Middleware opcional - Autenticación no requerida pero útil si está presente
   */
  static optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No hay token, continuar sin autenticación
        next();
        return;
      }

      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || 'ecomove-secret-key-development';
      
      try {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        
        // Verificar que el usuario existe
        const usuario = await UsuarioModel.findById(decoded.userId);
        if (usuario && usuario.estado === 'active') {
          (req as any).user = {
            id: decoded.userId,
            correo: decoded.correo,
            role: decoded.role
          };
        }
      } catch (tokenError) {
        // Token inválido, pero continuamos sin autenticación
        console.log('Token opcional inválido:', tokenError);
      }

      next();

    } catch (error) {
      console.error('Error en autenticación opcional:', error);
      next(); // Continuar sin autenticación en caso de error
    }
  };

  /**
   * Middleware para verificar ownership (usuario debe ser propietario o admin)
   */
  static requireOwnershipOrAdmin = (userIdParam: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      const targetUserId = parseInt(req.params[userIdParam]);
      
      if (isNaN(targetUserId)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      // Permitir si es admin o si es el propio usuario
      if (user.role === 'admin' || user.id === targetUserId) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    };
  };

  /**
   * Verificar token sin middleware (útil para operaciones manuales)
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const secret = process.env.JWT_SECRET || 'ecomove-secret-key-development';
      return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decodificar token sin verificar (útil para debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar si un token está expirado
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Obtener tiempo restante de un token en segundos
   */
  static getTokenTimeRemaining(token: string): number {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) return 0;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Middleware para logging de requests autenticados
   */
  static logAuthenticatedRequests = (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (user) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${user.correo} (${user.role})`);
    }
    next();
  };
}