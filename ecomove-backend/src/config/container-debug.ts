import { Pool } from 'pg';

export class SimpleContainer {
  private static instance: SimpleContainer;
  private pool?: Pool;

  private constructor() {
    console.log('🔧 Initializing SimpleContainer...');
  }

  static getInstance(): SimpleContainer {
    if (!SimpleContainer.instance) {
      SimpleContainer.instance = new SimpleContainer();
    }
    return SimpleContainer.instance;
  }

  async setupDatabase(): Promise<void> {
    try {
      console.log('🔗 Setting up database connection...');
      
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ecomove',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Database connected successfully');
      
      const result = await client.query('SELECT NOW()');
      console.log('🕒 Database time:', result.rows[0].now);
      
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  getPool(): Pool | undefined {
    return this.pool;
  }
}