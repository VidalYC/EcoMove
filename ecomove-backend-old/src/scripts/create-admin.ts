import bcrypt from 'bcryptjs';
import { connectDatabase, pool } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

interface AdminUser {
  nombre: string;
  correo: string;
  documento: string;
  password: string;
  telefono: string;
}

const createAdminUser = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    console.log('🔐 Creando usuario administrador...');

    const adminData: AdminUser = {
      nombre: 'Administrador EcoMove',
      correo: 'admin@ecomove.com',
      documento: 'admin001',
      password: 'admin123', // Cambiar en producción
      telefono: '+573001234567'
    };

    // Verificar si ya existe
    const existingAdmin = await pool.query(
      'SELECT id FROM usuario WHERE correo = $1',
      [adminData.correo]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  El usuario administrador ya existe');
      console.log('📧 Correo:', adminData.correo);
      console.log('🔑 Contraseña: admin123');
      return;
    }

    // Generar hash de contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // Insertar usuario administrador
    const query = `
      INSERT INTO usuario (
        nombre, correo, documento, password_hash, 
        estado, role, telefono
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, correo, role
    `;

    const result = await pool.query(query, [
      adminData.nombre,
      adminData.correo,
      adminData.documento,
      passwordHash,
      'active',
      'admin',
      adminData.telefono
    ]);

    const admin = result.rows[0];

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('👤 ID:', admin.id);
    console.log('📧 Correo:', admin.correo);
    console.log('🔑 Contraseña: admin123');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en script:', error);
      process.exit(1);
    });
}

export { createAdminUser };