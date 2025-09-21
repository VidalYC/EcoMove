// src/main.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DIContainer } from './config/container';
import { ErrorHandlerMiddleware } from './presentation/http/middleware/error-handler.middleware';
import { UserRoutes } from './presentation/http/routes/v1/user.routes';
import { TransportRoutes } from './presentation/http/routes/v1/transport.routes';
import { StationRoutes } from './presentation/http/routes/v1/station.routes';
import { LoanRoutes } from './presentation/http/routes/v1/loan.routes';
import { HealthRoutes } from './presentation/http/routes/v1/health.routes';
import { generalLimiter } from './presentation/http/middleware/rate-limiter.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Dependency Injection Container
const container = DIContainer.getInstance();
const logger = container.getLogger();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging: Solo en desarrollo para requests
if (process.env.NODE_ENV === 'development') {
  app.use(container.getRequestLoggerMiddleware().log);
}

// Logging de inicio del servidor
logger.info('Starting EcoMove Server', {
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: PORT
});

// ✅ RUTAS PRINCIPALES
const userRoutes = new UserRoutes();
const healthRoutes = new HealthRoutes();

app.use('/api/', generalLimiter);
app.use('/api/v1/users', userRoutes.getRouter());
app.use('/api/v1/transports', TransportRoutes.create());
app.use('/api/v1/stations', StationRoutes.create());
app.use('/api/v1/loans', LoanRoutes.create());

// ✅ IMPORTANTE: Health routes ANTES del endpoint individual
app.use('/api/v1/health', healthRoutes.getRouter());

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to EcoMove API (Clean Architecture)',
    version: '2.0.0',
    architecture: 'Clean Architecture + SOLID Principles',
    endpoints: {
      health: {
        basic: '/api/v1/health',
        detailed: '/api/v1/health/detailed',
        database: '/api/v1/health/dependency/database',
        ping: '/api/v1/health/ping'
      },
      users: {
        auth: '/api/v1/users/auth/*',
        profile: '/api/v1/users/profile',
        admin: '/api/v1/users/admin/*'
      },
      transports: '/api/v1/transports/*',
      stations: '/api/v1/stations/*',
      loans: '/api/v1/loans/*',
      documentation: '/api/v1/docs (coming soon)'
    }
  });
});

// ✅ HEALTH CHECK COMPATIBLE (mantener para compatibilidad)
app.get('/health', async (req, res) => {
  try {
    const healthCheck = await container.healthCheck();
    
    res.json({
      success: true,
      message: 'EcoMove API is healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      status: healthCheck.status,
      dependencies: healthCheck.dependencies
    });
  } catch (error) {
    logger.error('Health check failed', error);
    
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware catch-all para rutas no encontradas
app.use((req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: (req as any).requestId
  });

  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
    code: 'ROUTE_NOT_FOUND',
    requestId: (req as any).requestId,
    availableEndpoints: {
      root: 'GET /',
      health: {
        basic: 'GET /api/v1/health',
        detailed: 'GET /api/v1/health/detailed',
        ping: 'GET /api/v1/health/ping'
      },
      users: 'GET /api/v1/users/health',
      transports: 'GET /api/v1/transports/health',
      stations: 'GET /api/v1/stations/health',
      loans: 'GET /api/v1/loans/health'
    }
  });
});

// Middleware de manejo de errores global (debe ir al final)
app.use(ErrorHandlerMiddleware.handle);

// Función para iniciar el servidor
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await container.getPool().query('SELECT NOW()');
    logger.info('Database connected successfully');
    
    app.listen(PORT, () => {
      logger.info('EcoMove Server started successfully', { port: PORT });
      
      console.log(`
🚀 EcoMove API Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/api/v1/health
   ├── Basic:    /api/v1/health/basic
   ├── Detailed: /api/v1/health/detailed
   ├── Database: /api/v1/health/dependency/database
   └── Ping:     /api/v1/health/ping
🔐 Auth:   http://localhost:${PORT}/api/v1/users/auth/
📋 Loans:  http://localhost:${PORT}/api/v1/loans/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    logger.error('Error starting server', error);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Iniciar servidor
startServer();

export { app };