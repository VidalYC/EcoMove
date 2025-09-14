// src/scripts/create-admin-clean.ts
import { DIContainer } from '../config/container';
import { User, UserRole } from '../core/domain/entities/user.entity';

async function createAdmin() {
  const container = DIContainer.getInstance();
  
  try {
    console.log('🚀 Creando usuario administrador...');

    const adminData = {
      nombre: 'Administrador',
      correo: 'admin@ecomove.com',
      documento: '12345678',
      telefono: '3001234567',
      password: 'admin123'
    };

    // Usar el caso de uso de registro
    const registerUseCase = container.getRegisterUserUseCase();
    
    const result = await registerUseCase.execute({
      ...adminData,
      role: UserRole.ADMIN
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email:', adminData.correo);
    console.log('🔑 Contraseña:', adminData.password);
    console.log('🆔 ID:', result.user.getId());

  } catch (error: any) {
    console.error('❌ Error creando administrador:', error.message);
  } finally {
    await container.close();
    process.exit(0);
  }
}

createAdmin();