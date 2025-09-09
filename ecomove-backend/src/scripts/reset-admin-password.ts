import bcrypt from 'bcryptjs';
import { connectDatabase, pool } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const resetAdminPassword = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    console.log('🔑 Reseteando contraseña del administrador...');

    const newPassword = 'admin123'; // Cambiar según necesidades
    const adminEmail = 'admin@ecomove.com';

    // Verificar que el admin existe
    const adminQuery = await pool.query(
      'SELECT id, nombre, correo FROM usuario WHERE correo = $1 AND role = $2',
      [adminEmail, 'admin']
    );

    if (adminQuery.rows.length === 0) {
      console.log('❌ No se encontró usuario administrador con correo:', adminEmail);
      console.log('💡 Ejecuta: npm run admin:create');
      return;
    }

    const admin = adminQuery.rows[0];

    // Generar nuevo hash
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuario SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, admin.id]
    );

    console.log('✅ Contraseña reseteada exitosamente');
    console.log('👤 Usuario:', admin.nombre);
    console.log('📧 Correo:', admin.correo);
    console.log('🔑 Nueva contraseña:', newPassword);
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del login');

  } catch (error) {
    console.error('❌ Error reseteando contraseña:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  resetAdminPassword()
    .then(() => {
      console.log('🎉 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en script:', error);
      process.exit(1);
    });
}

export { resetAdminPassword };