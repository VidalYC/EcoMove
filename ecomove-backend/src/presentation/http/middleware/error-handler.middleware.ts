import { Request, Response, NextFunction } from 'express';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { UnauthorizedException } from '../../../shared/exceptions/unauthorized-exception';
import { ForbiddenException } from '../../../shared/exceptions/forbidden-exception';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';

export class ErrorHandlerMiddleware {
  private static logger: LoggerService;

  static setLogger(logger: LoggerService): void {
    this.logger = logger;
  }

  static handle = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    // Log estructurado del error
    const requestId = (req as any).requestId || 'unknown';
    
    this.logger?.error('Global error handler caught error', {
      requestId,
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Error de validación
    if (error instanceof ValidationException) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'VALIDATION_ERROR',
        requestId
      });
      return;
    }

    // Error de no encontrado
    if (error instanceof NotFoundException) {
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'NOT_FOUND',
        requestId
      });
      return;
    }

    // Error de no autorizado
    if (error instanceof UnauthorizedException) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED',
        requestId
      });
      return;
    }

    // Error de prohibido
    if (error instanceof ForbiddenException) {
      res.status(403).json({
        success: false,
        message: error.message,
        code: 'FORBIDDEN',
        requestId
      });
      return;
    }

    // Errores de JWT
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN',
        requestId
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED',
        requestId
      });
      return;
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR',
      requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
}