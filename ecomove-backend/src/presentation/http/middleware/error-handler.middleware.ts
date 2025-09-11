import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../../../shared/exceptions/base-exception';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { ApiResponse } from '../../../shared/interfaces/api-response';

export class ErrorHandlerMiddleware {
  static handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Error:', error);

    // Si es una excepción personalizada
    if (error instanceof BaseException) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
        errors: error instanceof ValidationException ? error.errors : undefined
      };

      res.status(error.statusCode).json(response);
      return;
    }

    // Error genérico
    const response: ApiResponse = {
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    };

    res.status(500).json(response);
  }
}