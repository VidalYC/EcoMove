import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ecomove',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: false, // Para desarrollo local
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado exitosamente');
    
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Timestamp DB:', result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.error('❌ Error conectando PostgreSQL:', error);
    process.exit(1);
  }
};