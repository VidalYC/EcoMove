import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('🚀 Step 1: Loading environment...');
dotenv.config();

console.log('🚀 Step 2: Creating Express app...');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Step 3: Setting up middlewares...');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('🚀 Step 4: Setting up routes...');
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to EcoMove API (Step by Step)',
    version: '2.0.0-debug'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoMove API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-debug'
  });
});

console.log('🚀 Step 5: Testing database connection...');

// Función async para probar la DB
const testDatabase = async () => {
  try {
    const { SimpleContainer } = await import('./config/container-debug');
    const container = SimpleContainer.getInstance();
    await container.setupDatabase();
    console.log('✅ Database test successful');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.log('⚠️  Continuing without database...');
  }
};

console.log('🚀 Step 6: Starting server...');
const startServer = async () => {
  try {
    // Opcional: probar DB
    await testDatabase();
    
    app.listen(PORT, () => {
      console.log(`✅ EcoMove Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`📚 This is the step-by-step debug version`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    console.error('Full error:', error);
    process.exit(1);
  }
};

startServer();