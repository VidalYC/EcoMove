import { Router } from 'express';
import usuariosRoutes from './usuarios';
import transportesRoutes from './transportes';

const router = Router();

// Rutas de API
router.use('/usuarios', usuariosRoutes);
router.use('/transportes', transportesRoutes);

// Ruta de salud del API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoMove API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;