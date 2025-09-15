import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DIContainer } from './config/container';
import { ErrorHandlerMiddleware } from './presentation/http/middleware/error-handler.middleware';
import { UserRoutes } from './presentation/http/routes/v1/user.routes';
import { TransportRoutes } from './presentation/http/routes/v1/transport.routes';
import { StationRoutes } from './presentation/http/routes/v1/station.routes'; // NUEVA IMPORTACIÓN

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Dependency Injection Container
const container = DIContainer.getInstance();

// Rutas principales
const userRoutes = new UserRoutes();
app.use('/api/v1/users', userRoutes.getRouter());
app.use('/api/v1/transports', TransportRoutes.create());
app.use('/api/v1/stations', StationRoutes.create()); // NUEVA RUTA

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to EcoMove API (Clean Architecture)',
    version: '2.0.0',
    architecture: 'Clean Architecture + SOLID Principles',
    endpoints: {
      health: '/api/v1/health',
      users: {
        auth: '/api/v1/users/auth/*',
        profile: '/api/v1/users/profile',
        admin: '/api/v1/users/admin/*'
      },
      transports: '/api/v1/transports/*',
      stations: '/api/v1/stations/*', // AGREGADO
      documentation: '/api/v1/docs (coming soon)'
    }
  });
});

// Health check general
app.get('/api/v1/health', async (req, res) => {
  const healthCheck = await container.healthCheck();
  
  res.json({
    success: true,
    message: 'EcoMove API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    status: healthCheck.status,
    dependencies: healthCheck.dependencies
  });
});

// Middleware catch-all para rutas no encontradas (DEBE IR ANTES del error handler)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
    code: 'ROUTE_NOT_FOUND',
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /api/v1/health',
      users: 'GET /api/v1/users/health',
      transports: 'GET /api/v1/transports/health',
      stations: 'GET /api/v1/stations/health' // AGREGADO
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
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 EcoMove Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/v1/users/auth/`);
      console.log(`👤 Profile: http://localhost:${PORT}/api/v1/users/profile`);
      console.log(`⚙️  Admin: http://localhost:${PORT}/api/v1/users/admin/`);
      console.log(`🚲 Transports: http://localhost:${PORT}/api/v1/transports/`);
      console.log(`🏢 Stations: http://localhost:${PORT}/api/v1/stations/`); // AGREGADO
      console.log(`📚 Architecture: Clean Architecture + SOLID Principles`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

export { app };