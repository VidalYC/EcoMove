import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';

export class RequestLoggerMiddleware {
  constructor(private readonly logger: LoggerService) {}

  log = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const { method, url, ip, headers } = req;
    const requestId = this.generateRequestId();
    
    // Agregar requestId al request para tracking
    (req as any).requestId = requestId;
    
    // Log request
    this.logger.info('Incoming request', {
      requestId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      userId: (req as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Log response cuando termine
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      const logLevel = statusCode >= 400 ? 'warn' : 'info';
      
      this.logger[logLevel]('Request completed', {
        requestId,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.id || 'anonymous',
        timestamp: new Date().toISOString()
      });
    });

    next();
  };

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}