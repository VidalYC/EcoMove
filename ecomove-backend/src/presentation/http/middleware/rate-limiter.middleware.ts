import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter general para toda la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Retorna rate limit info en headers
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // 15 minutos en segundos
    });
  }
});

// Rate limiter estricto para autenticación
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Solo 10 intentos de auth por IP por ventana
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de login. Tu IP ha sido bloqueada temporalmente.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // 15 minutos
    });
  }
});

// Rate limiter para operaciones de creación
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 creaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas operaciones de creación. Espera un momento.',
    code: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas operaciones de creación. Espera 1 minuto.',
      code: 'CREATE_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

// Rate limiter para consultas intensivas
export const heavyQueryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // 50 consultas por ventana
  message: {
    success: false,
    message: 'Demasiadas consultas. Intenta de nuevo en unos minutos.',
    code: 'QUERY_RATE_LIMIT_EXCEEDED'
  }
});