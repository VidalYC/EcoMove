// src/presentation/http/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { NotFoundException } from '../../../shared/exceptions/not-found-exception';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { UnauthorizedException } from '../../../shared/exceptions/unauthorized-exception';
import { ForbiddenException } from '../../../shared/exceptions/forbidden-exception';

export class ErrorHandlerMiddleware {
  static handle = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error caught by global handler:', error);

    // Error de validación
    if (error instanceof ValidationException) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Error de no encontrado
    if (error instanceof NotFoundException) {
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'NOT_FOUND'
      });
      return;
    }

    // Error de no autorizado
    if (error instanceof UnauthorizedException) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // Error de prohibido
    if (error instanceof ForbiddenException) {
      res.status(403).json({
        success: false,
        message: error.message,
        code: 'FORBIDDEN'
      });
      return;
    }

    // Errores de JWT
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  };
}