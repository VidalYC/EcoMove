// test-connection.js
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Configuración actual:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NO DEFINIDA');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ecomove',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testConnection() {
  try {
    console.log('\n🔄 Intentando conectar...');
    
    const client = await pool.connect();
    console.log('✅ Conexión establecida');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query ejecutada exitosamente');
    console.log('⏰ Tiempo actual:', result.rows[0].current_time);
    console.log('📦 Versión PostgreSQL:', result.rows[0].version);
    
    client.release();
    await pool.end();
    
    console.log('✅ TODO FUNCIONA CORRECTAMENTE');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 Soluciones para error de autenticación:');
      console.log('1. Verificar contraseña en .env');
      console.log('2. Probar contraseñas comunes: postgres, admin, password');
      console.log('3. Resetear contraseña de PostgreSQL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL no está ejecutándose:');
      console.log('1. Iniciar servicio de PostgreSQL');
      console.log('2. Verificar puerto 5432');
    } else if (error.code === '3D000') {
      console.log('\n💡 Base de datos no existe:');
      console.log('1. Crear base de datos: CREATE DATABASE ecomove;');
    }
    
    process.exit(1);
  }
}

testConnection();