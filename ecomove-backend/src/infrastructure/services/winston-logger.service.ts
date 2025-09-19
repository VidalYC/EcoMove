// src/infrastructure/services/winston-logger.service.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface LoggerService {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: any): void;
  debug(message: string, meta?: any): void;
}

export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        isDevelopment ? this.developmentFormat() : winston.format.json()
      ),
      transports: [
        // Console output - diferente formato para desarrollo vs producción
        new winston.transports.Console({
          format: isDevelopment ? this.consoleDevFormat() : winston.format.simple()
        }),
        
        // Error log file
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        
        // Combined log file
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });

    // Crear directorio de logs si no existe
    this.ensureLogsDirectory();
  }

  // ✅ NUEVO: Formato limpio para desarrollo
  private consoleDevFormat() {
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} ${level}: ${message}`;
        
        // Solo mostrar metadata importante en consola
        if (Object.keys(meta).length > 0) {
          const cleanMeta = this.cleanMetaForConsole(meta);
          if (Object.keys(cleanMeta).length > 0) {
            logMessage += ` ${JSON.stringify(cleanMeta)}`;
          }
        }
        
        return logMessage;
      })
    );
  }

  // ✅ NUEVO: Formato para desarrollo (archivos)
  private developmentFormat() {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    );
  }

  // ✅ NUEVO: Limpiar metadata para que sea más legible
  private cleanMetaForConsole(meta: any): any {
    const cleaned: any = {};
    
    // Solo incluir campos importantes en la consola
    const importantFields = ['requestId', 'userId', 'method', 'url', 'statusCode', 'duration', 'error'];
    
    importantFields.forEach(field => {
      if (meta[field] !== undefined) {
        cleaned[field] = meta[field];
      }
    });
    
    return cleaned;
  }

  private ensureLogsDirectory(): void {
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, { 
      error: error?.stack || error,
      timestamp: new Date().toISOString()
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}