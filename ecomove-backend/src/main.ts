import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DIContainer } from './config/container';
import { ErrorHandlerMiddleware } from './presentation/http/middleware/error-handler.middleware';

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
app.use('/api/v1/users', container.getUserRoutes().createRoutes());

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to EcoMove API (Clean Architecture)',
    version: '2.0.0',
    architecture: 'Clean Architecture + SOLID Principles',
    endpoints: {
      health: '/api/v1/health',
      users: '/api/v1/users',
      documentation: '/api/v1/docs (coming soon)'
    }
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoMove API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    modules: {
      users: 'active',
      database: 'connected'
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
      console.log(`👥 Users API: http://localhost:${PORT}/api/v1/users`);
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