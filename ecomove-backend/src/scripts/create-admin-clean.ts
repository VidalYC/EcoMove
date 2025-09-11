import { DIContainer } from '../config/container';
import { CreateUserUseCase } from '../core/use-cases/user/create-user.use-case';
import { UserRole } from '../shared/enums/user-roles';

const createAdminUser = async (): Promise<void> => {
  try {
    console.log('🔐 Creating admin user with Clean Architecture...');

    const container = DIContainer.getInstance();
    const createUserUseCase = new CreateUserUseCase(container.getUserRepository());

    try {
      const admin = await createUserUseCase.execute({
        name: 'Administrator EcoMove',
        email: 'admin@ecomove.com',
        document: 'admin001',
        password: 'admin123',
        phone: '+573001234567',
        role: UserRole.ADMIN
      });

      console.log('✅ Admin user created successfully');
      console.log('👤 ID:', admin.id);
      console.log('📧 Email:', admin.email.value);
      console.log('🔑 Password: admin123');
      console.log('⚠️  IMPORTANT: Change password in production');

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Admin user already exists');
        console.log('📧 Email: admin@ecomove.com');
        console.log('🔑 Password: admin123');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  createAdminUser()
    .then(() => console.log('🎉 Script completed'))
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { createAdminUser };