// src/config/container.ts - VERSIÓN SOLID
import { Pool } from 'pg';
import { DatabaseConfig } from './database.config';

// Repositories
import { UserRepository } from '../core/domain/repositories/user.repository';
import { PostgreSQLUserRepository } from '../infrastructure/persistence/postgresql/user.repository';

// Services
import { PasswordService } from '../core/domain/services/password.service';
import { BcryptPasswordService } from '../infrastructure/services/bcrypt-password.service';
import { TokenService } from '../core/domain/services/token.service';
import { JwtTokenService } from '../infrastructure/services/jwt-token.service';

// Use Cases
import { RegisterUserUseCase } from '../core/use-cases/user/register-user.use-case';
import { LoginUserUseCase } from '../core/use-cases/user/login-user.use-case';
import { GetUserProfileUseCase } from '../core/use-cases/user/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../core/use-cases/user/update-user-profile.use-case';
import { ChangePasswordUseCase } from '../core/use-cases/user/change-password.use-case';
import { GetAllUsersUseCase } from '../core/use-cases/user/get-all-users.use-case';
import { SearchUsersUseCase } from '../core/use-cases/user/search-users.use-case';
import { GetUserStatsUseCase } from '../core/use-cases/user/get-user-stats.use-case';
import { GetUserByIdUseCase } from '../core/use-cases/user/get-user-by-id.use-case';
import { ActivateUserUseCase } from '../core/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '../core/use-cases/user/deactivate-user.use-case';
import { UpdateUserByIdUseCase } from '../core/use-cases/user/update-user-by-id.use-case';

// Controllers - Especializados
import { AuthController } from '../presentation/http/controllers/auth.controller';
import { UserProfileController } from '../presentation/http/controllers/user-profile.controller';
import { UserAdminController } from '../presentation/http/controllers/user-admin.controller';

// Middleware
import { AuthenticationMiddleware } from '../presentation/http/middleware/authentication.middleware';

/**
 * Contenedor de inyección de dependencias
 * Responsabilidad única: Gestionar la creación e inyección de dependencias
 */
export class DIContainer {
  private static instance: DIContainer;
  private pool: Pool;

  // Repositories
  private userRepository!: UserRepository;

  // Services
  private passwordService!: PasswordService;
  private tokenService!: TokenService;

  // Use Cases
  private registerUserUseCase!: RegisterUserUseCase;
  private loginUserUseCase!: LoginUserUseCase;
  private getUserProfileUseCase!: GetUserProfileUseCase;
  private updateUserProfileUseCase!: UpdateUserProfileUseCase;
  private changePasswordUseCase!: ChangePasswordUseCase;
  private getAllUsersUseCase!: GetAllUsersUseCase;
  private searchUsersUseCase!: SearchUsersUseCase;
  private getUserStatsUseCase!: GetUserStatsUseCase;
  private getUserByIdUseCase!: GetUserByIdUseCase;
  private activateUserUseCase!: ActivateUserUseCase;
  private deactivateUserUseCase!: DeactivateUserUseCase;
  private updateUserByIdUseCase!: UpdateUserByIdUseCase;

  // Controllers - Especializados
  private authController!: AuthController;
  private userProfileController!: UserProfileController;
  private userAdminController!: UserAdminController;

  // Middleware
  private authenticationMiddleware!: AuthenticationMiddleware;

  private constructor() {
    this.pool = DatabaseConfig.createPool();
    this.initializeDependencies();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private initializeDependencies(): void {
    this.initializeRepositories();
    this.initializeServices();
    this.initializeUseCases();
    this.initializeControllers();
    this.initializeMiddleware();
  }

  private initializeRepositories(): void {
    this.userRepository = new PostgreSQLUserRepository(this.pool);
  }

  private initializeServices(): void {
    this.passwordService = new BcryptPasswordService();
    this.tokenService = new JwtTokenService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRES_IN || '24h'
    );
  }

  private initializeUseCases(): void {
    // Use Cases de autenticación
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService
    );

    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService
    );

    // Use Cases de perfil
    this.getUserProfileUseCase = new GetUserProfileUseCase(this.userRepository);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(this.userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.userRepository,
      this.passwordService
    );

    // Use Cases de administración
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    this.searchUsersUseCase = new SearchUsersUseCase(this.userRepository);
    this.getUserStatsUseCase = new GetUserStatsUseCase(this.userRepository);
    this.getUserByIdUseCase = new GetUserByIdUseCase(this.userRepository);
    this.activateUserUseCase = new ActivateUserUseCase(this.userRepository);
    this.deactivateUserUseCase = new DeactivateUserUseCase(this.userRepository);
    this.updateUserByIdUseCase = new UpdateUserByIdUseCase(this.userRepository);
  }

  private initializeControllers(): void {
    // Controlador de autenticación
    this.authController = new AuthController(
      this.registerUserUseCase,
      this.loginUserUseCase
    );

    // Controlador de perfil
    this.userProfileController = new UserProfileController(
      this.getUserProfileUseCase,
      this.updateUserProfileUseCase,
      this.changePasswordUseCase
    );

    // Controlador de administración
    this.userAdminController = new UserAdminController(
      this.getAllUsersUseCase,
      this.searchUsersUseCase,
      this.getUserStatsUseCase,
      this.getUserByIdUseCase,
      this.activateUserUseCase,
      this.deactivateUserUseCase,
      this.updateUserByIdUseCase
    );
  }

  private initializeMiddleware(): void {
    this.authenticationMiddleware = new AuthenticationMiddleware(
      this.tokenService,
      this.userRepository
    );
  }

  // ========== GETTERS ==========

  // Database
  getPool(): Pool {
    return this.pool;
  }

  // Repositories
  getUserRepository(): UserRepository {
    return this.userRepository;
  }

  // Services
  getPasswordService(): PasswordService {
    return this.passwordService;
  }

  getTokenService(): TokenService {
    return this.tokenService;
  }

  // Controllers especializados
  getAuthController(): AuthController {
    return this.authController;
  }

  getUserProfileController(): UserProfileController {
    return this.userProfileController;
  }

  getUserAdminController(): UserAdminController {
    return this.userAdminController;
  }

  // Middleware
  getAuthMiddleware(): AuthenticationMiddleware {
    return this.authenticationMiddleware;
  }

  // ========== UTILIDADES ==========

  async healthCheck(): Promise<{
    status: string;
    dependencies: Record<string, boolean>;
  }> {
    try {
      await this.pool.query('SELECT 1');
      
      return {
        status: 'healthy',
        dependencies: {
          database: true,
          repositories: !!this.userRepository,
          services: !!this.passwordService && !!this.tokenService,
          controllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          middleware: !!this.authenticationMiddleware
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        dependencies: {
          database: false,
          repositories: !!this.userRepository,
          services: !!this.passwordService && !!this.tokenService,
          controllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          middleware: !!this.authenticationMiddleware
        }
      };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}