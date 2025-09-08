import { Router } from 'express';
import usuariosRoutes from './usuarios';
import transportesRoutes from './transportes';
import estacionesRoutes from './estaciones';
import prestamosRoutes from './prestamos';

const router = Router();

// Rutas de API
router.use('/usuarios', usuariosRoutes);
router.use('/transportes', transportesRoutes);
router.use('/estaciones', estacionesRoutes);
router.use('/prestamos', prestamosRoutes);

// Ruta de salud del API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoMove API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: {
      usuarios: 'active',
      transportes: 'active', 
      estaciones: 'active',
      prestamos: 'active'
    }
  });
});

export default router;