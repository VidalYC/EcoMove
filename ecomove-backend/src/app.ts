import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { UsuarioModel } from './models/UsuarioModel';
import routes from './routes';


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

// Rutas principales
app.use('/api/v1', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Bienvenido a EcoMove API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      usuarios: '/api/v1/usuarios',
      docs: '/api/v1/docs (próximamente)'
    }
  });
});

// Middleware de manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Test del modelo Usuario
    console.log('🧪 Probando UsuarioModel...');
    const stats = await UsuarioModel.getStats();
    console.log('📊 Stats usuarios:', stats);
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor EcoMove ejecutándose en http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`👥 Usuarios API: http://localhost:${PORT}/api/v1/usuarios`);
      console.log(`📚 Documentación: http://localhost:${PORT} (endpoints disponibles)`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};
// Iniciar servidor
startServer();