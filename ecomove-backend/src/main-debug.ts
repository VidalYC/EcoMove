import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting EcoMove server...');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 EcoMove API is working!',
    version: '2.0.0'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check OK',
    timestamp: new Date().toISOString()
  });
});

console.log('🔧 Setting up server...');

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/v1/health`);
});